import { signIn, signOut, useSession } from "next-auth/react";
import React, { useState, useEffect, useRef } from 'react';
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
// import { api } from "@/utils/api"; // Assuming tRPC setup
import { motion, AnimatePresence } from "framer-motion";
import { LockClosedIcon, LockOpenIcon, BoltIcon, CodeBracketIcon, ShieldCheckIcon, CurrencyDollarIcon, CogIcon, ArrowRightIcon } from '@heroicons/react/24/outline'; // Using Heroicons
// Removed unused LockOpenIcon import if not used

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

// Consistent section styling with reduced padding
const sectionClasses = {
  light: "py-16 lg:py-24 bg-[var(--color-background-alt)]",
  dark: "py-16 lg:py-24 bg-[var(--color-background)]"
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

// Add a new cardClassesLight constant
const cardClassesLight = "h-full rounded-xl bg-[var(--color-surface-light)] p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent)] card-hover";

// Padlock animation variants
const padlockVariants = {
  initial: { opacity: 1, scale: 1 },
  animate: {
    scale: [1, 1.15, 1, 1.1, 1],
    rotate: [0, 0, -5, 5, 0],
    transition: { duration: 4, times: [0, 0.2, 0.4, 0.45, 0.5], ease: "easeInOut" }
  }
};

// Icon transition variants (for the three-stage animation)
const iconTransitionVariants = {
  locked: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: [1, 1, 0, 0, 0],
      scale: [1, 1.1, 1.2, 0.8, 0],
      transition: { duration: 4, times: [0, 0.25, 0.3, 0.32, 0.35], ease: "easeInOut" }
    }
  },
  unlocked: {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: [0, 0, 1, 1, 0],
      scale: [0, 0, 1.2, 1, 0],
      transition: { duration: 4, times: [0, 0.3, 0.35, 0.6, 0.65], ease: "easeInOut" }
    }
  },
  shield: {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: [0, 0, 0, 0, 1, 1],
      scale: [0, 0, 0, 0.8, 1.2, 1],
      transition: { duration: 4, times: [0, 0.6, 0.65, 0.7, 0.85, 1], ease: "easeOut" }
    }
  }
};

// Content reveal variants (delayed to match the longer animation)
const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 3, duration: 0.8, ease: "easeOut" } // Increased delay for longer animation
  }
};

// Gold button tagline style (for reuse throughout the page)
const goldTaglineStyle = {
  backgroundColor: "rgba(212,175,55,0.15)",
  color: "var(--color-accent)",
  border: "1px solid var(--color-accent)",
  boxShadow: "0 2px 8px rgba(212,175,55,0.2)"
};

