import React from "react";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CodeBracketIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ServerIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  PuzzlePieceIcon,
  KeyIcon,
  GlobeAltIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

// Animation Variants for Framer Motion
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardHoverEffect = {
  scale: 1.03,
  boxShadow: "var(--shadow-lg)",
  borderColor: "var(--color-accent)",
  transition: { duration: 0.3 }
};

// Consistent section styling
const sectionClasses = {
  light: "py-24 lg:py-32 bg-[var(--color-background-alt)]",
  dark: "py-24 lg:py-32 bg-[var(--color-background)]"
};

// Consistent heading styling
const headingClasses = {
  section: "mb-6 text-3xl font-bold text-[var(--color-foreground)] md:text-4xl lg:text-5xl",
  sectionLight: "mb-6 text-3xl font-bold text-[var(--color-foreground-dark)] md:text-4xl lg:text-5xl",
  tagline: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--color-accent)]",
  taglineLight: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(10,25,48,0.1)] text-[var(--color-primary)]",
  card: "mb-4 text-xl font-bold text-[var(--color-foreground)]",
  cardLight: "mb-4 text-xl font-bold text-[var(--color-foreground-dark)]"
};

// Consistent card styling
const cardClasses = "h-full rounded-xl bg-[var(--color-surface)] p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] card-hover";
const cardClassesLight = "h-full rounded-xl bg-[var(--color-surface-light)] p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent)] card-hover";

// Placeholder for actual code snippets - replace these with real examples
const codeSnippets = {
    createPaymentCurlGet: `curl "http://<your_server_address>:5001/create?api_key=YOUR_API_KEY&user_id=USER_123&invoice_id=INV_ABC&amount=1000"`,
    createPaymentCurlPost: `curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '{
       "api_key": "YOUR_API_KEY",
       "user_id": "USER_123",
       "invoice_id": "INV_ABC",
       "amount": 1000
     }' \\
     http://<your_server_address>:5001/create`,
    getAddressCurl: `curl "http://<your_server_address>:5001/address?api_key=YOUR_API_KEY&user_id=USER_123&invoice_id=INV_ABC"`,
    syncDataCurl: `curl "http://<your_server_address>:5001/shared-data?api_key=YOUR_API_KEY"`,
    webhookHandlerNode: `const express = require('express');
const crypto = require('crypto'); // Needed only if comparing tokens securely

const app = express();
app.use(express.json()); // Use middleware to parse JSON bodies

// Store your secrets securely, perhaps associated with user IDs
const ZPAY_WEBHOOK_SECRETS = {
  'user_db_id_example': 'YOUR_CONFIGURED_SECRET_FOR_THIS_USER'
  // ... other secrets
};

app.post('/webhooks/zpay-fund-detection', (req, res) => {
  const authHeader = req.headers['authorization'];
  const receivedToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Extract identifiers from payload FIRST to potentially look up the correct secret
  let userId = null;
  let invoiceId = null;
  let dbUserId = null; // You might not receive dbUserId in the *fund detection* webhook based on latest docs

  // Check payload structure based on the docs for this specific webhook
  if (req.body && req.body.json) {
     invoiceId = req.body.json.invoiceId;
     userId = req.body.json.userId; // Client User ID
     // dbUserId = req.body.json.dbUserId; // If dbUserId is sent, use it here
  } else {
    console.error('Webhook received with invalid payload structure');
    return res.status(400).send('Invalid payload structure');
  }

  // --- IMPORTANT: Implement logic to find the EXPECTED secret ---
  // This is just a placeholder - you need to determine how to map
  // the incoming userId/invoiceId/dbUserId to the correct secret.
  // Maybe look up the user based on userId/invoiceId in your DB?
  const expectedSecret = ZPAY_WEBHOOK_SECRETS['user_db_id_example']; // Replace with your lookup logic

  if (!receivedToken || !expectedSecret) {
    console.warn('Webhook validation failed: Missing received token or expected secret cannot be determined.');
    return res.status(401).send('Unauthorized: Missing token or configuration error');
  }

  // Securely compare the received token with the expected secret
  // Use timingSafeEqual for protection against timing attacks
  try {
      const receivedTokenBuffer = Buffer.from(receivedToken);
      const expectedSecretBuffer = Buffer.from(expectedSecret);

      if (receivedTokenBuffer.length !== expectedSecretBuffer.length ||
          !crypto.timingSafeEqual(receivedTokenBuffer, expectedSecretBuffer)) {
         console.warn('Webhook validation failed: Invalid token');
         return res.status(403).send('Forbidden: Invalid token');
      }
  } catch (error) {
       console.error('Error during token comparison:', error);
       return res.status(500).send('Internal Server Error during validation');
  }


  // --- Token is valid, process the notification ---
  console.log('Received valid fund detection webhook:');
  console.log('Invoice ID:', invoiceId);
  console.log('User ID:', userId);

  // Add your business logic here:
  // - Look up the transaction in your database using invoiceId and userId
  // - Update its status to 'Payment Detected' or 'Processing'
  // - Potentially update UI, etc.
  // Example: updatePaymentStatus(invoiceId, userId, 'processing');

  // Acknowledge receipt
  res.status(200).send('Webhook received successfully');
});

// Helper function (example - adapt to your needs)
function updatePaymentStatus(invoiceId, userId, newStatus) {
  console.log(\`Updating status for Invoice: \${invoiceId}, User: \${userId} to \${newStatus}\`);
  // Your database update logic here...
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(\`Webhook receiver listening on port \${PORT}\`));
`
};

