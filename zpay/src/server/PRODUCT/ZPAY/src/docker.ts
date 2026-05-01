import { spawn, ChildProcess } from 'child_process';
import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs/promises';
import { delay, getSafeDockerName } from './utils';
import { config } from './config';
import { InternalServerError } from './errors';
import { CreateContainerJobData } from './types';
import Docker from 'dockerode';

const RUN_SCRIPT_HOST_PATH = path.resolve(process.cwd(), 'run.sh');

const DOCKER_CMD = 'docker'; // Or podman if preferred
const MAX_CONCURRENT_CONTAINERS = 1000; // Tune as needed
let runningContainers = 0;
const containerQueue: (() => void)[] = [];

function enqueueContainer(startFn: () => Promise<string>): Promise<string> {
    return new Promise((resolve, reject) => {
        const run = async () => {
            runningContainers++;
            try {
                const result = await startFn();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                runningContainers--;
                if (containerQueue.length > 0) {
                    const next = containerQueue.shift();
                    if (next) next();
                }
            }
        };
        if (runningContainers < MAX_CONCURRENT_CONTAINERS) {
            run();
        } else {
            containerQueue.push(run);
        }
    });
}

async function runDockerCommand(log: FastifyInstance['log'], commandArgs: string[], operationDesc: string): Promise<{ stdout: string, stderr: string, code: number | null }> {
    return new Promise((resolve, reject) => {
        log.info(`Executing Docker command: ${DOCKER_CMD} ${commandArgs.join(' ')}`);
        const process = spawn(DOCKER_CMD, commandArgs);
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('error', (err) => {
            log.error(`Failed to start Docker command for ${operationDesc}: ${err.message}`);
            reject(new InternalServerError(`Failed to execute Docker command: ${err.message}`));
        });

        process.on('close', (code) => {
            if (code !== 0) {
                log.error(`Docker command for ${operationDesc} failed with code ${code}`);
                log.error(`Stderr: ${stderr.trim()}`);
                log.error(`Stdout: ${stdout.trim()}`);
                // Resolve even on failure, let caller check the code
                resolve({ stdout, stderr, code });
            } else {
                log.info(`Docker command for ${operationDesc} executed successfully.`);
                log.debug(`Stdout: ${stdout.trim()}`);
                resolve({ stdout, stderr, code });
            }
        });
    });
}

// Function to check if a container is running
export async function isContainerRunning(log: FastifyInstance['log'], containerName: string): Promise<boolean> {
    const args = ['ps', '--filter', `name=^/${containerName}$`, '--format', '{{.Names}}'];
    try {
        const { stdout, code } = await runDockerCommand(log, args, `check running status for ${containerName}`);
        // Check if code is 0 and stdout contains the name (trim whitespace)
        return code === 0 && stdout.trim() === containerName;
    } catch (error) {
        log.error(`Error checking running status for container ${containerName}: ${error}`);
        return false; // Assume not running on error
    }
}


// Function to start the container asynchronously
export async function startUserContainer(fastify: FastifyInstance, jobData: CreateContainerJobData): Promise<string> {
    return enqueueContainer(() => actuallyStartUserContainer(fastify, jobData));
}

// Move your current startUserContainer logic to a new function:
async function actuallyStartUserContainer(fastify: FastifyInstance, jobData: CreateContainerJobData): Promise<string> {
    const log = fastify.log;
    const containerName = getSafeDockerName(jobData.dbUserId, jobData.clientUserId, jobData.invoiceId);
    const userFolderPath = jobData.userSharedDir;

    log.info(`Starting container creation process for: ${containerName}`);

    // 1. Ensure shared directory exists (should be created by config loader, but double-check)
    try {
        await fs.mkdir(userFolderPath, { recursive: true, mode: 0o777 });
        log.info(`Ensured directory exists: ${userFolderPath}`);
    } catch (error: any) {
        log.error(`Failed to ensure/create directory ${userFolderPath}: ${error.message || error}`);
        throw new InternalServerError(`Could not create shared directory: ${error.message || error}`);
    }

    // 2. Check if container is already running (e.g., from a previous failed API call)
    //    We might not want to start another one if it's already up.
    //    However, the original script used `docker run -d --rm`, implying it expected to start fresh.
    //    Let's stick to that for now, but logging a warning if it exists might be good.
    //    Consider adding a `docker stop` and `docker rm` before run if true cleanup is needed.
    //    const running = await isContainerRunning(log, containerName);
    //    if (running) {
    //        log.warn(`Container ${containerName} appears to be already running. Proceeding with new run command.`);
    //        // Optional: Stop/remove existing container
    //        // await runDockerCommand(log, ['stop', containerName], `stop existing ${containerName}`);
    //        // await runDockerCommand(log, ['rm', containerName], `remove existing ${containerName}`);
    //    }


    // 3. Build Docker command arguments
    // const dockerArgs = [
    //     'run', '-d', '--rm', // Run detached and remove on exit
    //     '--name', containerName,
    //     '--hostname', containerName,
    //     '-e', `EXODUS_WALLET=${jobData.exodusWallet}`,
    //     '-e', `WEBHOOK_URL=${jobData.webhookUrl || ""}`,
    //     '-e', `WEBHOOK_SECRET=${jobData.webhookSecret || ""}`,
    //     '-e', `FEE_PERCENTAGE=${jobData.feePercentage}`, // Pass percentage
    //     '-e', `FEE_DESTINATION_ADDR=${jobData.feeDestinationAddr || ""}`,
    //     '-e', `CONTAINER_TIMEOUT=${jobData.containerTimeout}`,
    //     '-v', `${userFolderPath}:/shared`, // Mount point inside container
    //     config.dockerImageName
    // ];

    // 4. Run Docker command asynchronously
    try {
        const docker = new Docker();
        const binds = [`${userFolderPath}:/shared`];

        // Mount host run.sh into the container to allow hotfixes without rebuilding the image
        try {
            await fs.access(RUN_SCRIPT_HOST_PATH);
            binds.push(`${RUN_SCRIPT_HOST_PATH}:/app/run.sh:ro`);
            log.info(`Mounting host run.sh from ${RUN_SCRIPT_HOST_PATH}`);
        } catch {
            log.warn(`No run.sh found at ${RUN_SCRIPT_HOST_PATH}, using image-baked script`);
        }

        const createOptions = {
            name: containerName,
            Hostname: containerName,
            Env: [
                `EXODUS_WALLET=${jobData.exodusWallet}`,
                `WEBHOOK_URL=${jobData.webhookUrl || ''}`,
                `WEBHOOK_SECRET=${jobData.webhookSecret || ''}`,
                `FEE_PERCENTAGE=${jobData.feePercentage}`,
                `FEE_DESTINATION_ADDR=${jobData.feeDestinationAddr || ''}`,
                `CONTAINER_TIMEOUT=${jobData.containerTimeout}`,
                ...(process.env.LIGHTWALLETD_SERVER
                    ? [`LIGHTWALLETD_SERVER=${process.env.LIGHTWALLETD_SERVER.replace(/localhost|127\.0\.0\.1/g, process.env.ZPAY_DOCKER_HOST_ALIAS || '172.17.0.1')}`]
                    : []),
            ],
            HostConfig: {
                Binds: binds,
                AutoRemove: true,
            },
            Image: config.dockerImageName,
        };
        log.info(`Initiating Dockerode container create & start for: ${containerName}`);
        const container = await docker.createContainer(createOptions);
        await container.start();
        log.info(`Dockerode container ${containerName} creation initiated.`);
        return containerName;
    } catch (error: any) {
        log.error(`Error initiating Dockerode container ${containerName}: ${error.message || error}`);
        throw new InternalServerError(`Failed to initiate container creation: ${error.message || error}`);
    }

    // The client polls /address; orchestrator drives subsequent stages via docker exec.
}

