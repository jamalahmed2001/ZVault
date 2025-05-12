import type { NextApiRequest, NextApiResponse } from 'next';
import * as fsPromises from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver'; // We'll need to install this: npm install archiver @types/archiver
import { promisify } from 'util';

const execAsync = promisify(exec);

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

  const { apiKey, targetServerIp } = req.body;

  if (!apiKey || !targetServerIp) {
    return res.status(400).json({ error: 'Missing required parameters: apiKey or targetServerIp.' });
  }

  const productDir = path.resolve(process.cwd(), 'src', 'server', 'PRODUCT');
  const zpayDir = path.join(productDir, 'ZPAY');
  const createDbSqlPath = path.join(zpayDir, 'create-db.sql');
  const envPath = path.join(zpayDir, '.env');
  const envExamplePath = path.join(zpayDir, '.env.example');
  const releaseDir = path.join(productDir, 'release');
  const tempZipFileName = `custom-package-${Date.now()}.zip`;
  const tempZipPath = path.join(process.cwd(), 'public', tempZipFileName); // Store in public for now

  // Ensure public directory exists
  try {
    await fsPromises.mkdir(path.join(process.cwd(), 'public'), { recursive: true });
  } catch (error) {
    console.error('Failed to create public directory:', error);
    return res.status(500).json({ error: 'Server setup failed.' });
  }


  let originalCreateDbSqlContent: string | null = null;
  let originalEnvContent: string | null = null;
  let envExisted = false;
  let envExampleUsed = false;

  try {
    // 0. Cleanup previous release directory if it exists
    try {
      await fsPromises.rm(releaseDir, { recursive: true, force: true });
      console.log('Cleaned up previous release directory.');
    } catch (cleanupError) {
      console.warn('Could not cleanup previous release directory, it might not exist:', cleanupError);
    }


    // 1. Backup and Modify create-db.sql
    console.log('Reading create-db.sql...');
    originalCreateDbSqlContent = await fsPromises.readFile(createDbSqlPath, 'utf-8');
    let modifiedDbSql = originalCreateDbSqlContent;

    // Remove Zcash address replacement logic
    // Only replace API key for 'apikey1'
    modifiedDbSql = modifiedDbSql.replace(
      /(INSERT INTO "ApiKey" \(id, key, "userId", "transactionFee", "isActive", "updatedAt"\)\s*VALUES \('apikey1', ')[^']*/,
      `$1${apiKey}`
    );
    
    await fsPromises.writeFile(createDbSqlPath, modifiedDbSql, 'utf-8');
    console.log('Modified create-db.sql.');

    // 2. Backup and Modify/Create .env file
    console.log('Processing .env file...');
    try {
      originalEnvContent = await fsPromises.readFile(envPath, 'utf-8');
      envExisted = true;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        console.log('.env not found, checking for .env.example');
        try {
          originalEnvContent = await fsPromises.readFile(envExamplePath, 'utf-8'); // "Backup" example
          envExampleUsed = true;
          await fsPromises.copyFile(envExamplePath, envPath); // Copy example to .env
          console.log('Copied .env.example to .env');
        } catch (exExample: any) {
          if (exExample.code === 'ENOENT') {
            console.log('.env.example also not found. Will create a new .env');
            originalEnvContent = null; // No original content if creating new
          } else {
            throw exExample; // Other error reading example file
          }
        }
      } else {
        throw e; // Other error reading .env file
      }
    }
    
    let currentEnvContent = envExisted ? originalEnvContent! : (envExampleUsed ? originalEnvContent! : '');
    // Add/Update TARGET_SERVER_IP. This is a simple append/replace.
    // A more robust solution might involve parsing and updating specific lines.
    const ipLine = `TARGET_SERVER_IP=${targetServerIp}`;
    if (currentEnvContent.includes('TARGET_SERVER_IP=')) {
      currentEnvContent = currentEnvContent.replace(/TARGET_SERVER_IP=.*/, ipLine);
    } else {
      currentEnvContent += (currentEnvContent ? '\\n' : '') + ipLine;
    }
    await fsPromises.writeFile(envPath, currentEnvContent, 'utf-8');
    console.log('Modified/created .env file.');

    // 3. Execute release.sh
    console.log('Executing release.sh...');
    // Ensure release.sh is executable
    await execAsync(`chmod +x ${path.join(productDir, 'release.sh')}`);
    
    const { stdout: releaseStdout, stderr: releaseStderr } = await execAsync('bash release.sh', { cwd: productDir });
    console.log('release.sh stdout:', releaseStdout);
    if (releaseStderr) {
      console.error('release.sh stderr:', releaseStderr);
      // Depending on the script, stderr might not always mean a fatal error.
      // For now, we'll proceed but log it. If it's critical, throw an error here.
    }
    console.log('Executed release.sh.');

    // 4. Zip the output
    console.log('Zipping the release directory...');
    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(tempZipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`);
        resolve();
      });
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err);
        } else {
          reject(err);
        }
      });
      archive.on('error', (err) => reject(err));
      archive.pipe(output);
      archive.directory(releaseDir, false); // Add the 'release' directory itself to the zip
      archive.finalize();
    });
    console.log(`Zipped to ${tempZipPath}`);

    // 5. Provide download link
    const downloadLink = `/api/download-package?file=${tempZipFileName}`; // You'll need another API route for this
    console.log(`Generated download link: ${downloadLink}`);
    
    // For now, we send the link and expect client to hit another endpoint
    // Or, we could stream the file directly here if preferred.
    // Let's create a placeholder for the actual download handler later.
    // We also need a way to clean up this zip file.
    
    // For simplicity in this step, we'll just return the link.
    // A robust solution needs a download handler and cleanup.
    res.status(200).json({ downloadLink: `/${tempZipFileName}` }); // Direct link to public file

  } catch (error: any) {
    console.error('Error generating custom package:', error);
    res.status(500).json({ error: 'Failed to generate custom package.', details: error.message });
  } finally {
    // 6. Cleanup: Revert changes
    console.log('Starting cleanup...');
    if (originalCreateDbSqlContent) {
      try {
        await fsPromises.writeFile(createDbSqlPath, originalCreateDbSqlContent, 'utf-8');
        console.log('Reverted create-db.sql.');
      } catch (revertError) {
        console.error('Failed to revert create-db.sql:', revertError);
      }
    }

    if (envExisted && originalEnvContent) {
      try {
        await fsPromises.writeFile(envPath, originalEnvContent, 'utf-8');
        console.log('Reverted .env file.');
      } catch (revertError) {
        console.error('Failed to revert .env file:', revertError);
      }
    } else if (envExampleUsed) { // If .env was created from .env.example
      try {
        await fsPromises.unlink(envPath);
        console.log('Deleted temporary .env file (created from example).');
      } catch (deleteError) {
        console.error('Failed to delete temporary .env file:', deleteError);
      }
    } else if (!envExisted && !envExampleUsed && originalEnvContent === null) { // If .env was created from scratch
        try {
            await fsPromises.unlink(envPath);
            console.log('Deleted newly created .env file.');
        } catch (deleteError) {
            console.error('Failed to delete newly created .env file:', deleteError);
        }
    }
    
    // Note: The zip file in 'public/' is not cleaned up here automatically.
    // This should be handled, e.g., by a cron job or a separate cleanup mechanism.
    // Also, the 'release' directory itself could be cleaned up if not needed after zipping.
    // await fs.rm(releaseDir, { recursive: true, force: true }); // Optional: cleanup release dir
    console.log('Cleanup finished.');
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
