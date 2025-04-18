import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
// import { api } from "@/utils/api"; // Assuming tRPC setup
import { motion } from "framer-motion";
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
        <title>ZVault ZPay | Truly Private Zcash Payment Processing</title>
        <meta name="description" content="Experience the future of secure and private crypto payments with ZPay by ZVault. Powered by Zcash for unmatched privacy. Simple integration, instant payouts." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://z-vault.vercel.app" /> {/* Replace with your actual domain */}

        {/* --- Open Graph Meta Tags (for Facebook, LinkedIn, etc.) --- */}
        <meta property="og:title" content="ZVault ZPay | Truly Private Zcash Payment Processing" />
        <meta property="og:description" content="Secure, private crypto payments powered by Zcash. Simple setup, instant payouts." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://z-vault.vercel.app" /> {/* Replace with your actual domain */}
        <meta property="og:image" content="https://z-vault.vercel.app/og-image.png" /> {/* Replace with your OG image URL */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* --- Twitter Card Meta Tags --- */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZVault ZPay | Truly Private Zcash Payment Processing" />
        <meta name="twitter:description" content="Secure, private crypto payments powered by Zcash. Simple setup, instant payouts." />
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
          className="relative overflow-hidden py-20 md:py-28"
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
              <motion.div
                className="mb-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold backdrop-blur-sm"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-foreground)",
                  opacity: "0.9"
                }}
                variants={fadeInUp}
              >
                🚀 Introducing ZPay by ZVault
              </motion.div>
              <motion.h1
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                The <span style={{ color: "var(--color-accent)" }}>Shielded</span> Standard for Crypto Payments
              </motion.h1>
              <motion.p
                className="mb-12 text-lg md:text-xl lg:text-2xl mx-auto max-w-3xl"
                style={{ color: "var(--color-foreground)" }} // Adjusted color for contrast on gradient
                variants={fadeInUp}
              >
                Leverage the power of Zcash for truly private, secure, and seamless payment processing.
                Simple signup. Effortless integration. Simply secure.
              </motion.p>
              <motion.div
                className="flex flex-col items-center justify-center gap-5 sm:flex-row"
                variants={fadeInUp}
              >
                <button
                  onClick={sessionData ? () => void signOut() : () => void signIn()}
                  className="transform rounded-lg px-8 py-4 text-lg font-semibold shadow-md transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)"
                  }}
                >
                  {sessionData ? "Access Dashboard" : "Get Started Free"}
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
                    e.currentTarget.style.color = "var(--color-accent-foreground)"; // Ensure text color changes too
                    e.currentTarget.style.borderColor = "var(--color-accent)";
                    e.currentTarget.style.opacity = "0.9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "var(--color-primary-foreground)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.opacity = "1";
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
              <h2 className={headingClasses.sectionLight}>Why ZPay is Different</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-dark-alt)] mt-4">
                Go beyond standard payment solutions. Embrace unparalleled privacy, speed, and simplicity for your business transactions.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-8 md:grid-cols-3"
              variants={staggerContainer}
            >
              {/* Feature Card 1: Total Privacy */}
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
                <h3 className={headingClasses.cardLight}>Unbreakable Privacy</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  Utilizes Zcash's zero-knowledge proofs (zk-SNARKs) to shield transaction details. Sender, receiver, and amount remain confidential.
                </p>
              </motion.div>

              {/* Feature Card 2: Instant Payouts */}
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
                <h3 className={headingClasses.cardLight}>Direct & Instant Payouts</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  No intermediaries holding your funds. Payments are sent directly to your designated Zcash shielded address upon confirmation.
                </p>
              </motion.div>

              {/* Feature Card 3: Simple Integration */}
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
                <h3 className={headingClasses.cardLight}>Effortless API Integration</h3>
                <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed min-h-[6rem]">
                  Get up and running quickly with our developer-friendly API and clear documentation. Focus on your core business, not complex payment logic.
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
                <h2 className={headingClasses.section}>Security Through Shielding</h2>
                <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--color-foreground-alt)" }}>
                  ZPay is built upon the battle-tested Zcash protocol, renowned for its pioneering use of zk-SNARKs. This cryptographic breakthrough allows transaction verification without revealing any sensitive data, providing mathematical certainty of privacy.
                </p>
                <ul className="space-y-4" style={{ color: "var(--color-foreground-alt)" }}>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>Confidential transactions protect your financial data from public exposure.</span>
                  </li>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>Reduced risk of data breaches targeting payment information.</span>
                  </li>
                  <li className="flex items-start">
                    <ShieldCheckIcon className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-[var(--color-accent)]" />
                    <span>Compliance with privacy standards by default.</span>
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
                <img
                  src="/visual.png" // Ensure this image exists in your public folder
                  alt="ZPay Payment Flow Visualization"
                  className="w-full h-auto rounded-xl shadow-xl" // Enhanced shadow
                  style={{ border: "1px solid var(--color-accent-transparent)" }} // Use a transparent accent border
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
              <h2 className={headingClasses.sectionLight}>Start Accepting ZPay in Minutes</h2>
              <p className="mx-auto max-w-2xl text-lg mt-4 text-[var(--color-foreground-dark-alt)]">
                Our streamlined process gets you ready for private payments quickly.
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
                  <h3 className={headingClasses.cardLight}>Sign Up & Configure</h3> {/* Combined steps 1&2 */}
                  <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Create your ZVault account. In the dashboard, enter your Zcash shielded address (zs...) where you'll receive payments.
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
                   <CodeBracketIcon className="h-12 w-12 mb-6 mx-auto md:mx-0 text-[var(--color-accent)]" /> {/* Changed Icon */}
                   <h3 className={headingClasses.cardLight}>Get API Key</h3> {/* Simplified title */}
                   <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Generate your unique API key from the dashboard. Keep it secure – this authorizes your payment requests.
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
                  <BoltIcon className="h-12 w-12 mb-6 mx-auto md:mx-0 text-[var(--color-primary)]" /> {/* Changed Icon */}
                  <h3 className={headingClasses.cardLight}>Integrate & Launch</h3>
                  <p className="leading-relaxed text-[var(--color-foreground-dark-alt)]">
                    Use our API docs to integrate the ZPay button or endpoints. Start accepting private Zcash payments instantly!
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
              <h2 className={headingClasses.section}>Who Benefits from ZPay?</h2>
              <p className="mx-auto max-w-3xl text-lg mt-4" style={{ color: "var(--color-foreground-alt)" }}>
                ZPay is ideal for any individual or business valuing financial privacy and security.
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
                 <h3 className={headingClasses.card}>E-commerce Stores</h3>
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                  Protect customer transaction data and your revenue streams from public scrutiny. Offer a truly private checkout option.
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
                 <h3 className={headingClasses.card}>Freelancers & Creators</h3>
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                   Receive payments privately without exposing your income details or client relationships on a public ledger.
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
                 <h3 className={headingClasses.card}>Privacy Advocates</h3> {/* Changed title slightly */}
                 <p className="leading-relaxed min-h-[6rem]" style={{ color: "var(--color-foreground-alt)" }}>
                   Exercise your right to financial privacy. Protect your activity from surveillance and data aggregation.
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
                {sessionData ? "Access Dashboard" : "Get Started"} <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </motion.div>
          </div>
        </motion.section>

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
                Ready to <span style={{ color: "var(--color-accent)" }}>Unlock</span> True Payment Privacy?
              </h2>
              <p
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]"
              >
                Join ZVault ZPay today and step into the future of secure, private transactions powered by Zcash. No compromises, just confidentiality.
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
                {sessionData ? "Go to Your Dashboard" : "Create Your Free Account"}
                <ArrowRightIcon className="inline-block h-6 w-6 ml-3"/>
              </motion.button>
            </motion.div>
          </div>
        </motion.section>

      </main>

    
    </>
  );
}