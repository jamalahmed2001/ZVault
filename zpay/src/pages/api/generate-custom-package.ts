import type { NextApiRequest, NextApiResponse } from 'next';
import * as fsPromises from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver'; // We'll need to install this: npm install archiver @types/archiver
import { promisify } from 'util';

const execAsync = promisify(exec);

export const config = {
  maxDuration: 300, // 5 min — pnpm install + vite build takes time
};

type Data = {
  downloadLink?: string;
  error?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const startTime = Date.now();
  const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

  const { apiKey, targetServerIp, transactionFee, zcashAddress } = req.body;

  log(`Starting custom package generation for server: ${targetServerIp}`);
  log(`API Key: ${apiKey.substring(0, 8)}...`);
  log(`Transaction Fee: ${transactionFee ?? 'not provided'}`);
  log(`Zcash Address: ${zcashAddress || 'not provided'}`);

  if (!apiKey || !targetServerIp) {
    return res.status(400).json({ error: 'Missing required parameters: apiKey or targetServerIp.' });
  }

  const productDir = path.resolve(process.cwd(), 'src', 'server', 'PRODUCT');
  const zpayDir = path.join(productDir, 'ZPAY');
  const frontendDir = path.join(productDir, 'Z-vault-admin');
  const createDbSqlPath = path.join(zpayDir, 'create-db.sql');
  const envPath = path.join(zpayDir, '.env');
  const envExamplePath = path.join(zpayDir, '.env.example');
  const frontendEnvPath = path.join(frontendDir, '.env');
  const releaseDir = path.join(productDir, 'release');
  const tempZipFileName = `custom-package-${Date.now()}.zip`;
  const tempZipPath = path.join(process.cwd(), 'public', tempZipFileName);

  log(`Product directory: ${productDir}`);
  log(`Release directory: ${releaseDir}`);
  log(`Output zip: ${tempZipFileName}`);

  // Ensure public directory exists
  try {
    await fsPromises.mkdir(path.join(process.cwd(), 'public'), { recursive: true });
  } catch (error) {
    console.error('Failed to create public directory:', error);
    return res.status(500).json({ error: 'Server setup failed.' });
  }


  let originalCreateDbSqlContent: string | null = null;
  let originalEnvContent: string | null = null;
  let originalFrontendEnvContent: string | null = null;
  let frontendEnvExisted = false;
  let envExisted = false;
  let envExampleUsed = false;

  try {
    // 0. Cleanup previous release directory if it exists
    log('[Step 0/6] Cleaning up previous release directory...');
    try {
      await fsPromises.rm(releaseDir, { recursive: true, force: true });
      log('✓ Cleaned up previous release directory.');
    } catch (cleanupError) {
      log('⚠ Could not cleanup previous release directory, it might not exist (continuing...)');
    }

    // 1. Backup and Modify create-db.sql
    log('[Step 1/6] Modifying create-db.sql...');
    try {
      originalCreateDbSqlContent = await fsPromises.readFile(createDbSqlPath, 'utf-8');
      let modifiedDbSql = originalCreateDbSqlContent;

      // Replace API key placeholder
      modifiedDbSql = modifiedDbSql.replace(
        /(INSERT INTO "ApiKey" \(id, key, "userId", "transactionFee", "isActive", "updatedAt"\)\s*VALUES \('apikey1', ')[^']*/,
        `$1${apiKey}`
      );

      // Replace Zcash address placeholder
      if (zcashAddress) {
        modifiedDbSql = modifiedDbSql.replace(
          /(VALUES \('userid1', ')[^']*/,
          `$1${zcashAddress}`
        );
      }

      // Replace transaction fee placeholder
      if (transactionFee !== undefined && transactionFee !== null) {
        modifiedDbSql = modifiedDbSql.replace(
          /(\(SELECT id FROM new_user\), )[0-9.]+(?=, TRUE)/,
          `$1${transactionFee}`
        );
      }

      await fsPromises.writeFile(createDbSqlPath, modifiedDbSql, 'utf-8');
      log('✓ Modified create-db.sql: API key, Zcash address, and transaction fee updated.');
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        log('⚠ create-db.sql not found. Skipping SQL file modification.');
        originalCreateDbSqlContent = null;
      } else {
        throw e;
      }
    }

    // 2. Backup and Modify/Create .env file
    log('[Step 2/6] Processing ZPAY .env file...');
    try {
      originalEnvContent = await fsPromises.readFile(envPath, 'utf-8');
      envExisted = true;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        log('  .env not found, checking for .env.example...');
        try {
          originalEnvContent = await fsPromises.readFile(envExamplePath, 'utf-8');
          envExampleUsed = true;
          await fsPromises.copyFile(envExamplePath, envPath);
          log('  ✓ Copied .env.example to .env');
        } catch (exExample: any) {
          if (exExample.code === 'ENOENT') {
            log('  .env.example also not found. Will create a new .env');
            originalEnvContent = null;
          } else {
            throw exExample;
          }
        }
      } else {
        throw e;
      }
    }
    
    let currentEnvContent = envExisted ? originalEnvContent! : (envExampleUsed ? originalEnvContent! : '');
    const ipLine = `TARGET_SERVER_IP=${targetServerIp}`;
    if (currentEnvContent.includes('TARGET_SERVER_IP=')) {
      currentEnvContent = currentEnvContent.replace(/TARGET_SERVER_IP=.*/, ipLine);
      log(`  Updated TARGET_SERVER_IP to ${targetServerIp}`);
    } else {
      currentEnvContent += (currentEnvContent ? '\n' : '') + ipLine;
      log(`  Added TARGET_SERVER_IP=${targetServerIp}`);
    }
    await fsPromises.writeFile(envPath, currentEnvContent, 'utf-8');
    log('✓ Modified/created ZPAY .env file.');

    // 2.5. Backup and Modify Z-vault-admin .env (Vite bakes VITE_* at build time)
    log('[Step 3/6] Processing Z-vault-admin .env...');
    try {
      originalFrontendEnvContent = await fsPromises.readFile(frontendEnvPath, 'utf-8');
      frontendEnvExisted = true;
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
      originalFrontendEnvContent = null;
    }

    const backendUrl = `http://${targetServerIp}:5001`;
    const frontendEnv = `VITE_API_KEY=${apiKey}\nVITE_API_BASE_URL=${backendUrl}\n`;
    await fsPromises.writeFile(frontendEnvPath, frontendEnv, 'utf-8');
    log(`  ✓ Set VITE_API_BASE_URL=${backendUrl}`);
    log(`  ✓ Set VITE_API_KEY=${apiKey.substring(0, 12)}...`);

    // 3. Execute release.sh
    log('[Step 4/6] Executing release.sh (this may take 1-2 minutes)...');
    const releaseScriptPath = path.join(productDir, 'release.sh');
    try {
      await fsPromises.access(releaseScriptPath);
      log(`  Found release.sh at ${releaseScriptPath}`);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        throw new Error(`release.sh not found at ${releaseScriptPath}. This script is required to build and package the application.`);
      } else {
        throw e;
      }
    }
    
    log('  Making release.sh executable...');
    await execAsync(`chmod +x ${releaseScriptPath}`);
    
    const buildStartTime = Date.now();
    log('  Starting build process (packaging ZPAY backend + building Z-vault-admin frontend)...');
    log('  This includes: pnpm install, vite build, file copying...');
    
    const { stdout: releaseStdout, stderr: releaseStderr } = await execAsync('bash release.sh', {
      cwd: productDir,
      maxBuffer: 50 * 1024 * 1024,
      timeout: 5 * 60 * 1000,
    });
    
    const buildDuration = ((Date.now() - buildStartTime) / 1000).toFixed(1);
    log(`✓ Build completed in ${buildDuration}s`);
    
    if (releaseStdout) {
      const stdoutLines = releaseStdout.split('\n').filter(l => l.trim());
      log(`  Build output (${stdoutLines.length} lines):`);
      stdoutLines.slice(0, 20).forEach(line => log(`    ${line}`));
      if (stdoutLines.length > 20) log(`    ... and ${stdoutLines.length - 20} more lines`);
    }
    
    if (releaseStderr) {
      log(`⚠ Build stderr output:`);
      const stderrLines = releaseStderr.split('\n').filter(l => l.trim());
      stderrLines.slice(0, 10).forEach(line => log(`    ${line}`));
      if (stderrLines.length > 10) log(`    ... and ${stderrLines.length - 10} more lines`);
    }

    // 4. Zip the output
    log('[Step 5/6] Creating zip archive...');
    const zipStartTime = Date.now();
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(tempZipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      let totalBytes = 0;
      archive.on('entry', (entry) => {
        totalBytes += entry.stats?.size || 0;
        if (totalBytes % (10 * 1024 * 1024) === 0) {
          log(`  Compressing... ${(totalBytes / 1024 / 1024).toFixed(1)}MB processed`);
        }
      });

      output.on('close', () => {
        const zipDuration = ((Date.now() - zipStartTime) / 1000).toFixed(1);
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        log(`✓ Archive created: ${sizeMB}MB in ${zipDuration}s`);
        resolve();
      });
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          log(`⚠ Archiver warning: ${err.message}`);
        } else {
          reject(err);
        }
      });
      archive.on('error', (err) => reject(err));
      archive.pipe(output);
      archive.directory(releaseDir, false);
      archive.finalize();
    });
    log(`✓ Zip saved to: ${tempZipPath}`);

    // 5. Provide download link
    log('[Step 6/6] Package generation complete!');
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`Total time: ${totalDuration}s`);
    const downloadLink = `/api/download-package?file=${tempZipFileName}`;
    log(`Download link: ${downloadLink}`);
    
    // For now, we send the link and expect client to hit another endpoint
    // Or, we could stream the file directly here if preferred.
    // Let's create a placeholder for the actual download handler later.
    // We also need a way to clean up this zip file.
    
    // For simplicity in this step, we'll just return the link.
    // A robust solution needs a download handler and cleanup.
    res.status(200).json({ downloadLink: `/${tempZipFileName}` }); // Direct link to public file

  } catch (error: any) {
    const errorDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✗ ERROR after ${errorDuration}s: ${error.message}`);
    if (error.stdout) log(`  Command stdout: ${error.stdout.substring(0, 500)}`);
    if (error.stderr) log(`  Command stderr: ${error.stderr.substring(0, 500)}`);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to generate custom package.', details: error.message });
  } finally {
    // 6. Cleanup: Revert changes
    log('Starting cleanup (reverting modified files)...');
    if (originalCreateDbSqlContent) {
      try {
        await fsPromises.writeFile(createDbSqlPath, originalCreateDbSqlContent, 'utf-8');
        log('  ✓ Reverted create-db.sql');
      } catch (revertError: any) {
        if (revertError.code === 'ENOENT') {
          log('  ⚠ create-db.sql was deleted, skipping revert');
        } else {
          log(`  ✗ Failed to revert create-db.sql: ${revertError.message}`);
        }
      }
    }

    if (envExisted && originalEnvContent) {
      try {
        await fsPromises.writeFile(envPath, originalEnvContent, 'utf-8');
        log('  ✓ Reverted ZPAY .env');
      } catch (revertError) {
        log(`  ✗ Failed to revert ZPAY .env: ${revertError}`);
      }
    } else if (envExampleUsed) {
      try {
        await fsPromises.unlink(envPath);
        log('  ✓ Deleted temporary ZPAY .env (created from example)');
      } catch (deleteError) {
        log(`  ✗ Failed to delete temporary ZPAY .env: ${deleteError}`);
      }
    } else if (!envExisted && !envExampleUsed && originalEnvContent === null) {
      try {
        await fsPromises.unlink(envPath);
        log('  ✓ Deleted newly created ZPAY .env');
      } catch (deleteError) {
        log(`  ✗ Failed to delete newly created ZPAY .env: ${deleteError}`);
      }
    }
    
    // Revert Z-vault-admin .env
    if (frontendEnvExisted && originalFrontendEnvContent !== null) {
      try {
        await fsPromises.writeFile(frontendEnvPath, originalFrontendEnvContent, 'utf-8');
        log('  ✓ Reverted Z-vault-admin .env');
      } catch (revertError) {
        log(`  ✗ Failed to revert Z-vault-admin .env: ${revertError}`);
      }
    } else if (!frontendEnvExisted) {
      try {
        await fsPromises.unlink(frontendEnvPath);
        log('  ✓ Deleted temporary Z-vault-admin .env');
      } catch (deleteError: any) {
        if (deleteError.code !== 'ENOENT') log(`  ✗ Failed to delete Z-vault-admin .env: ${deleteError.message}`);
      }
    }

    log('✓ Cleanup finished.');
  }
}

// You would also need an API route like /api/download-package to serve the file
// and then delete it. For example:
//
// import type { NextApiRequest, NextApiResponse } from 'next';
// import fs from 'fs';
// import path from 'path';
//
// export default function downloadHandler(req: NextApiRequest, res: NextApiResponse) {
//   const { file } = req.query;
//   if (!file || typeof file !== 'string' || !/^[a-zA-Z0-9_.-]+$/.test(file)) {
//     return res.status(400).send('Invalid filename.');
//   }
//
//   const filePath = path.join(process.cwd(), 'public', file);
//
//   if (fs.existsSync(filePath)) {
//     res.setHeader('Content-Disposition', `attachment; filename=${file}`);
//     res.setHeader('Content-Type', 'application/zip'); // Or appropriate MIME type
//     const fileStream = fs.createReadStream(filePath);
//     fileStream.pipe(res);
//
//     fileStream.on('end', () => {
//       fs.unlink(filePath, (err) => { // Delete after sending
//         if (err) console.error('Error deleting temp file:', err);
//         else console.log('Temp file deleted:', filePath);
//       });
//     });
//     fileStream.on('error', (err) => {
//       console.error('Error streaming file:', err);
//       res.status(500).send('Error sending file.');
//     });
//   } else {
//     res.status(404).send('File not found.');
//   }
// }