export default function Home() {
  const { data: sessionData } = useSession();
  const currentYear = new Date().getFullYear();

  return (
    <>
      <Head>
        {/* --- Basic Meta Tags --- */}
        <title>ZVault Self-Hosted | Private Automation on Your Infrastructure</title>
        <meta name="description" content="Deploy ZVault on your own infrastructure. Self-hosted privacy automation with a Vite dashboard, TypeScript API, and one-time transactional containers. £500 license for 250 containers/month." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://z-vault.vercel.app" /> {/* Replace with your actual domain */}

        {/* --- Open Graph Meta Tags (for Facebook, LinkedIn, etc.) --- */}
        <meta property="og:title" content="ZVault Self-Hosted | Private Automation on Your Infrastructure" />
        <meta property="og:description" content="Deploy ZVault on your own infrastructure. Self-hosted privacy automation with a Vite dashboard, TypeScript API, and one-time transactional containers. £500 license for 250 containers/month." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://z-vault.vercel.app" /> {/* Replace with your actual domain */}
        <meta property="og:image" content="https://z-vault.vercel.app/og-image.png" /> {/* Replace with your OG image URL */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* --- Twitter Card Meta Tags --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZVault Self-Hosted | Private Automation on Your Infrastructure" />
        <meta name="twitter:description" content="Deploy ZVault on your own infrastructure. Self-hosted privacy automation with a Vite dashboard, TypeScript API, and one-time transactional containers. £500 license for 250 containers/month." />
        <meta name="twitter:image" content="https://z-vault.vercel.app/twitter-image.png" /> {/* Replace with your Twitter image URL */}
        {/* Optional: <meta name="twitter:site" content="@YourTwitterHandle" /> */}
        {/* Optional: <meta name="twitter:creator" content="@CreatorTwitterHandle" /> */}

        {/* --- Theme Color --- */}
        <meta name="theme-color" content="var(--color-background)" /> {/* Updated to use CSS variable */}
      </Head>

      <main className="min-h-screen" style={{
        backgroundColor: "var(--color-background)",
        color: "var(--color-foreground)"
      }}>
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
          style={{
            background: "var(--gradient-blue-gold)",
            color: "var(--color-primary-foreground)"
          }}
          initial="initial"
          animate="animate"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 bg-crypto-pattern bg-repeat"></div>
          
          {/* Abstract shapes */}
          <div className="absolute top-1/4 right-10 h-40 w-40 rounded-full opacity-20 blur-2xl"
            style={{ background: "var(--color-accent)" }}></div>
          <div className="absolute bottom-1/3 left-10 h-32 w-32 rounded-full opacity-15 blur-2xl"
            style={{ background: "var(--color-primary)" }}></div>

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              className="mx-auto max-w-4xl text-center"
              variants={staggerContainer}
            >
              <motion.div
                className="mb-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold backdrop-blur-sm"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-foreground)",
                  boxShadow: "0 4px 14px rgba(212,175,55,0.25)"
                }}
                variants={fadeInUp}
              >
                🚀 Introducing ZVault AutoShield
              </motion.div>
              <motion.h1
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Accept <span style={{ color: "var(--color-accent)" }}>Shielded Zcash</span> <br />
                <span className="block mt-2">On Your Infrastructure</span>
              </motion.h1>
              <motion.p
                className="mb-6 text-lg md:text-xl lg:text-2xl mx-auto max-w-3xl"
                style={{ 
                  color: "var(--color-foreground)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)"
                }}
                variants={fadeInUp}
              >
                ZVault AutoShield empowers your business to accept shielded Zcash (ZEC) payments—fully auditable for compliance, yet uncompromising on customer privacy. All data and processing remain exclusively on your infrastructure. No third-party risk. No data leakage.
              </motion.p>
              <motion.p
                className="mb-10 text-base md:text-lg mx-auto max-w-2xl"
                style={{ color: "var(--color-accent)" }}
                variants={fadeInUp}
              >
                Built for financial and technical leaders: granular audit trails, Vite-powered dashboard, and a robust TypeScript API for one-time-use, isolated payment containers. Instant Zcash payouts—no third-party custody, no settlement delays. £500/month license includes 250 shielded payment automations.
              </motion.p>
              <motion.div
                className="flex flex-col items-center justify-center gap-5 sm:flex-row"
                variants={fadeInUp}
              >
                <button
                  onClick={sessionData ? () => void signOut() : () => void signIn()}
                  className="transform rounded-lg px-8 py-4 text-lg font-semibold shadow-md transition duration-300 ease-in-out hover:shadow-lg hover:shadow-[var(--color-accent-transparent)] hover:-translate-y-1"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)"
                  }}
                >
                  {sessionData ? "Access Dashboard" : "Get Started (License Required)"}
                </button>
                <Link
                  href="#features"
                  className="transform rounded-lg border px-8 py-4 text-lg font-semibold backdrop-blur-sm transition duration-300 ease-in-out hover:-translate-y-1"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--color-primary-foreground)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--color-accent)";
                    e.currentTarget.style.color = "var(--color-accent-foreground)";
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(212,175,55,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "var(--color-primary-foreground)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Explore Features
                </Link>
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

        {/* Features Section */}
        <motion.section
          id="features"
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-14 text-center" variants={fadeInUp}>
              <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold rounded-full" style={goldTaglineStyle}>Key Benefits</span>
              <h2 className={headingClasses.sectionLight}>Why Self-Host ZVault?</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-dark-alt)] mt-4">
                Accept shielded Zcash payments with full auditability and compliance—while keeping your customers' privacy first. All data and automation stays on your infrastructure, never a third party.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-8 md:grid-cols-3"
              variants={staggerContainer}
            >
              {/* Feature Card 1: Private by Design */}
              <motion.div
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.2)",
                    color: "var(--color-accent)"
                  }}>
                   <LockClosedIcon className="h-8 w-8" /> {/* Replaced SVG with Heroicon */}
                </div>
                <h3 className={headingClasses.cardLight}>Private by Design</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  Accept shielded Zcash payments with complete privacy for your customers. All transactions are fully auditable for your business, but no data ever leaves your infrastructure.
                </p>
              </motion.div>

              {/* Feature Card 2: Instant, Isolated Containers */}
              <motion.div
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.2)",
                    color: "var(--color-accent)"
                  }}>
                  <BoltIcon className="h-8 w-8" />
                </div>
                <h3 className={headingClasses.cardLight}>Instant, Isolated Containers</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  Each Zcash payment is processed in a one-time-use, isolated container—ensuring privacy and auditability, with no cross-contamination or third-party risk.
                </p>
              </motion.div>

              {/* Feature Card 3: Vite Dashboard & API */}
              <motion.div
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.2)",
                    color: "var(--color-accent)"
                  }}>
                  <CodeBracketIcon className="h-8 w-8" />
                </div>
                <h3 className={headingClasses.cardLight}>Vite Dashboard & API</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  View transaction history, audit payments, and configure your API—all on your own infrastructure. No third-party dashboards or data leaks.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Security Focus Section */}
        <motion.section
          className={sectionClasses.dark}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <motion.div className="lg:w-1/2" variants={fadeInUp}>
                <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold rounded-full" style={goldTaglineStyle}>Security First</span>
                {/* Removed redundant icon, using list icons below */}
                <h2 className={headingClasses.section}>Security Through Self-Hosting</h2>
                <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--color-foreground-alt)" }}>
                  ZVault AutoShield ensures all Zcash payment data and automation stays on your infrastructure. Shielded transactions are auditable for your business, but never expose your customers to third parties.
                </p>
                <ul className="space-y-4" style={{ color: "var(--color-foreground-alt)" }}>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>All Zcash payment data and automation is processed on your infrastructure—never a third party.</span>
                  </li>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>One-time-use containers ensure each payment is isolated, private, and auditable.</span>
                  </li>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>Meets privacy and compliance requirements by default, with no external dependencies or data sharing.</span>
                  </li>
                </ul>
                <div className="mt-10"> {/* Increased margin top */}
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center font-semibold rounded-lg border px-6 py-3 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "rgba(212,175,55,0.1)",
                      borderColor: "var(--color-accent)",
                      color: "var(--color-accent)"
                    }}
                     onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-accent)";
                        e.currentTarget.style.color = "var(--color-accent-foreground)";
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.1)";
                        e.currentTarget.style.color = "var(--color-accent)";
                     }}
                  >
                    Learn how it works <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </motion.div>
              <motion.div className="lg:w-1/2 relative mt-10 lg:mt-0" variants={fadeInUp} transition={{ delay: 0.2 }}>
                {/* Increased margin top for mobile */}
                <Image
                  src="/visual.png" // Ensure this image exists in your public folder
                  alt="ZPay Payment Flow Visualization"
                  className="w-full h-auto rounded-xl shadow-xl" // Enhanced shadow
                  style={{ border: "1px solid var(--color-accent-transparent)" }} // Use a transparent accent border
                  width={1000}
                  height={1000}
                />
                {/* Optional: Add a subtle glow effect */}
                 <div className="absolute inset-0 rounded-xl opacity-30 blur-xl" style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}></div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          id="how-it-works"
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-14 text-center" variants={fadeInUp}>
              <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold rounded-full" style={goldTaglineStyle}>Simple Process</span>
              <h2 className={headingClasses.sectionLight}>Get Started with ZVault AutoShield</h2>
              <p className="mx-auto max-w-2xl text-lg mt-4 text-[var(--color-foreground-dark-alt)]">
                Deploy in minutes. Accept shielded Zcash payments with full auditability and privacy for your customers. All data stays on your infrastructure.
              </p>
            </motion.div>

            <div className="relative grid grid-cols-1 gap-10 md:gap-8 md:grid-cols-3"> {/* Reduced gap */}
              {/* Dashed line connector for larger screens */}
              <div className="absolute top-1/2 left-0 right-0 hidden h-px -translate-y-1/2 transform border-t-2 border-dashed md:block"
                style={{ marginTop: "-2.5rem", borderColor: "var(--color-border-light-alt)" }} // Adjusted margin
              ></div>

              {/* Step 1 */}
              <motion.div className="relative z-10" variants={fadeInUp}>
                <div className="relative h-full rounded-xl p-8 shadow-lg text-center md:text-left"
                  style={{
                    backgroundColor: "var(--color-surface-light)",
                    borderColor: "var(--color-border-light)",
                    borderWidth: "1px"
                  }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 md:left-8 h-14 w-14 rounded-full text-xl font-bold flex items-center justify-center ring-4 ring-offset-4 ring-offset-[var(--color-background-alt)] shadow-md"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      borderColor: "var(--color-primary)"
                    }}>1</div>
                  <CogIcon className="h-12 w-12 mb-6 mx-auto md:mx-0 text-[var(--color-primary)]" />
                  <h3 className={headingClasses.cardLight}>Deploy & Configure</h3>
                  <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Purchase your license and deploy ZVault AutoShield on your own infrastructure. Use the dashboard to configure your Zcash shielded address and API settings—all private, all yours.
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div className="relative z-10" variants={fadeInUp}>
                 <div className="relative h-full rounded-xl p-8 shadow-lg text-center md:text-left"
                   style={{
                     backgroundColor: "var(--color-surface-light)",
                     borderColor: "var(--color-border-light)",
                     borderWidth: "1px"
                   }}>
                   <div className="absolute -top-7 left-1/2 -translate-x-1/2 md:left-8 h-14 w-14 rounded-full text-xl font-bold flex items-center justify-center ring-4 ring-offset-4 ring-offset-[var(--color-background-alt)] shadow-md"
                     style={{
                       backgroundColor: "var(--color-accent)",
                       color: "var(--color-accent-foreground)",
                       borderColor: "var(--color-accent)"
                     }}>2</div>
                   <CodeBracketIcon className="h-12 w-12 mb-6 mx-auto md:mx-0 text-[var(--color-accent)]" />
                   <h3 className={headingClasses.cardLight}>Get Your API Key</h3>
                   <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Generate your API key from the dashboard. This key authorizes your Zcash payment automations and tracks your container usage (250/month included). All data stays private.
                   </p>
                 </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div className="relative z-10" variants={fadeInUp}>
                <div className="relative h-full rounded-xl p-8 shadow-lg text-center md:text-left"
                  style={{
                    backgroundColor: "var(--color-surface-light)",
                    borderColor: "var(--color-border-light)",
                    borderWidth: "1px"
                  }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 md:left-8 h-14 w-14 rounded-full text-xl font-bold flex items-center justify-center ring-4 ring-offset-4 ring-offset-[var(--color-background-alt)] shadow-md"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      borderColor: "var(--color-primary)"
                    }}>3</div>
                  <BoltIcon className="h-12 w-12 mb-6 mx-auto md:mx-0 text-[var(--color-primary)]" />
                  <h3 className={headingClasses.cardLight}>Create Containers & Automate</h3>
                  <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Use the TypeScript API to create one-time transactional containers for each Zcash payment. All processing and audit logs remain on your infrastructure.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Use Cases Section */}
        <motion.section
          id="use-cases"
          className={sectionClasses.dark}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-14 text-center" variants={fadeInUp}>
              <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold rounded-full" style={goldTaglineStyle}>Perfect For</span>
              <h2 className={headingClasses.section}>Who Should Self-Host ZVault?</h2>
              <p className="mx-auto max-w-3xl text-lg mt-4" style={{ color: "var(--color-foreground-alt)" }}>
                ZVault AutoShield is ideal for businesses and organizations that need to accept shielded Zcash payments with full auditability, while keeping customer privacy first and all data on their own infrastructure.
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 gap-10 md:grid-cols-3" variants={staggerContainer}>
              {/* Use Case Card 1 */}
              <motion.div
                className={cardClasses} // Use dark card classes
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                 <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(10, 25, 48, 0.5)", // Darker background
                    color: "var(--color-accent)"
                  }}>
                  {/* Replaced SVG with Heroicon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A.75.75 0 0 1 14.25 12h7.5a.75.75 0 0 1 .75.75-7.5 7.5 0 0 1-7.5 7.5h-7.5a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 .75.75v7.5Z" />
                  </svg>
                 </div>
                 <h3 className={headingClasses.card}>Enterprises & Fintechs</h3>
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                  Accept shielded Zcash payments with full auditability and compliance. All payment data and automation stays on your infrastructure for maximum privacy and control.
                 </p>
              </motion.div>

              {/* Use Case Card 2 */}
               <motion.div
                 className={cardClasses} // Use dark card classes
                 variants={fadeInUp}
                 whileHover={cardHoverEffect}
               >
                 <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                   style={{
                     backgroundColor: "rgba(212,175,55,0.15)", // Accent background
                     color: "var(--color-accent)"
                   }}>
                   {/* Replaced SVG with Heroicon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                 </div>
                 <h3 className={headingClasses.card}>Agencies & SaaS Providers</h3>
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                   Offer private, transactional automation for your clients. Keep all data and logic between you and your clients on your own infrastructure. Accept shielded Zcash payments with auditability and privacy.
                 </p>
               </motion.div>

              {/* Use Case Card 3 */}
              <motion.div
                className={cardClasses} // Use dark card classes
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                     backgroundColor: "rgba(10, 25, 48, 0.5)", // Darker background
                     color: "var(--color-accent)"
                  }}>
                   {/* Replaced SVG with Heroicon */}
                   <LockClosedIcon className="w-8 h-8" />
                 </div>
                 <h3 className={headingClasses.card}>Privacy-First Teams</h3>
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                   Ensure your Zcash payment automation and transactions are never exposed to third parties. Full auditability for your business, full privacy for your customers.
                 </p>
               </motion.div>
            </motion.div>

            <motion.div className="mt-16 text-center" variants={fadeInUp}>
              <button
                onClick={sessionData ? () => void signOut() : () => void signIn()}
                className="inline-flex items-center transform rounded-lg px-8 py-4 text-lg font-semibold shadow-md transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
                 style={{
                   backgroundColor: "var(--color-accent)",
                   color: "var(--color-accent-foreground)"
                 }}
              >
                {sessionData ? "Access Dashboard" : "Buy License (£500)"} <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </motion.div>
          </div>
        </motion.section>

        {/* Live API Test Section */}
        <section className="py-16 lg:py-20 bg-[var(--color-background-alt)]">
          <div className="container mx-auto px-6 max-w-8xl">
            <div className="mb-8 text-center">
              <span className="inline-block px-4 py-1.5 mb-3 text-sm font-semibold rounded-full" style={goldTaglineStyle}>Live API Test</span>
              <h2 className={headingClasses.sectionLight}>Test the API Live</h2>
              <p className="mx-auto max-w-xl text-lg mt-4 text-[var(--color-foreground-dark-alt)]">
                Experience shielded Zcash payments in minutes. Test our API endpoint and see how easy it is to automate private, auditable transactions on your own infrastructure.
              </p>
            </div>
            {/* Inline React component for live test */}
            {(() => {
              function LiveApiTest() {
                const [apiKey, setApiKey] = useState('zv_test_exyd23kb825qnqk74lgji');
                const [invoiceId, setInvoiceId] = useState('786');
                const [amount, setAmount] = useState('1000');
                const [response, setResponse] = useState(null);
                const [loading, setLoading] = useState(false);
                const [error, setError] = useState(null);
                const [addressInfo, setAddressInfo] = useState(null);
                const [polling, setPolling] = useState(false);
                const pollingRef = useRef<number | undefined>(undefined);
                const testUserId = '123';
                const [hasSentRequest, setHasSentRequest] = useState(false);
                const [logContent, setLogContent] = useState<string | null>(null);
                const [logLoading, setLogLoading] = useState(false);
                const [logError, setLogError] = useState<string | null>(null);
                const handleSend = async () => {
                  setHasSentRequest(true);
                  setLoading(true);
                  setError(null);
                  setResponse(null);
                  setAddressInfo(null);
                  setPolling(false);
                  try {
                    const res = await fetch('https://www.v3nture.link/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        api_key: apiKey,
                        user_id: testUserId,
                        invoice_id: invoiceId,
                        amount: amount
                      })
                    });
                    const data = await res.json();
                    setResponse(data);
                    setPolling(true);
                  } catch (err) {
                    // setError((err instanceof Error) ? err : String(err));
                  } finally {
                    setLoading(false);
                  }
                };
                // Poll /address endpoint
                useEffect(() => {
                  if (!polling) return;
                  let stopped = false;
                  async function poll() {
                    try {
                      const params = new URLSearchParams({ api_key: apiKey, user_id: testUserId, invoice_id: invoiceId });
                      const res = await fetch(`https://www.v3nture.link/address?${params.toString()}`);
                      const data = await res.json();
                      setAddressInfo(data);
                      if ((data.address && data.address !== 'Not Available Yet') || data.not_found) {
                        setPolling(false);
                        // Fetch log after address is available
                        setLogLoading(true);
                        setLogError(null);
                        setLogContent(null);
                        try {
                          const logRes = await fetch(`https://www.v3nture.link/shared-log?${params.toString()}`);
                          if (!logRes.ok) {
                            const errData = await logRes.json().catch(() => ({}));
                            throw new Error(errData.message || 'Failed to fetch log');
                          }
                          const logText = await logRes.text();
                          setLogContent(logText);
                        } catch (e: any) {
                          setLogError(e.message || 'Failed to fetch log');
                        } finally {
                          setLogLoading(false);
                        }
                        return;
                      }
                      if (!stopped) pollingRef.current = window.setTimeout(poll, 2000);
                    } catch (e) {
                      setPolling(false);
                    }
                  }
                  poll();
                  return () => { stopped = true; clearTimeout(pollingRef.current as number | undefined); };
                }, [polling, apiKey, invoiceId]);
                return (
                  <div className={"flex flex-col gap-4 rounded-xl shadow-lg p-8 border border-[var(--color-border-light)]"} style={{ background: 'var(--color-primary)', color: 'var(--color-accent)' }}>
                    {/* Row: Form and Results */}
                    <div className="flex flex-col md:flex-row gap-8 w-full">
                      {/* Form Section with animation */}
                      <motion.div
                        className="w-full mb-6 md:mb-0"
                        animate={{ width: hasSentRequest ? '50%' : '100%' }}
                        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                        style={{ minWidth: 0 }}
                      >
                        <div className="mb-4">
                          <label className="block mb-1 font-semibold" style={{ color: 'var(--color-accent)' }}>API Key</label>
                          <input className="w-full rounded border px-3 py-2 mb-3" style={{ borderColor: 'var(--color-border-light)', color: '#fff', background: 'var(--color-accent-foreground)' }} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your API key" />
                          <label className="block mb-1 font-semibold" style={{ color: 'var(--color-accent)' }}>Invoice ID</label>
                          <input className="w-full rounded border px-3 py-2 mb-3" style={{ borderColor: 'var(--color-border-light)', color: '#fff', background: 'var(--color-accent-foreground)' }} value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
                          <label className="block mb-1 font-semibold" style={{ color: 'var(--color-accent)' }}>Amount (GBP cents)</label>
                          <input className="w-full rounded border px-3 py-2 mb-3" style={{ borderColor: 'var(--color-border-light)', color: '#fff', background: 'var(--color-accent-foreground)' }} value={amount} onChange={e => setAmount(e.target.value)} />
                          <div className="mb-2 text-sm" style={{ color: 'var(--color-accent)' }}>User ID: <span className="font-mono">123</span></div>
                        </div>
                        <button onClick={handleSend} disabled={loading || !apiKey || !invoiceId || !amount} className="rounded-lg px-6 py-3 font-semibold transition duration-300 border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]" style={{ background: 'var(--color-primary)' }}>
                          {loading ? 'Sending...' : 'Send Test Request'}
                        </button>
                        {error && <div className="mt-4 text-red-400">Error: {error}</div>}
                      </motion.div>
                      {/* Results Section */}
                      <AnimatePresence>
                        {hasSentRequest && (
                          <motion.div
                            className="md:w-1/2 w-full flex flex-col"
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 40 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          >
                            {response && (
                              <>
                                <div className="mb-2 font-semibold" style={{ color: 'var(--color-accent)' }}>Create Endpoint Response:</div>
                                <motion.pre
                                  className="mb-4 rounded p-4 text-sm overflow-x-auto border border-[var(--color-border-light)]"
                                  style={{ background: 'var(--color-background-alt)', color: 'var(--color-primary)', fontFamily: 'Menlo, monospace' }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  {JSON.stringify(response, null, 2)}
                                </motion.pre>
                              </>
                            )}
                            {polling && <motion.div className="mb-4 text-[var(--color-accent)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>Polling for address...</motion.div>}
                            {addressInfo && (
                              <motion.div className="mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <div className="mb-2 font-semibold" style={{ color: 'var(--color-accent)' }}>Address Endpoint Response:</div>
                                <pre className="rounded p-4 text-sm overflow-x-auto border border-[var(--color-border-light)]" style={{ background: 'var(--color-background-alt)', color: 'var(--color-primary)', fontFamily: 'Menlo, monospace' }}>{JSON.stringify(addressInfo, null, 2)}</pre>
                                <button
                                  className="mt-2 rounded-lg px-4 py-2 font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] transition duration-300"
                                  style={{ background: 'var(--color-primary)' }}
                                  onClick={async () => {
                                    const params = new URLSearchParams({ api_key: apiKey, user_id: testUserId, invoice_id: invoiceId });
                                    const res = await fetch(`https://www.v3nture.link/address?${params.toString()}`);
                                    const data = await res.json();
                                    setAddressInfo(data);
                                  }}
                                >
                                  Refresh Address Status
                                </button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Log display full width, immediately below results */}
                    {addressInfo && (
                      <motion.div className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <div className="mb-2 font-semibold" style={{ color: 'var(--color-accent)' }}>Shielding Process Log:</div>
                        {logLoading && <div className="text-[var(--color-accent)]">Loading log...</div>}
                        {logError && <div className="text-red-400">Error: {logError}</div>}
                        {logContent && (
                          <pre className="rounded p-4 text-xs overflow-x-auto border border-[var(--color-border-light)]" style={{ background: 'var(--color-background-alt)', color: 'var(--color-primary)', fontFamily: 'Menlo, monospace', maxHeight: 300 }}>{logContent}</pre>
                        )}
                        <button
                          className="mt-2 rounded-lg px-4 py-2 font-semibold border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] transition duration-300"
                          style={{ background: 'var(--color-primary)' }}
                          onClick={async () => {
                            setLogLoading(true);
                            setLogError(null);
                            setLogContent(null);
                            const params = new URLSearchParams({ api_key: apiKey, user_id: testUserId, invoice_id: invoiceId });
                            try {
                              const logRes = await fetch(`https://www.v3nture.link/shared-log?${params.toString()}`);
                              if (!logRes.ok) {
                                const errData = await logRes.json().catch(() => ({}));
                                throw new Error(errData.message || 'Failed to fetch log');
                              }
                              const logText = await logRes.text();
                              setLogContent(logText);
                            } catch (e: any) {
                              setLogError(e.message || 'Failed to fetch log');
                            } finally {
                              setLogLoading(false);
                            }
                          }}
                        >
                          Refresh Log
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              }
              return React.createElement(LiveApiTest);
            })()}
          </div>
        </section>

        {/* CTA Section - Updated with Three-Stage Icon Animation */}
        <motion.section
          id="cta"
          className="relative overflow-hidden py-20 min-h-[400px] flex items-center justify-center"
          style={{
            background: "var(--gradient-light)",
            color: "var(--color-foreground-dark)"
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="absolute inset-0 opacity-5 bg-crypto-pattern bg-repeat"></div>
          
          {/* Animated background elements */}
          <motion.div 
            className="absolute w-32 h-32 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--color-accent)", opacity: 0.15 }}
            animate={{
              x: [0, 30, -20, 0],
              y: [0, -30, 20, 0],
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut" 
            }}
          />
          
          <div className="container mx-auto px-6 relative z-10 text-center">

            {/* Three-Stage Icon Animation Container */}
            <div className="relative inline-block mb-10">
              {/* Base animation container for scale/rotate effects */}
              <motion.div
                key="icon-container"
                variants={padlockVariants}
                className="relative"
              >
                {/* This is just a placeholder for size - actual icons are in absolute position */}
                <div className="h-24 w-24 md:h-28 md:w-28 opacity-0"></div>
              </motion.div>
              
              {/* Stage 1: Locked padlock */}
              <motion.div
                key="icon-locked"
                variants={iconTransitionVariants.locked}
                className="absolute top-0 left-0 right-0 mx-auto filter drop-shadow-xl"
              >
                <LockClosedIcon className="h-24 w-24 md:h-28 md:w-28 text-[var(--color-accent)]" />
              </motion.div>
              
              {/* Stage 2: Unlocked padlock */}
              <motion.div
                key="icon-unlocked"
                variants={iconTransitionVariants.unlocked}
                className="absolute top-0 left-0 right-0 mx-auto filter drop-shadow-xl"
              >
                <LockOpenIcon className="h-24 w-24 md:h-28 md:w-28 text-[var(--color-accent)]" />
              </motion.div>
              
              {/* Stage 3: Security shield */}
              <motion.div
                key="icon-shield"
                variants={iconTransitionVariants.shield}
                className="absolute top-0 left-0 right-0 mx-auto filter drop-shadow-xl"
              >
                <ShieldCheckIcon className="h-24 w-24 md:h-28 md:w-28 text-[var(--color-accent)]" />
                
                {/* Shield glow effect */}
                <motion.div 
                  className="absolute inset-0 rounded-full -z-10 opacity-50 blur-lg"
                  style={{ backgroundColor: "var(--color-accent)" }}
                  animate={{ 
                    scale: [0.9, 1.1, 0.9],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: 3 // Start after shield appears
                  }}
                />
              </motion.div>
            </div>

            {/* Content revealed after animation */}
            <motion.div
               key="cta-content"
               variants={contentVariants}
               className="max-w-3xl mx-auto"
            >
              <h2
                className="mb-8 text-3xl font-bold md:text-4xl lg:text-5xl text-[var(--color-foreground-dark)]"
              >
                Ready to <span style={{ color: "var(--color-accent)" }}>Unlock</span> Private, Auditable Zcash Payments?
              </h2>
              <p
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]"
              >
                Join ZVault AutoShield and accept shielded Zcash payments with full auditability and privacy. All data and automation stays on your infrastructure—no third parties, ever.
              </p>
              <motion.button
                onClick={sessionData ? () => void signOut() : () => void signIn()}
                className="transform rounded-lg px-10 py-4 text-lg font-semibold shadow-lg transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-foreground)"
                }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95 }}
              >
                {sessionData ? "Go to Your Dashboard" : "Buy License (£500)"}
                <ArrowRightIcon className="inline-block h-6 w-6 ml-3"/>
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

      </main>

    
    </>
  );
}