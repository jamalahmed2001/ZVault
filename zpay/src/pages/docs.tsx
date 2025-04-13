import React from "react";
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  CodeBracketIcon, 
  ClipboardDocumentCheckIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ServerIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  PuzzlePieceIcon,
  KeyIcon,
  GlobeAltIcon
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

export default function Documentation() {
  // State for tracking active tab
  const [activeSection, setActiveSection] = useState("getting-started");
  
  
    return (
    <>
      <Head>
        <title>Developer Documentation | ZVault ZPay</title>
        <meta name="description" content="Comprehensive developer documentation for integrating ZVault ZPay's private payment processing into your applications using our simple and powerful API." />
        <link rel="canonical" href="https://yourdomain.com/docs" />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
        {/* Hero Section */}
        <motion.section 
          className="relative overflow-hidden py-16 md:py-20"
          style={{ 
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)"
          }}
          initial="initial"
          animate="animate"
        >
          <div className="absolute inset-0 opacity-5 bg-crypto-pattern bg-repeat"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <CodeBracketIcon className="h-16 w-16 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <motion.h1 
                className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Developer Documentation
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl mx-auto max-w-3xl mb-8"
                style={{ color: "var(--color-foreground-alt)" }}
                variants={fadeInUp}
              >
                Simple, powerful, and privacy-focused payment processing with ZPay
              </motion.p>
              <motion.div
                className="flex flex-wrap justify-center gap-4"
                variants={fadeInUp}
              >
                <a 
                  href="#getting-started"
                  onClick={() => setActiveSection("getting-started")}
                  className="rounded-lg px-6 py-3 text-base font-semibold shadow-md transition-all duration-300"
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
                  className="rounded-lg border px-6 py-3 text-base font-semibold backdrop-blur-sm transition-all duration-300"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--color-primary-foreground)"
                  }}
                >
                  GitHub Repository
                </a>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Documentation Content */}
        <section className="py-12">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Sidebar Navigation */}
              <div className="lg:w-1/4">
                <div className="sticky top-6 rounded-xl shadow-lg p-4" style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px" 
                }}>
                  <nav className="space-y-1">
                    <h3 className="font-bold mb-2 px-3 py-2" style={{ color: "var(--color-foreground)" }}>Getting Started</h3>
                    <a 
                      href="#getting-started"
                      onClick={() => setActiveSection("getting-started")}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg ${activeSection === "getting-started" ? "" : ""}`}
                      style={{ 
                        backgroundColor: activeSection === "getting-started" ? "var(--dark-navy-blue)" : "transparent",
                        color: activeSection === "getting-started" ? "var(--color-primary-foreground)" : "var(--color-foreground)" 
                      }}
                    >
                      <RocketLaunchIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Quick Start
                    </a>
                    <a 
                      href="#account-setup"
                      onClick={() => setActiveSection("account-setup")}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg ${activeSection === "account-setup" ? "" : ""}`}
                      style={{ 
                        backgroundColor: activeSection === "account-setup" ? "var(--dark-navy-blue)" : "transparent",
                        color: activeSection === "account-setup" ? "var(--color-primary-foreground)" : "var(--color-foreground)" 
                      }}
                    >
                      <KeyIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Account Setup
                    </a>
                    
                    <h3 className="font-bold mb-2 px-3 py-2 mt-6" style={{ color: "var(--color-foreground)" }}>API Reference</h3>
                    <a 
                      href="#api-reference"
                      onClick={() => setActiveSection("api-reference")}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg ${activeSection === "api-reference" ? "" : ""}`}
                      style={{ 
                        backgroundColor: activeSection === "api-reference" ? "var(--dark-navy-blue)" : "transparent",
                        color: activeSection === "api-reference" ? "var(--color-primary-foreground)" : "var(--color-foreground)" 
                      }}
                    >
                      <ServerIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      API Overview
                    </a>
                    <a 
                      href="#create-payment"
                      onClick={() => setActiveSection("create-payment")}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg ${activeSection === "create-payment" ? "" : ""}`}
                      style={{ 
                        backgroundColor: activeSection === "create-payment" ? "var(--dark-navy-blue)" : "transparent",
                        color: activeSection === "create-payment" ? "var(--color-primary-foreground)" : "var(--color-foreground)" 
                      }}
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Creating Payments
                    </a>
                    <a 
                      href="#webhooks"
                      onClick={() => setActiveSection("webhooks")}
                      className={`flex items-center px-3 py-2 text-sm rounded-lg ${activeSection === "webhooks" ? "" : ""}`}
                      style={{ 
                        backgroundColor: activeSection === "webhooks" ? "var(--dark-navy-blue)" : "transparent",
                        color: activeSection === "webhooks" ? "var(--color-primary-foreground)" : "var(--color-foreground)" 
                      }}
                    >
                      <GlobeAltIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                      Webhook Integration
                    </a>
                  </nav>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="lg:w-3/4">
                <div className="rounded-xl shadow-lg p-8" style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px" 
                }}>
                  {/* Getting Started Section */}
                  <section id="getting-started" className={activeSection === "getting-started" ? "block" : "hidden"}>
                    <div className="mb-8 pb-6" style={{ borderBottomColor: "var(--color-border)", borderBottomWidth: "1px" }}>
                      <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>Quick Start Guide</h2>
                      <p className="mb-6" style={{ color: "var(--color-foreground-alt)" }}>
                        ZPay makes it easy to accept private Zcash payments in your applications. This guide will help you get up and running in minutes.
                      </p>
                      
                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.3)",
                          color: "var(--color-foreground)" 
                        }}>
                          1
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Sign up for ZPay</h3>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            <Link href="/account" style={{ color: "var(--color-accent)" }}>Create a ZPay account</Link> to get your API key and set up your Zcash address to receive payments.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.3)",
                          color: "var(--color-foreground)" 
                        }}>
                          2
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Configure Your Webhook</h3>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Set up a webhook endpoint on your server to receive payment confirmations from ZPay. Enter this URL in your ZPay dashboard settings.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.3)",
                          color: "var(--color-foreground)" 
                        }}>
                          3
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Create a Payment Request</h3>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            Make a POST request to the ZPay API with your user ID, invoice ID, and amount.
                          </p>
                          <div className="text-sm p-4 rounded-lg overflow-x-auto mb-2" style={{ 
                            backgroundColor: "var(--dark-navy-blue)", 
                            color: "var(--color-foreground)" 
                          }}>
                            {/* <pre><code>{codeSnippets.createPayment}</code></pre> */}
                          </div>
                          <button 
                            className="text-sm mb-4 inline-flex items-center"
                            style={{ color: "var(--color-accent)" }}
                            // onClick={() => {navigator.clipboard.writeText(codeSnippets.createPayment)}}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                            Copy to clipboard
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.3)",
                          color: "var(--color-foreground)" 
                        }}>
                          4
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Receive Payment Confirmation</h3>
                          <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                            When a payment is received and confirmed, ZPay will send a webhook notification to your endpoint with the invoice ID, user ID, and a secure key.
                          </p>
                          <div className="text-sm p-4 rounded-lg overflow-x-auto mb-2" style={{ 
                            backgroundColor: "var(--dark-navy-blue)", 
                            color: "var(--color-foreground)" 
                          }}>
                            {/* <pre><code>{codeSnippets.webhookHandler}</code></pre> */}   
                          </div>
                          <button 
                            className="text-sm mb-4 inline-flex items-center"
                            style={{ color: "var(--color-accent)" }}
                            // onClick={() => {navigator.clipboard.writeText(codeSnippets.webhookHandler)}}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                            Copy to clipboard
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>Why Developers Love ZPay</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="p-6 rounded-lg" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.2)", 
                          borderColor: "var(--color-border)", 
                          borderWidth: "1px" 
                        }}>
                          <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Simple API, Maximum Privacy</h4>
                          <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Our API is straightforward and easy to use, while leveraging Zcash's shielded transactions to provide maximum privacy for your customers.
                          </p>
                        </div>
                        <div className="p-6 rounded-lg" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.2)", 
                          borderColor: "var(--color-border)", 
                          borderWidth: "1px" 
                        }}>
                          <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Direct Settlements</h4>
                          <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Your funds go directly to your Zcash address—we never hold your money. No more waiting for payouts or dealing with frozen funds.
                          </p>
                        </div>
                        <div className="p-6 rounded-lg" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.2)", 
                          borderColor: "var(--color-border)", 
                          borderWidth: "1px" 
                        }}>
                          <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Reliable Webhooks</h4>
                          <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Our webhook system ensures you're immediately notified of payment confirmations with secure verification to protect against spoofing.
                          </p>
                        </div>
                        <div className="p-6 rounded-lg" style={{ 
                          backgroundColor: "rgba(7, 18, 36, 0.2)", 
                          borderColor: "var(--color-border)", 
                          borderWidth: "1px" 
                        }}>
                          <h4 className="font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>Developer-Friendly</h4>
                          <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                            Simple REST API, clear documentation, and minimal integration steps—we've designed ZPay with developers in mind.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <a 
                          href="#account-setup"
                          onClick={() => setActiveSection("account-setup")}
                          className="inline-flex items-center font-medium"
                          style={{ color: "var(--color-accent)" }}
                        >
                          View detailed account setup guide <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </a>
                      </div>
                    </div>
                  </section>
                  
                  {/* Account Setup Section */}
                  <section id="account-setup" className={activeSection === "account-setup" ? "block" : "hidden"}>
                    <h2 className="text-3xl font-bold text-blue-800 mb-4">Account Setup</h2>
                    <p className="text-neutral-600 mb-8">
                      Set up your ZPay account and configure your Zcash address to receive payments.
                    </p>
                    
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Account Registration</h3>
                    <div className="mb-8">
                      <p className="text-neutral-600 mb-4">
                        To get started, create a ZPay account and set up your Zcash address:
                      </p>
                      <ol className="space-y-6 mt-6">
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            1
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Create an Account</h4>
                            <p className="text-neutral-600 text-sm">
                              Sign up for a ZPay account at <Link href="/account" className="text-amber-600 hover:text-amber-700">https://zvaultpay.com/account</Link>.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            2
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Set Up Zcash Address</h4>
                            <p className="text-neutral-600 text-sm">
                              Add your Zcash address to your ZPay account settings.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Configuration</h3>
                    <div className="mb-8">
                      <p className="text-neutral-600 mb-4">
                        After setting up your account, you need to configure your Zcash address:
                      </p>
                     
                      
                      <div className="mt-6 space-y-4">
                        <h4 className="font-semibold text-blue-800">Configuration Options</h4>
                        <table className="min-w-full border border-blue-200 rounded-lg overflow-hidden">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Option</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Required</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-blue-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">apiKey</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Yes</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Your ZPay API key from the dashboard</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">environment</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">No</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">'production' or 'sandbox' (default: 'production')</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">timeout</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">number</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">No</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Request timeout in milliseconds (default: 30000)</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">webhookSecret</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">No</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Your webhook secret for verifying signatures</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
                        <h4 className="font-semibold text-blue-800 mb-2">API Key Security</h4>
                        <p className="text-neutral-600 text-sm">
                          <span className="font-medium">Important:</span> Never expose your API key in client-side code. Always make API calls from your server. For frontend applications, create a backend endpoint that interfaces with the ZPay API.
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Environment Setup</h3>
                    <div>
                      <p className="text-neutral-600 mb-4">
                        ZPay provides two environments:
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2">Sandbox Environment</h4>
                          <p className="text-neutral-600 text-sm mb-4">
                            Use for testing without real transactions. The sandbox environment simulates the behavior of the production environment.
                          </p>
                          <div className="text-sm bg-blue-50 p-3 rounded-lg">
                            <code>environment: 'sandbox'</code>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2">Production Environment</h4>
                          <p className="text-neutral-600 text-sm mb-4">
                            Use for processing real payments with actual Zcash transactions.
                          </p>
                          <div className="text-sm bg-blue-50 p-3 rounded-lg">
                            <code>environment: 'production'</code>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-8">
                        <a 
                          href="#getting-started"
                          onClick={() => setActiveSection("getting-started")}
                          className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                          </svg>
                          Back to Quick Start
                        </a>
                        <a 
                          href="#payments"
                          onClick={() => setActiveSection("payments")}
                          className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Processing Payments <ChevronRightIcon className="h-5 w-5 ml-1" />
                        </a>
                      </div>
                    </div>
                  </section>
                  
                  {/* Payments Section */}
                  <section id="payments" className={activeSection === "payments" ? "block" : "hidden"}>
                    <h2 className="text-3xl font-bold text-blue-800 mb-4">Processing Payments</h2>
                    <p className="text-neutral-600 mb-8">
                      Learn how to create, track, and manage payments with the ZPay API.
                    </p>
                    
                    {/* Create Payment section */}
                    <section id="create-payment" className={activeSection === "create-payment" ? "block" : "hidden"}>
                      <h2 className="text-3xl font-bold text-blue-800 mb-4">Creating Payments</h2>
                      <p className="text-neutral-600 mb-8">
                        To create a payment request, send a POST request to our payments endpoint.
                      </p>
                      
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">Endpoint</h3>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8">
                        <p className="font-medium text-blue-800">POST /payments</p>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">Request Parameters</h3>
                      <div className="overflow-x-auto mb-8">
                        <table className="min-w-full border border-blue-200 rounded-lg overflow-hidden">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Parameter</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Required</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-blue-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">userId</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Yes</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Your internal user ID</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">invoiceId</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Yes</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Your internal invoice ID</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">amount</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Yes</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Amount in ZEC (e.g., '0.01')</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">Example Request</h3>
                      <div className="bg-blue-950 text-blue-100 p-4 rounded-lg overflow-x-auto mb-6">
                        {/* <pre><code>{codeSnippets.createPayment}</code></pre> */}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-blue-800 mb-4">Response Parameters</h3>
                      <div className="overflow-x-auto mb-8">
                        <table className="min-w-full border border-blue-200 rounded-lg overflow-hidden">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Parameter</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-blue-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">id</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Unique payment ID generated by ZPay</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">address</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Zcash address for payment</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">amount</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Confirmed amount in ZEC</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>
                    
                    {/* Check Payment Status section */}
                    <section id="check-status" className={activeSection === "check-status" ? "block" : "hidden"}>
                      <h2 className="text-3xl font-bold text-blue-800 mb-4">Checking Payment Status</h2>
                      <p className="text-neutral-600 mb-8">
                        You can check the status of a payment at any time:
                      </p>
                      <div className="bg-blue-950 text-blue-100 p-4 rounded-lg overflow-x-auto mb-6">
                        {/* <pre><code>{codeSnippets.checkStatus}</code></pre> */}
                      </div>
                    </section>
                    
                    {/* Payment Flow section */}
                    <section id="payment-flow" className={activeSection === "payment-flow" ? "block" : "hidden"}>
                      <h2 className="text-3xl font-bold text-blue-800 mb-4">Payment Flow</h2>
                      <p className="text-neutral-600 mb-8">
                        A typical payment flow with ZPay works as follows:
                      </p>
                      
                      <ol className="space-y-6 mt-6">
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            1
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Create Payment</h4>
                            <p className="text-neutral-600 text-sm">
                              Your application creates a payment request using the ZPay API.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            2
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Present Payment Options</h4>
                            <p className="text-neutral-600 text-sm">
                              Display the payment address to the customer, or redirect them to the ZPay payment page, or use a payment button.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            3
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Customer Sends Payment</h4>
                            <p className="text-neutral-600 text-sm">
                              The customer sends the correct amount of ZEC to the provided Zcash address.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            4
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Payment Confirmation</h4>
                            <p className="text-neutral-600 text-sm">
                              ZPay monitors the Zcash network for the payment and notifies your application via webhook when the payment is received and confirmed.
                            </p>
                          </div>
                        </li>
                        <li className="flex">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-4">
                            5
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800 mb-1">Direct Settlement</h4>
                            <p className="text-neutral-600 text-sm">
                              The funds are sent directly to your Zcash address—ZPay never holds your funds.
                            </p>
                          </div>
                        </li>
                      </ol>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-6">
                        <h4 className="font-semibold text-blue-800 mb-2">Important Note</h4>
                        <p className="text-neutral-600 text-sm">
                          For best reliability, always implement webhook handling to receive payment notifications, rather than relying solely on checking payment status via polling.
                        </p>
                      </div>
                    </section>
                  </section>
                  
                  {/* Payment Buttons Section */}
                  <section id="payment-buttons" className={activeSection === "payment-buttons" ? "block" : "hidden"}>
                    <h2 className="text-3xl font-bold text-blue-800 mb-4">Payment Buttons</h2>
                    <p className="text-neutral-600 mb-8">
                      ZPay offers easy-to-implement payment buttons that you can add to your website or application.
                    </p>
                    
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Adding a Payment Button</h3>
                      <p className="text-neutral-600 mb-4">
                        To add a payment button to your website:
                      </p>
                      <div className="bg-blue-950 text-blue-100 p-4 rounded-lg overflow-x-auto mb-6">
                        {/* <pre><code>{codeSnippets.paymentButton}</code></pre> */}
                      </div>
                      
                      <div className="mt-6 space-y-4">
                        <h4 className="font-semibold text-blue-800">Button Customization Options</h4>
                        <table className="min-w-full border border-blue-200 rounded-lg overflow-hidden">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Option</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider border-b border-blue-200">Description</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-blue-200">
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">buttonText</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Custom text for the button (default: 'Pay with Zcash')</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">theme</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">'light', 'dark', or 'custom' (default: 'dark')</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">size</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">string</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">'small', 'medium', or 'large' (default: 'medium')</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">customStyle</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">object</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Custom CSS styles to apply to the button (when theme: 'custom')</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 text-sm font-medium text-neutral-800">showLogo</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">boolean</td>
                              <td className="px-4 py-3 text-sm text-neutral-600">Whether to show the Zcash logo (default: true)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-8">
                        <h4 className="font-semibold text-blue-800 mb-4">Button Examples</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="border border-blue-100 p-4 rounded-lg">
                            <p className="text-sm text-neutral-600 mb-3">Dark Theme (Default)</p>
                            <div className="bg-blue-950 text-white rounded-lg py-3 px-4 flex items-center justify-center w-full">
                              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 0C5.382 0 0 5.382 0 12s5.382 12 12 12 12-5.382 12-12S18.618 0 12 0zm0 22.5C6.21 22.5 1.5 17.79 1.5 12S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5zm-1.688-16.5v3h3.376v1.5h-3.376v3h3.376v1.5h-3.376v3h3.376v1.5h-4.876v-13.5h4.876v1.5h-3.376z" />
                              </svg>
                              Pay with Zcash
                            </div>
                          </div>
                          <div className="border border-blue-100 p-4 rounded-lg">
                            <p className="text-sm text-neutral-600 mb-3">Light Theme</p>
                            <div className="bg-white text-blue-950 border border-blue-200 rounded-lg py-3 px-4 flex items-center justify-center w-full">
                              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 0C5.382 0 0 5.382 0 12s5.382 12 12 12 12-5.382 12-12S18.618 0 12 0zm0 22.5C6.21 22.5 1.5 17.79 1.5 12S6.21 1.5 12 1.5 22.5 6.21 22.5 12 17.79 22.5 12 22.5zm-1.688-16.5v3h3.376v1.5h-3.376v3h3.376v1.5h-3.376v3h3.376v1.5h-4.876v-13.5h4.876v1.5h-3.376z" />
                              </svg>
                              Pay with Zcash
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