export async function stopUserContainer(log: FastifyInstance['log'], containerName: string): Promise<void> {
    try {
        const docker = new Docker();
        const container = docker.getContainer(containerName);
        await container.stop({ t: 10 });
        log.info(`Container ${containerName} stopped.`);
    } catch (err: any) {
        if (err.statusCode === 304 || err.statusCode === 404) {
            log.info(`Container ${containerName} already stopped/removed.`);
        } else {
            log.warn(`Failed to stop container ${containerName}: ${err.message}`);
        }
    }
}

// Function to get container status and runtime
export async function getContainerStatus(log: FastifyInstance['log'], containerName: string): Promise<{ status: string, startedAt: string | null, runtimeMinutes: number }> {
     const inspectArgs = ['inspect', '--format', '{{json .State}}', containerName];
     let status = "Not Found / Removed";
     let startedAt: string | null = null;
     let runtimeMinutes = 0.0;

     try {
         const { stdout, stderr, code } = await runDockerCommand(log, inspectArgs, `inspect ${containerName}`);

         if (code === 0 && stdout && stdout.trim() !== 'null') {
             try {
                 const stateData = JSON.parse(stdout.trim());
                 status = stateData.Status || 'Unknown';
                 startedAt = stateData.StartedAt || null; // ISO format string

                 if (status === 'running' && startedAt) {
                     try {
                         const startedTime = new Date(startedAt);
                         if (!isNaN(startedTime.getTime())) {
                             const nowUtc = new Date();
                             if (nowUtc >= startedTime) {
                                 const runtimeSeconds = (nowUtc.getTime() - startedTime.getTime()) / 1000;
                                 runtimeMinutes = parseFloat((runtimeSeconds / 60).toFixed(2));
                             } else {
                                 log.warn(`Clock skew detected? Current time ${nowUtc.toISOString()} is before start time ${startedAt} for ${containerName}`);
                             }
                         } else {
                              log.error(`Could not parse Docker timestamp: ${startedAt} for ${containerName}. Invalid date.`);
                              startedAt = 'Invalid Timestamp'; // Indicate parsing failure
                         }
                     } catch (tsErr: any) {
                         log.error(`Error processing Docker timestamp ${startedAt}: ${tsErr.message}`);
                         startedAt = 'Timestamp Processing Error';
                     }
                 } else if (status !== 'running') {
                     log.info(`Container '${containerName}' found but status is: ${status}. StartedAt: ${startedAt}`);
                     runtimeMinutes = 0.0; // Not running, runtime is 0
                 }
             } catch (jsonError: any) {
                 log.error(`Failed to decode JSON from docker inspect for ${containerName}: ${jsonError.message}. Output: ${stdout.trim()}`);
                 status = "Inspect JSON Decode Error";
             }
         } else if (code !== 0) {
              // Inspect failed, likely container doesn't exist or Docker error
              log.info(`Could not inspect container '${containerName}' (Code: ${code}). It may have finished, been removed, or failed to start. Stderr: ${stderr.trim()}`);
             // Status remains "Not Found / Removed"
         }
     } catch (error: any) {
         // Catch errors from runDockerCommand itself
         log.error(`Error during docker inspect processing for ${containerName}: ${error.message || error}`);
         status = "Error During Inspect";
     }

     return { status, startedAt, runtimeMinutes };
}
