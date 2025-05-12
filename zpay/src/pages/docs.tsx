import Head from "next/head";
import { motion } from "framer-motion";
import { BookOpenIcon, ServerIcon, CloudArrowUpIcon, CogIcon, CodeBracketIcon, CircleStackIcon, CommandLineIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

// Animation variants (can be shared or customized)
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  transition: {
    staggerChildren: 0.15,
  },
};

const sectionClasses = "py-12 md:py-16 bg-surface border-b border-border";
const headingClasses = "text-2xl md:text-3xl font-bold text-foreground mb-3 flex items-center";
const subHeadingClasses = "text-xl md:text-2xl font-semibold text-accent mb-4 mt-8 flex items-center";
const paragraphClasses = "text-foreground-alt leading-relaxed mb-4 text-base md:text-lg";
const codeBlockClasses = "bg-background text-foreground-accent border border-border-accent rounded-md p-4 my-4 text-sm overflow-x-auto font-mono shadow-inner-accent";

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>Deployment Documentation | ZVault Self-Hosted</title>
        <meta name="description" content="Step-by-step guide to deploying your ZVault self-hosted instance for private Zcash payments." />
      </Head>

      <main className="min-h-screen bg-background text-foreground">
        <motion.div 
          className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl"
          variants={staggerContainer}
        >
          <motion.div className="mb-10 text-center sm:text-left" variants={fadeInUp}>
            <motion.h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center justify-center sm:justify-start" variants={fadeInUp}>
              <BookOpenIcon className="h-10 w-10 mr-4 text-accent" />
              ZVault Deployment Guide
            </motion.h1>
            <motion.p className="mt-3 text-lg text-foreground-alt" variants={fadeInUp}>
              Follow these steps to deploy and configure your self-hosted ZVault instance.
            </motion.p>
          </motion.div>

          {/* Introduction Section */}
          <motion.section variants={fadeInUp} className={sectionClasses}>
            <h2 className={headingClasses}>
              <WrenchScrewdriverIcon className="h-7 w-7 mr-3 text-accent" />
              Introduction
            </h2>
            <p className={paragraphClasses}>
              This guide provides a comprehensive walkthrough for deploying the ZVault self-hosted solution. By following these instructions, you will set up the necessary server environment, configure the backend and database, and deploy the application to start accepting shielded Zcash payments on your own infrastructure.
            </p>
            <p className={paragraphClasses}>
              Ensure you have a moderate understanding of server administration, Azure cloud services, and command-line interfaces before proceeding.
            </p>
          </motion.section>

          {/* Prerequisites Section */}
          <motion.section variants={fadeInUp} className={sectionClasses}>
            <h2 className={headingClasses}>
              <CogIcon className="h-7 w-7 mr-3 text-accent" />
              Prerequisites
            </h2>
            <ul className={`list-disc list-inside ${paragraphClasses} space-y-2`}>
              <li>An active Microsoft Azure subscription.</li>
              <li>Azure CLI installed and configured, or access to the Azure Portal.</li>
              <li>SSH client for accessing your server.</li>
              <li><code>scp</code> command-line utility (or an equivalent SFTP client) for file transfers.</li>
              <li>Basic familiarity with Linux command line and <code>ufw</code> (Uncomplicated Firewall).</li>
              <li>Access to your Z-Vault-Admin and ZPAY project repositories/files.</li>
            </ul>
          </motion.section>

          {/* Deployment Steps Section */}
          <motion.section variants={fadeInUp} className={sectionClasses}>
            <h2 className={headingClasses}>
              <CloudArrowUpIcon className="h-7 w-7 mr-3 text-accent" />
              Deployment Steps
            </h2>
            <p className={paragraphClasses}>
              Follow these steps methodically to ensure a successful deployment of your ZVault instance.
            </p>

            {/* Step 0: Azure Server Setup */}
            <h3 className={subHeadingClasses}>
              <ServerIcon className="h-6 w-6 mr-2.5" />
              Step 0: Azure Server Setup & Firewall Configuration
            </h3>
            <p className={paragraphClasses}>
              Begin by provisioning a new virtual machine (VM) on Microsoft Azure. A Linux distribution (e.g., Ubuntu Server 22.04 LTS) is recommended. Once the VM is running, you need to configure its network security group (NSG) in Azure and the local firewall (<code>ufw</code>) on the server to allow traffic on specific ports.
            </p>
            <p className={paragraphClasses}>
              <strong>Ports to open:</strong>
            </p>
            <ul className={`list-disc list-inside ${paragraphClasses} ml-4 space-y-1`}>
              <li><strong>5173:</strong> For the Vite-based Z-Vault-Admin frontend.</li>
              <li><strong>5001:</strong> For the ZPAY backend API service.</li>
              <li><strong>22:</strong> For SSH access (ensure this is restricted to trusted IPs if possible).</li>
            </ul>
            <p className={paragraphClasses}><strong>Azure NSG Configuration:</strong></p>
            <ol className={`list-decimal list-inside ${paragraphClasses} ml-4 space-y-1`}>
              <li>Navigate to your VM in the Azure Portal.</li>
              <li>Go to "Networking" under Settings.</li>
              <li>Click "Add inbound port rule".</li>
              <li>Create rules for ports 5173 (TCP), 5001 (TCP), and ensure SSH (22/TCP) is allowed from your IP.</li>
            </ol>
            <p className={paragraphClasses}><strong>Server Firewall (ufw) Configuration:</strong></p>
            <pre className={codeBlockClasses}>
              <code>
{`sudo ufw allow 22/tcp
`} {/* Ensure SSH is allowed first! */}
{`sudo ufw allow 5173/tcp
`}
{`sudo ufw allow 5001/tcp
`}
{`sudo ufw enable
`}
{`sudo ufw status`}
              </code>
            </pre>
            <p className={`${paragraphClasses} mt-2 text-sm text-warning`}>
              <strong>Important:</strong> Always ensure your SSH port (22) is accessible before enabling <code>ufw</code> to avoid locking yourself out of the server.
            </p>

            {/* Step 1: Update Z-vault-admin .env */}
            <h3 className={subHeadingClasses}>
              <CodeBracketIcon className="h-6 w-6 mr-2.5" />
              Step 1: Configure Z-Vault-Admin Frontend
            </h3>
            <p className={paragraphClasses}>
              Update the <code>.env</code> file in your <code>Z-Vault-Admin</code> project. You need to set the <code>VITE_ZPAY_BACKEND_URL</code> variable to point to your server's public IP address and the ZPAY backend port (5001).
            </p>
            <pre className={codeBlockClasses}>
              <code>
{`# Z-Vault-Admin/.env example
`}
{`VITE_APP_NAME="ZVault Admin"
`}
{`VITE_ZPAY_BACKEND_URL="http://<YOUR_SERVER_IP>:5001"
`}
{`# Add other environment variables as needed`}
              </code>
            </pre>
            <p className={paragraphClasses}>
              Replace <code>&lt;YOUR_SERVER_IP&gt;</code> with the actual public IP address of your Azure VM.
            </p>

            {/* Step 2: Update ZPAY create-db.sql */}
            <h3 className={subHeadingClasses}>
              <CircleStackIcon className="h-6 w-6 mr-2.5" />
              Step 2: Prepare ZPAY Database Initialization Script
            </h3>
            <p className={paragraphClasses}>
              Before deploying the ZPAY backend, you need to customize the <code>create-db.sql</code> script. This script initializes the database and sets up the initial user and API key for administrative access.
            </p>
             <p className={paragraphClasses}>
              Locate the <code>create-db.sql</code> file within your ZPAY backend project. You will need to modify the placeholder values for <code>user_id</code> and <code>api_key</code>. Choose a secure, unique API key.
            </p>
            <pre className={codeBlockClasses}>
              <code>
{`-- ZPAY/db/create-db.sql (Example Snippet - actual content may vary)
`}
{`-- ... other SQL setup ...

`}
{`-- Ensure this section is present and correctly inserts your initial admin user and API key
`}
{`INSERT INTO users (id, email, name, role) VALUES ('your_chosen_user_id', 'admin@example.com', 'Admin User', 'ADMIN');
`}
{`INSERT INTO api_keys (key, user_id, status) VALUES ('your_secure_api_key_here', 'your_chosen_user_id', 'ACTIVE');

`}
{`-- ... other SQL setup ...`}
              </code>
            </pre>
            <p className={paragraphClasses}>
              Replace <code>'your_chosen_user_id'</code> with a unique identifier for the admin user and <code>'your_secure_api_key_here'</code> with a strong, randomly generated API key. This API key will be used by the Z-Vault-Admin frontend to communicate with the backend.
            </p>
            <p className={`${paragraphClasses} mt-2 text-sm text-warning`}>
              <strong>Security Note:</strong> Treat this API key like a password. It provides administrative access to your ZPAY instance.
            </p>

            {/* Step 3: Build & Package Release */}
            <h3 className={subHeadingClasses}>
              <CommandLineIcon className="h-6 w-6 mr-2.5" />
              Step 3: Build and Package Application (<code>release.sh</code>)
            </h3>
            <p className={paragraphClasses}>
              The <code>release.sh</code> script is responsible for building both the frontend (Z-Vault-Admin) and backend (ZPAY) applications and packaging them into a distributable format (e.g., a <code>.zip</code> file).
            </p>
            <p className={paragraphClasses}>
              Navigate to the root directory where your <code>release.sh</code> script is located (this might be a top-level project directory containing both frontend and backend projects or within a specific deployment scripts folder). Execute the script:
            </p>
            <pre className={codeBlockClasses}>
              <code>{`./release.sh`}</code>
            </pre>
            <p className={paragraphClasses}>
              This script should handle all necessary build steps (e.g., <code>npm run build</code> for both projects) and then create a compressed archive (e.g., <code>release.zip</code>) containing the build artifacts and necessary deployment files (like <code>deploy.sh</code> and Docker configurations if used).
            </p>

            {/* Step 3.5: Transfer to Server */}
            <h3 className={subHeadingClasses}>
              <CloudArrowUpIcon className="h-6 w-6 mr-2.5" />
              Step 3.5: Transfer Release Package to Server
            </h3>
            <p className={paragraphClasses}>
              Once the <code>release.zip</code> (or similarly named archive) is created, transfer it to your Azure VM. Use <code>scp</code> or any SFTP client for this.
            </p>
            <pre className={codeBlockClasses}>
              <code>{`scp ./release.zip your_azure_username@<YOUR_SERVER_IP>:/path/to/deployment_directory`}</code>
            </pre>
            <p className={paragraphClasses}>
              Replace <code>your_azure_username</code> with your SSH username for the VM, <code>&lt;YOUR_SERVER_IP&gt;</code> with the VM's public IP, and <code>/path/to/deployment_directory</code> with your desired location on the server (e.g., <code>/srv/zvault</code> or <code>~/zvault-deployment</code>). Create this directory on the server if it doesn't exist.
            </p>

            {/* Step 4: Deploy on Server */}
            <h3 className={subHeadingClasses}>
              <CogIcon className="h-6 w-6 mr-2.5" />
              Step 4: Deploy Application on Server (<code>deploy.sh</code>)
            </h3>
            <p className={paragraphClasses}>
              SSH into your Azure VM. Navigate to the directory where you uploaded <code>release.zip</code>. Unzip the archive and then execute the <code>deploy.sh</code> script.
            </p>
            <pre className={codeBlockClasses}>
              <code>
{`ssh your_azure_username@<YOUR_SERVER_IP>
`}
{`cd /path/to/deployment_directory
`}
{`unzip release.zip
`}
{`# The deploy script might need execute permissions
`}
{`chmod +x deploy.sh
`}
{`sudo ./deploy.sh`} {/* Or run without sudo if it handles permissions internally or installs to user space */}
              </code>
            </pre>
            <p className={paragraphClasses}>
              The <code>deploy.sh</code> script should handle tasks such as:
            </p>
            <ul className={`list-disc list-inside ${paragraphClasses} ml-4 space-y-1`}>
              <li>Setting up prerequisites on the server (e.g., Docker, Node.js, PM2, Caddy/Nginx if used).</li>
              <li>Initializing the database using the modified <code>create-db.sql</code>.</li>
              <li>Configuring and starting the ZPAY backend service (e.g., using Docker Compose or PM2).</li>
              <li>Configuring and starting the Z-Vault-Admin frontend (e.g., serving static files via Caddy/Nginx or a simple Node.js server).</li>
              <li>Setting up reverse proxies if used (e.g., Caddy or Nginx to handle SSL and proxy requests to ports 5001 and 5173).</li>
            </ul>
            <p className={paragraphClasses}>
              Monitor the output of <code>deploy.sh</code> for any errors. Consult its contents or related documentation if issues arise.
            </p>

            {/* Step 5: Frontend Configuration (Final Checks) */}
            <h3 className={subHeadingClasses}>
              <CodeBracketIcon className="h-6 w-6 mr-2.5" />
              Step 5: Final Frontend Configuration & Verification
            </h3>
            <p className={paragraphClasses}>
              After the <code>deploy.sh</code> script completes, your ZVault instance should be running. The primary frontend configuration (<code>VITE_ZPAY_BACKEND_URL</code>) was done in Step 1. However, you might need to perform final checks or configurations depending on your setup.
            </p>
            <p className={paragraphClasses}>
              Access your Z-Vault-Admin dashboard by navigating to <code>http://&lt;YOUR_SERVER_IP&gt;:5173</code> in your web browser. Test the login using the credentials related to the <code>user_id</code> you configured in <code>create-db.sql</code> (if your admin app has a login system beyond just API key usage) and the API key itself when prompted or in settings.
            </p>
            <p className={paragraphClasses}>
              Verify that the dashboard can communicate with the backend (e.g., by fetching data or performing actions that require API calls). Check browser console for any errors related to API connectivity.
            </p>
             <p className={paragraphClasses}>
              If you have set up a domain name and SSL (e.g., via Caddy or Nginx as part of <code>deploy.sh</code>), you should access the application via <code>https://yourdomain.com</code>.
            </p>

            {/* Troubleshooting Section (Placeholder) */}
            <h3 className={subHeadingClasses}>
              <WrenchScrewdriverIcon className="h-6 w-6 mr-2.5" />
              Troubleshooting
            </h3>
            <p className={paragraphClasses}>
              If you encounter issues:
            </p>
            <ul className={`list-disc list-inside ${paragraphClasses} ml-4 space-y-1`}>
              <li><strong>Check Service Logs:</strong> For PM2: <code>pm2 logs</code>. For Docker: <code>docker logs &lt;container_name&gt;</code>.</li>
              <li><strong>Firewall:</strong> Double-check Azure NSG rules and server <code>ufw status</code>.</li>
              <li><strong>Backend API:</strong> Use <code>curl http://localhost:5001/health</code> (or similar health check endpoint) on the server to see if the backend is running.</li>
              <li><strong>Frontend Build:</strong> Ensure the <code>.env</code> for the frontend was correctly updated with the server IP before building.</li>
              <li><strong>Database:</strong> Verify the database was initialized correctly and the ZPAY backend can connect to it.</li>
            </ul>
          </motion.section>

        </motion.div>
      </main>
    </>
  );
} 