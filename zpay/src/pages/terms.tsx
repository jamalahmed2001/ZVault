import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { DocumentTextIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
  taglineLight: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(10,25,48,0.1)] text-[var(--color-primary)]"
};

export default function TermsOfService() {
  const lastUpdated = "November 15, 2023";
  
  return (
    <>
      <Head>
        <title>Terms of Service | ZVault ZPay</title>
        <meta name="description" content="ZVault ZPay's Terms of Service outlines the rules, guidelines, and legal terms that govern your use of our payment processing services." />
        <link rel="canonical" href="https://yourdomain.com/terms-of-service" />
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
          <div className="absolute inset-0 opacity-10 bg-crypto-pattern bg-repeat"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <DocumentTextIcon className="h-16 w-16 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <motion.h1 
                className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Terms of Service
              </motion.h1>
              <motion.p 
                className="text-lg"
                style={{ color: "var(--color-foreground)" }}
                variants={fadeInUp}
              >
                Last Updated: {lastUpdated}
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* Content Section */}
        <section className={sectionClasses.light}>
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              <div className="prose prose-lg max-w-none text-black" style={{
                "--tw-prose-body": "#000000",
                "--tw-prose-headings": "#000000",
                "--tw-prose-links": "var(--color-accent)",
                "--tw-prose-counters": "#000000",
                "--tw-prose-bullets": "#000000",
              } as React.CSSProperties}>
                <h2>ZVault Terms of Service</h2>
                <p><strong>Effective Date:</strong> [Insert Date]</p>
                <p>Welcome to ZVault. These Terms of Service ("Terms") govern your access to and use of ZVault's non-custodial, privacy-focused shielding automation infrastructure ("ZVault", "we", "our", or "us"). By accessing or using ZVault, including our API, CLI, SDKs, Docker containers, or dashboard (collectively, the "Service"), you agree to be bound by these Terms.</p>
                <h3>1. Nature of the Service</h3>
                <p>ZVault provides ephemeral compute infrastructure that allows businesses and individuals ("Users") to automate Zcash (ZEC) shielding operations via disposable containerized environments. These operations are pre-configured or user-defined, non-custodial, and executed deterministically based on user instructions.</p>
                <p><strong>ZVault does not:</strong></p>
                <ul>
                  <li>Act as a money transmitter, payment provider, or financial intermediary;</li>
                  <li>Hold, store, or custody cryptocurrency or fiat funds;</li>
                  <li>Offer or operate wallets on behalf of Users;</li>
                  <li>Pool or aggregate user funds;</li>
                  <li>Direct or redirect payments or funds on a user's behalf.</li>
                </ul>
                <p>You are solely responsible for supplying the destination addresses, initiating execution, and ensuring compliance with all applicable laws.</p>
                <h3>2. Eligibility</h3>
                <p>You must be at least 18 years old or the age of legal majority in your jurisdiction, and have full power and authority to enter into these Terms. If you are acting on behalf of a business, you represent that you are authorized to bind that entity.</p>
                <h3>3. Use of the Service</h3>
                <h4>3.1 API Access & Key Management</h4>
                <ul>
                  <li>Each User (individual or enterprise) must register and obtain API credentials.</li>
                  <li>API keys are scoped to pre-authorized configurations, including:
                    <ul>
                      <li>Execution fees;</li>
                      <li>Destination wallet addresses;</li>
                      <li>Webhook endpoints.</li>
                    </ul>
                  </li>
                  <li>You agree not to share or resell your API key without our written permission.</li>
                </ul>
                <h4>3.2 Flow Configuration Consent</h4>
                <ul>
                  <li>By using your API key, you authorize ZVault to execute shielding and routing logic as defined in your configuration.</li>
                  <li>All flows are initiated solely by you (via API, SDK, or platform trigger).</li>
                  <li>You are solely responsible for the validity of destination addresses and downstream compliance.</li>
                </ul>
                <h4>3.3 Execution Fee</h4>
                <ul>
                  <li>A fixed or percentage-based execution fee may be deducted during the transaction.</li>
                  <li>This fee is considered a non-refundable automation cost, not a commission, custody fee, or financial handling charge.</li>
                </ul>
                <h3>4. Responsibilities & Risk Assumption</h3>
                <p>You acknowledge and agree:</p>
                <ul>
                  <li>You bear all responsibility for complying with applicable laws, including those related to anti-money laundering (AML), tax reporting, and data protection;</li>
                  <li>You have full legal ownership of all assets used in transactions;</li>
                  <li>You will not use ZVault to facilitate unlawful, sanctioned, or unauthorized activity;</li>
                  <li>You understand and accept the operational risks of ephemeral compute environments and blockchain transactions.</li>
                </ul>
                <p>ZVault is not responsible for:</p>
                <ul>
                  <li>Incorrect addresses, lost funds, or delayed blockchain confirmations;</li>
                  <li>Failures or bugs within Zcash infrastructure, wallet libraries, or third-party dependencies;</li>
                  <li>Legal obligations that may arise from your use of the Service.</li>
                </ul>
                <h3>5. Enterprise Integration Specifics</h3>
                <p>If you are an enterprise integrating ZVault:</p>
                <ul>
                  <li>You are solely responsible for your end users and their funds;</li>
                  <li>You may not represent ZVault as a payment processor or wallet service;</li>
                  <li>You must disclose to your users that privacy automation is provided by ZVault, a third-party execution engine;</li>
                  <li>You must obtain all necessary authorizations and consents from your users to execute shielding on their behalf.</li>
                </ul>
                <h3>6. Privacy & Logging</h3>
                <p>ZVault operates with minimal logging. We do not store wallet keys, user balances, or transactional metadata beyond:</p>
                <ul>
                  <li>API key usage timestamps;</li>
                  <li>Container initiation and termination logs;</li>
                  <li>Optional webhook event confirmations.</li>
                </ul>
                <p>We do not collect or associate user identity with specific transactions.</p>
                <h3>7. Limitations of Liability</h3>
                <p>To the maximum extent permitted by law, ZVault and its officers, directors, and affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, lost funds, or loss of data, arising out of your use or inability to use the Service.</p>
                <h3>8. No Warranty</h3>
                <p>The Service is provided "as is" and "as available." ZVault makes no warranties, express or implied, regarding the reliability, availability, or fitness for a particular purpose.</p>
                <h3>9. Termination</h3>
                <p>We reserve the right to suspend or terminate access to your API key or the Service if:</p>
                <ul>
                  <li>You breach these Terms;</li>
                  <li>We detect abuse, suspicious usage, or attempts to bypass legal constraints;</li>
                  <li>We are required by law to do so.</li>
                </ul>
                <h3>10. Changes to the Terms</h3>
                <p>We may update these Terms from time to time. Continued use of the Service constitutes your acceptance of any changes.</p>
                <h3>11. Jurisdiction & Legal Structure</h3>
                <p>ZVault operates as a privacy-focused infrastructure software company under the jurisdiction of [Insert Legal Entity + Jurisdiction]. We do not provide financial services, and no financial regulatory licenses apply to our operations under current structure.</p>
                <h3>12. Contact & Notices</h3>
                <p>For questions or legal inquiries, contact:</p>
                <p>[Insert Contact Email or Form URL]</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <motion.section
          className="relative overflow-hidden py-28"
          style={{ 
            background: "var(--gradient-light)",
            color: "var(--color-foreground-dark)" 
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="absolute inset-0 opacity-5 bg-crypto-pattern bg-repeat"></div>
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              variants={staggerContainer}
            >
              <motion.h2 
                className="mb-8 text-3xl font-bold md:text-4xl lg:text-5xl text-[var(--color-foreground-dark)]" 
                variants={fadeInUp}
              >
                Have Questions About Our Terms?
              </motion.h2>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark)]" 
                variants={fadeInUp}
              >
                Our team is here to help you understand our terms of service.
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Link 
                  href="/contact"
                  className="transform rounded-lg px-10 py-4 text-lg font-semibold shadow-lg transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 animate-pulse-slow"
                  style={{ 
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)" 
                  }}
                >
                  Contact Our Team
                  <ArrowRightIcon className="inline-block h-6 w-6 ml-3"/>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </>
  );
} 