// Helper function to copy text
const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log("Copied to clipboard!");
            // Optional: Add user feedback (e.g., change button text, show toast)
        })
        .catch(err => {
            console.error("Failed to copy text: ", err);
        });
};


export default function Documentation() {
  // State for tracking active tab
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <>
      <Head>
        <title>Developer Documentation | ZVault ZPay</title>
        <meta name="description" content="Comprehensive developer documentation for integrating ZVault ZPay's private payment processing into your applications using our simple and powerful API." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://yourdomain.com/docs" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Developer Documentation | ZVault ZPay" />
        <meta property="og:description" content="Comprehensive documentation for integrating ZPay's private payment processing into your applications." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/docs" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Developer Documentation | ZVault ZPay" />
        <meta name="twitter:description" content="Comprehensive documentation for integrating ZPay's private payment processing into your applications." />
        <meta name="twitter:image" content="https://yourdomain.com/twitter-image.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="var(--color-background)" />
      </Head>

      <main className="min-h-screen" style={{ 
        backgroundColor: "var(--color-background)", 
        color: "var(--color-foreground)" 
      }}>
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden py-28 md:py-36"
          style={{ 
            background: "var(--gradient-blue-gold)",
            color: "var(--color-primary-foreground)" 
          }}
          initial="initial"
          animate="animate"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-crypto-pattern bg-repeat"></div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <CodeBracketIcon className="h-16 w-16 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <motion.h1
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Developer Documentation
              </motion.h1>
              <motion.p
                className="mb-12 text-lg md:text-xl lg:text-2xl mx-auto max-w-3xl"
                style={{ color: "var(--color-foreground)" }}
                variants={fadeInUp}
              >
                Simple, powerful, and privacy-focused payment processing with ZPay
              </motion.p>
              <motion.div
                className="flex flex-col items-center justify-center gap-5 sm:flex-row"
                variants={fadeInUp}
              >
                <a
                  href="#getting-started"
                  onClick={(e) => { e.preventDefault(); setActiveSection("getting-started"); document.getElementById("getting-started")?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="transform rounded-lg px-8 py-4 text-lg font-semibold shadow-md transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)"
                  }}
                >
                  Quick Start Guide
                </a>
                <a
                  href="https://github.com/zvault/zpay-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transform rounded-lg border px-8 py-4 text-lg font-semibold backdrop-blur-sm transition duration-300 ease-in-out hover:-translate-y-1"
                  style={{ 
                    borderColor: "var(--color-border)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--color-primary-foreground)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-accent)";
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  GitHub Repository
                </a>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Floating Orb Animation */}
          <motion.div
            className="absolute -bottom-16 left-1/2 -translate-x-1/2"
            animate={{
              y: [0, -15, 0],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="h-32 w-32 rounded-full blur-2xl" style={{ 
              backgroundColor: "var(--color-accent)"
            }}></div>
          </motion.div>
        </motion.section>

        {/* Documentation Content */}
        <section className={sectionClasses.dark}>
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">
              {/* Sidebar Navigation */}
              <div className="lg:w-1/4">
                <div className="sticky top-6 rounded-xl shadow-lg p-4 border" style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                }}>
                  <nav className="space-y-1">
                    {/* --- Getting Started Group --- */}
                    <h3 className="font-bold mb-2 px-3 pt-2 text-sm uppercase tracking-wider" style={{ color: "var(--color-foreground-alt)" }}>Getting Started</h3>
                    <a
                      href="#getting-started"
                      onClick={(e) => { e.preventDefault(); setActiveSection("getting-started"); document.getElementById("getting-started")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "getting-started" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "getting-started" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "getting-started" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                      <RocketLaunchIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Overview & Quick Start
                    </a>
                    <a
                      href="#account-setup"
                      onClick={(e) => { e.preventDefault(); setActiveSection("account-setup"); document.getElementById("account-setup")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "account-setup" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "account-setup" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "account-setup" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                      <KeyIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Account & API Key Setup
                    </a>

                    {/* --- API Reference Group --- */}
                    <h3 className="font-bold mb-2 px-3 pt-4 text-sm uppercase tracking-wider" style={{ color: "var(--color-foreground-alt)" }}>API Reference</h3>
                    <a
                      href="#api-reference"
                      onClick={(e) => { e.preventDefault(); setActiveSection("api-reference"); document.getElementById("api-reference")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "api-reference" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "api-reference" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "api-reference" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                      <ServerIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      API Overview
                    </a>
                    {/* Sub-items for API endpoints */}
                     <a
                      href="#endpoint-create"
                      onClick={(e) => { e.preventDefault(); setActiveSection("endpoint-create"); document.getElementById("endpoint-create")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "endpoint-create" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "endpoint-create" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "endpoint-create" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      POST /create
                    </a>
                     <a
                      href="#endpoint-address"
                      onClick={(e) => { e.preventDefault(); setActiveSection("endpoint-address"); document.getElementById("endpoint-address")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "endpoint-address" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "endpoint-address" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "endpoint-address" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                       <CodeBracketIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      GET /address
                    </a>
                     <a
                      href="#endpoint-shared-data"
                      onClick={(e) => { e.preventDefault(); setActiveSection("endpoint-shared-data"); document.getElementById("endpoint-shared-data")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center pl-8 pr-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "endpoint-shared-data" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "endpoint-shared-data" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "endpoint-shared-data" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                       <ClipboardDocumentCheckIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                       POST /shared-data
                    </a>


                    {/* --- Webhooks Group --- */}
                    <h3 className="font-bold mb-2 px-3 pt-4 text-sm uppercase tracking-wider" style={{ color: "var(--color-foreground-alt)" }}>Webhooks</h3>
                    <a
                      href="#webhooks"
                      onClick={(e) => { e.preventDefault(); setActiveSection("webhooks"); document.getElementById("webhooks")?.scrollIntoView({ behavior: 'smooth' }); }}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${activeSection === "webhooks" ? 'font-semibold' : 'hover:bg-opacity-10'}`}
                      style={{
                        backgroundColor: activeSection === "webhooks" ? "var(--color-primary-muted)" : "transparent",
                        color: activeSection === "webhooks" ? "var(--color-accent)" : "var(--color-foreground)"
                      }}
                    >
                      <GlobeAltIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Receiving Webhooks
                    </a>
                  </nav>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:w-3/4">
                <div className={cardClasses}>
                  {/* --- Getting Started Section --- */}
                  <article className={`prose max-w-none ${activeSection === "getting-started" ? "block" : "hidden"}`} id="getting-started">
                    <div className="mb-8 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
                      <h2 className={headingClasses.section}>Overview & Quick Start</h2>
                      <p className="mb-6 text-lg" style={{ color: "var(--color-foreground-alt)" }}>
                        ZPay provides a simple API to initiate a privacy-focused Zcash payment process. Integrate ZPay to generate payment addresses and receive notifications.
                      </p>

                      <h3 className="text-xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Integration Steps</h3>

                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>1</div>
                        <div>
                          <h4 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Account Setup</h4>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            <a href="#account-setup" onClick={(e) => { e.preventDefault(); setActiveSection("account-setup"); document.getElementById("account-setup")?.scrollIntoView({ behavior: 'smooth' }); }} className="font-medium" style={{ color: "var(--color-accent)" }}>Set up your ZPay account</a> to get your API key and configure your destination Zcash address and webhook details.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>2</div>
                        <div>
                          <h4 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Create Payment Request</h4>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Call the <a href="#endpoint-create" onClick={(e) => { e.preventDefault(); setActiveSection("endpoint-create"); document.getElementById("endpoint-create")?.scrollIntoView({ behavior: 'smooth' }); }} className="font-medium" style={{ color: "var(--color-accent)" }}><code>POST /create</code></a> endpoint with your API key, user/invoice identifiers, and the amount (in GBP cents). ZPay will return a unique Zcash address (`t_address`) and the calculated ZEC amount.
                          </p>
                           {/* Placeholder for Create Payment Code Snippet */}
                           <div className="text-sm p-4 rounded-lg overflow-x-auto mb-2 bg-gray-800 text-gray-200">
                             <pre><code>{`# Example: Call /create (replace placeholders)
# See API Reference for GET/POST details

# Using POST with curl:
curl -X POST \\
     -H "Content-Type: application/json" \\
     -d '{
       "api_key": "YOUR_API_KEY",
       "user_id": "USER_123",
       "invoice_id": "INV_ABC",
       "amount": 1000  // e.g., £10.00 in cents
     }' \\
     http://<your_server_address>:5001/create

# Expected Success Response:
# {
#   "t_address": "t1...",
#   "ZEC": 0.12345678
# }`}</code></pre>
                           </div>
                           <button
                             className="text-sm mb-4 inline-flex items-center hover:opacity-80"
                             style={{ color: "var(--color-accent)" }}
                             onClick={() => copyToClipboard(codeSnippets.createPaymentCurlPost)}
                           >
                             <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" /> Copy POST Example
                           </button>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>3</div>
                        <div>
                          <h4 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Receive Fund Detection Webhook</h4>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            When funds are detected arriving at the generated `t_address`, ZPay sends a <a href="#webhooks" onClick={(e) => { e.preventDefault(); setActiveSection("webhooks"); document.getElementById("webhooks")?.scrollIntoView({ behavior: 'smooth' }); }} className="font-medium" style={{ color: "var(--color-accent)" }}>webhook notification</a> to your pre-configured endpoint. This payload contains the `userId` and `invoiceId` you provided. Use this to update your application status (e.g., "Processing"). Remember to validate the Bearer token.
                          </p>
                           {/* Placeholder for Webhook Payload Example */}
                           <div className="text-sm p-4 rounded-lg overflow-x-auto mb-2 bg-gray-800 text-gray-200">
                             <pre><code>{`// Example Fund Detection Webhook Payload (Body)
{
  "json": {
    "invoiceId": "INV_ABC",
    "userId": "USER_123"
  }
}`}</code></pre>
                           </div>
                        </div>
                      </div>
                       <p className="mt-6 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                           Note: The ZPay container handles the subsequent steps (shielding, transfers). Transaction hashes and addresses used internally can be retrieved and synced to your database using the <a href="#endpoint-shared-data" onClick={(e) => { e.preventDefault(); setActiveSection("endpoint-shared-data"); document.getElementById("endpoint-shared-data")?.scrollIntoView({ behavior: 'smooth' }); }} className="font-medium" style={{ color: "var(--color-accent)" }}><code>POST /shared-data</code></a> endpoint after the container process completes.
                       </p>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>Key Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          {/* Feature Cards */}
                          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                            <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Simple API</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Straightforward RESTful API for initiating payment processes.
                            </p>
                          </div>
                          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                            <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Privacy Focused</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Leverages Zcash shielded transactions for enhanced privacy during internal transfers.
                            </p>
                          </div>
                          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                            <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Direct Settlements</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Funds are ultimately sent directly to your configured Zcash address.
                            </p>
                          </div>
                          <div className="p-6 rounded-lg border" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                            <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Webhook Notifications</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Receive real-time notification when funds are initially detected.
                            </p>
                          </div>
                      </div>

                      <div className="flex justify-end">
                        <a
                          href="#account-setup"
                          onClick={(e) => { e.preventDefault(); setActiveSection("account-setup"); document.getElementById("account-setup")?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="inline-flex items-center font-medium hover:opacity-80 transition-all duration-300"
                          style={{ color: "var(--color-accent)" }}
                        >
                          Configure Your Account <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </a>
                      </div>
                    </div>
                  </article>

                  {/* --- Account Setup Section --- */}
                  <article className={`prose max-w-none ${activeSection === "account-setup" ? "block" : "hidden"}`} id="account-setup">
                    <h2 className={headingClasses.section}>Account & API Key Setup</h2>
                    <p className="mb-8 text-lg" style={{ color: "var(--color-foreground-alt)" }}>
                      Configure your ZPay account, destination Zcash wallet, API key, and webhook settings.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Prerequisites</h3>
                    <div className="mb-8">
                      <div className="p-4 rounded-lg border mb-6" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                        <h4 className="font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Important Requirement</h4>
                        <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                          You need a destination Zcash address where the final processed funds will be sent. ZPay facilitates the payment process, but all funds are ultimately settled to the address you configure in your account settings.
                        </p>
                      </div>

                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        Setting up a Zcash address:
                      </p>
                      <ul className="list-disc list-inside space-y-2 mt-4 mb-6 pl-4" style={{ color: "var(--color-foreground-alt)" }}>
                        <li>You can use any standard Zcash wallet address (transparent or shielded, though the final send is often to transparent for exchange compatibility).</li>
                        <li>Popular wallets include Zecwallet, Nighthawk, Edge, YWallet, etc.</li>
                        <li>Alternatively, use a deposit address from an exchange supporting ZEC if converting to fiat.</li>
                      </ul>
                    </div>

                    <h3 className="text-xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>ZPay Account Configuration</h3>
                    <div className="mb-8">
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        Within your ZPay dashboard (account creation assumed):
                      </p>
                      <ol className="space-y-6 mt-6">
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>1</div>
                          <div>
                            <h4 className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Add Destination Zcash Address</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Enter the Zcash address where final payments should be sent.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>2</div>
                          <div>
                            <h4 className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Generate API Key</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Navigate to API Keys and generate a new key. Give it a descriptive name (e.g., "MyWebApp Integration"). **Copy the key immediately and store it securely** – it will only be shown once.
                            </p>
                          </div>
                        </li>
                         <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold mr-4 text-sm" style={{ backgroundColor: "var(--color-primary-muted)", color: "var(--color-accent)" }}>3</div>
                          <div>
                            <h4 className="font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>Configure Webhook</h4>
                            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                              Navigate to Webhooks. Enter the URL of your endpoint that will receive the initial "Fund Detection" notification. Generate or enter a secure Webhook Secret (this will be sent as a Bearer token for validation).
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>

                    <h3 className="text-xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>API Key Security</h3>
                     <div className="p-4 rounded-lg border mb-6" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                        <h4 className="font-semibold mb-2" style={{ color: "var(--color-accent)" }}>Important Security Note</h4>
                        <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                           Your API key grants access to initiate payment processes. **Never expose your API key in client-side code (like JavaScript running in a browser).** All API calls using your key should originate from your secure backend server.
                        </p>
                      </div>

                    <div className="flex justify-between mt-8">
                        <a
                          href="#getting-started"
                          onClick={(e) => { e.preventDefault(); setActiveSection("getting-started"); document.getElementById("getting-started")?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="inline-flex items-center font-medium hover:opacity-80"
                          style={{ color: "var(--color-accent)" }}
                        >
                           <ChevronRightIcon className="h-5 w-5 mr-1 transform rotate-180" /> Back to Overview
                        </a>
                        <a
                          href="#api-reference"
                          onClick={(e) => { e.preventDefault(); setActiveSection("api-reference"); document.getElementById("api-reference")?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="inline-flex items-center font-medium hover:opacity-80"
                          style={{ color: "var(--color-accent)" }}
                        >
                          View API Reference <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </a>
                      </div>

                  </article>

                  {/* --- API Reference Section --- */}
                  <article className={`prose max-w-none ${activeSection === "api-reference" || activeSection === 'endpoint-create' || activeSection === 'endpoint-address' || activeSection === 'endpoint-shared-data' ? "block" : "hidden"}`} id="api-reference">
                     {/* Content dynamically injected from api_docs_updated_v1 */}
                     <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>API Reference</h2>

                     <section id="api-overview" className="mb-10 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
                        <h3 className="text-2xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Overview</h3>
                        <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            This API provides endpoints to initiate and manage the ZPay payment processing container. It allows you to request payment address generation and query the status of associated processes.
                        </p>
                        <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Communication should ideally occur over HTTPS if deployed publicly (typically handled by a reverse proxy).
                        </p>

                        <h4 className="text-xl font-semibold mt-6 mb-3" style={{ color: "var(--color-foreground)" }}>Base URL</h4>
                        <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            The API base URL depends on where the Flask application server is deployed. If running locally, it might be:
                        </p>
                        <div className="text-sm p-4 rounded-lg overflow-x-auto mb-6 bg-gray-800 text-gray-200">
                            <pre><code>http://localhost:5001</code></pre>
                            <pre><code>http://127.0.0.1:5001</code></pre>
                        </div>
                         <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Replace `localhost:5001` with the appropriate hostname/IP address and port for your deployment.
                         </p>


                        <h4 className="text-xl font-semibold mt-6 mb-3" style={{ color: "var(--color-foreground)" }}>Authentication</h4>
                        <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            All API requests require a valid `api_key` associated with a user in the ZPay database. The API key must be provided with each request in one of the following ways:
                        </p>
                        <ul className="list-disc list-inside space-y-2 mb-4 pl-4" style={{ color: "var(--color-foreground-alt)" }}>
                            <li><b>For `GET` requests:</b> As a URL query parameter.<br/><code className="text-sm">GET /create?api_key=YOUR_API_KEY&...</code></li>
                            <li><b>For `POST` requests:</b> As a field within the JSON request body.<br/><code className="text-sm">POST /create</code> with body <code className="text-sm">{`{"api_key": "YOUR_API_KEY", ...}`}</code></li>
                        </ul>
                        <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Requests without a valid `api_key` will receive a `401 Unauthorized` error. Note that this is **not** an `Authorization: Bearer` token for these endpoints.
                        </p>

                        <h4 className="text-xl font-semibold mt-6 mb-3" style={{ color: "var(--color-foreground)" }}>Response Format</h4>
                         <p className="mb-2" style={{ color: "var(--color-foreground-alt)" }}>
                            Successful requests (`200 OK`) return a JSON body specific to the endpoint.
                         </p>
                         <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Failed requests return an appropriate HTTP error status code with a JSON body containing an error message:
                         </p>
                         <div className="text-sm p-4 rounded-lg overflow-x-auto mb-6 bg-gray-800 text-gray-200">
                           <pre><code>{`{
  "error": "Descriptive error message"
}`}</code></pre>
                         </div>

                        <h4 className="text-xl font-semibold mt-6 mb-3" style={{ color: "var(--color-foreground)" }}>Error Handling</h4>
                        <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            The API uses standard HTTP status codes:
                        </p>
                        {/* Simplified error table */}
                        <ul className="list-disc list-inside space-y-1 text-sm mb-4 pl-4" style={{ color: "var(--color-foreground-alt)" }}>
                            <li><b>`200 OK`</b>: Success.</li>
                            <li><b>`400 Bad Request`</b>: Invalid request (missing/malformed params).</li>
                            <li><b>`401 Unauthorized`</b>: Invalid or missing `api_key`.</li>
                            <li><b>`415 Unsupported Media Type`</b>: POST body not JSON.</li>
                            <li><b>`500 Internal Server Error`</b>: Server-side issue (Docker, FS, code error).</li>
                            <li><b>`503 Service Unavailable`</b>: Database connection issue.</li>
                        </ul>

                        <h4 className="text-xl font-semibold mt-6 mb-3" style={{ color: "var(--color-foreground)" }}>Rate Limits & Versioning</h4>
                        <p className="mb-4 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Rate limiting and API versioning are not currently implemented.
                        </p>
                     </section>

                     {/* --- Endpoint Details --- */}
                     <section id="endpoint-create" className="mb-10 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
                        <h3 className="text-2xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Create Payment Process</h3>
                         <div className="p-4 rounded-lg border inline-block mb-4" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent-secondary)"}}>GET</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/create</code> &nbsp;&nbsp;
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent)"}}>POST</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/create</code>
                         </div>
                         <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Initiates the ZPay payment process for a specific user and invoice. Creates a DB record, starts a container, waits for an address file, and returns the address and ZEC amount.
                         </p>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Parameters</h4>
                         {/* Parameter Table */}
                         <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border text-sm" style={{ borderColor: "var(--color-border)" }}>
                                <thead style={{ backgroundColor: "var(--color-surface-muted)"}}>
                                    <tr>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Parameter</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Type</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Location</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-alt)" }}>
                                    <tr><td className="p-3 font-mono">api_key</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your API key (Required)</td></tr>
                                    <tr><td className="p-3 font-mono">user_id</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your app's user identifier (Required)</td></tr>
                                    <tr><td className="p-3 font-mono">invoice_id</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your app's invoice identifier (Required)</td></tr>
                                    <tr><td className="p-3 font-mono">amount</td><td className="p-3">number/string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Amount in GBP cents (Required)</td></tr>
                                </tbody>
                            </table>
                         </div>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Example Success Response (200 OK)</h4>
                         <div className="text-sm p-4 rounded-lg overflow-x-auto mb-4 bg-gray-800 text-gray-200">
                           <pre><code>{`{
  "t_address": "t1...",
  "ZEC": 0.12345678
}`}</code></pre>
                         </div>
                         <p className="text-xs italic" style={{ color: "var(--color-foreground-muted)" }}>
                            Note: ZEC value might be null and include a 'warning' field if price calculation fails post-address generation.
                         </p>
                     </section>

                     <section id="endpoint-address" className="mb-10 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
                        <h3 className="text-2xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Get Address / Status</h3>
                         <div className="p-4 rounded-lg border inline-block mb-4" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent-secondary)"}}>GET</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/address</code> &nbsp;&nbsp;
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent)"}}>POST</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/address</code>
                         </div>
                         <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                             Retrieves the generated transparent Zcash address and approximate container runtime for a specific transaction.
                         </p>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Parameters</h4>
                         {/* Parameter Table */}
                         <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border text-sm" style={{ borderColor: "var(--color-border)" }}>
                                <thead style={{ backgroundColor: "var(--color-surface-muted)"}}>
                                    <tr>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Parameter</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Type</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Location</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-alt)" }}>
                                    <tr><td className="p-3 font-mono">api_key</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your API key (Required)</td></tr>
                                    <tr><td className="p-3 font-mono">user_id</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your app's user identifier (Required)</td></tr>
                                    <tr><td className="p-3 font-mono">invoice_id</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your app's invoice identifier (Required)</td></tr>
                                </tbody>
                            </table>
                         </div>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Example Success Response (200 OK)</h4>
                         <div className="text-sm p-4 rounded-lg overflow-x-auto mb-4 bg-gray-800 text-gray-200">
                           <pre><code>{`{
  "address": "t1...",
  "runtime_minutes": 15.23
}
// Or if address file not found:
{
  "address": "Not Available",
  "runtime_minutes": 0.0
}`}</code></pre>
                         </div>
                     </section>

                     <section id="endpoint-shared-data" className="mb-10 pb-6">
                        <h3 className="text-2xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Sync Shared Data to Database</h3>
                         <div className="p-4 rounded-lg border inline-block mb-4" style={{ backgroundColor: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}>
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent-secondary)"}}>GET</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/shared-data</code> &nbsp;&nbsp;
                           <code className="text-sm font-semibold" style={{ color: "var(--color-accent)"}}>POST</code> <code className="text-sm" style={{ color: "var(--color-foreground)"}}>/shared-data</code>
                         </div>
                         <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                             Scans shared files for the user, extracts addresses/txids, and updates the corresponding database Transaction record. Intended for periodic syncing or recovery.
                         </p>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Parameters</h4>
                         {/* Parameter Table */}
                         <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border text-sm" style={{ borderColor: "var(--color-border)" }}>
                                <thead style={{ backgroundColor: "var(--color-surface-muted)"}}>
                                    <tr>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Parameter</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Type</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Location</th>
                                        <th className="p-3 text-left font-medium" style={{ color: "var(--color-foreground-muted)", borderBottom: "1px solid var(--color-border)"}}>Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground-alt)" }}>
                                    <tr><td className="p-3 font-mono">api_key</td><td className="p-3">string</td><td className="p-3">Query (GET) / JSON Body (POST)</td><td className="p-3">Your API key (Required)</td></tr>
                                </tbody>
                            </table>
                         </div>
                         <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Example Success Response (200 OK)</h4>
                         <div className="text-sm p-4 rounded-lg overflow-x-auto mb-4 bg-gray-800 text-gray-200">
                           <pre><code>{`{
  "status": "completed",
  "directories_scanned": 15,
  "directories_with_data": 12,
  "updated_records": 10,
  "failed_or_skipped_updates": 2
}`}</code></pre>
                         </div>
                     </section>

                  </article>

                  {/* --- Webhook Integration Section --- */}
                  <article className={`prose max-w-none ${activeSection === "webhooks" ? "block" : "hidden"}`} id="webhooks">
                    {/* Content dynamically injected from webhook_receiver_docs_v1 */}
                     <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>Receiving Webhooks</h2>
                     <p className="mb-8 text-lg" style={{ color: "var(--color-foreground-alt)" }}>
                        ZPay can send an initial webhook notification when funds are first detected for a transaction.
                     </p>

                     <h3 className="text-xl font-semibold mt-6 mb-4" style={{ color: "var(--color-foreground)" }}>Fund Detection Webhook</h3>
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        This notification is sent via HTTP `POST` to your pre-configured URL as soon as funds arrive in the temporary receiving wallet. It allows your application to update its status promptly (e.g., to "Processing Payment").
                      </p>

                     <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Payload Structure</h4>
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        The request body has the following structure with a `Content-Type: application/json` header:
                      </p>
                      <div className="text-sm p-4 rounded-lg overflow-x-auto mb-6 bg-gray-800 text-gray-200">
                           <pre><code>{`{
  "json": {
    "invoiceId": "INV_ABC",
    "userId": "USER_123"
  }
}`}</code></pre>
                      </div>
                      <p className="text-sm mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        Note: This initial webhook only confirms fund detection and does not contain amounts, addresses used in later steps, or final transaction hashes.
                      </p>

                     <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Security: Bearer Token Validation</h4>
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                        The request includes an `Authorization` header:
                        <code className="block text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded my-2">Authorization: Bearer &lt;YOUR_CONFIGURED_SECRET&gt;</code>
                        Your endpoint **must** validate this token against the secret configured in your ZPay account settings for this integration. Reject requests with missing or invalid tokens (e.g., with status `401` or `403`). Signature verification (e.g., `x-zpay-signature`) is **not** used for this webhook.
                      </p>
                      {/* Example Node.js handler */}
                      <h5 className="text-base font-semibold mt-4 mb-2" style={{ color: "var(--color-foreground)" }}>Example Handler (Node.js/Express)</h5>
                      <div className="text-sm p-4 rounded-lg overflow-x-auto mb-6 bg-gray-800 text-gray-200">
                          <pre><code>{codeSnippets.webhookHandlerNode}</code></pre>
                      </div>
                      <button
                         className="text-sm mb-4 inline-flex items-center hover:opacity-80"
                         style={{ color: "var(--color-accent)" }}
                         onClick={() => copyToClipboard(codeSnippets.webhookHandlerNode)}
                       >
                         <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" /> Copy Node Example
                       </button>

                     <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Responding to the Webhook</h4>
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                         Your endpoint must respond promptly with an HTTP `2xx` status code (e.g., `200 OK`) to acknowledge successful receipt and validation. Processing the payload can occur asynchronously after responding.
                      </p>

                     <h4 className="text-lg font-semibold mt-4 mb-3" style={{ color: "var(--color-foreground)" }}>Processing the Payload</h4>
                      <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                         Use the received `userId` and `invoiceId` to identify the transaction in your system and update its status (e.g., to "Processing"). Final transaction details (hashes, addresses used internally) can be retrieved later using the <code className="text-sm">/shared-data</code> API endpoint.
                      </p>

                  </article>

                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
    );
}
