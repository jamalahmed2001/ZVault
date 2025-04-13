import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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

export default function PrivacyPolicy() {
  const lastUpdated = "November 15, 2023";
  
  return (
    <>
      <Head>
        <title>Privacy Policy | ZVault ZPay</title>
        <meta name="description" content="ZVault ZPay's Privacy Policy outlines how we collect, use, and protect your personal information while providing our payment processing services." />
        <link rel="canonical" href="https://yourdomain.com/privacy-policy" />
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
                <ShieldCheckIcon className="h-16 w-16 mx-auto mb-6" style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <motion.h1 
                className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Privacy Policy
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
            <div className="mx-auto max-w-4xl text-black">
              <div className="prose prose-lg max-w-none" style={{
                "--tw-prose-body": "var(--color-foreground-dark-alt)",
                "--tw-prose-headings": "var(--color-foreground-dark)",
                "--tw-prose-links": "var(--color-accent)",
                "--tw-prose-counters": "var(--color-foreground-dark-alt)",
                "--tw-prose-bullets": "var(--color-foreground-dark-alt)",
              } as React.CSSProperties}>
                <p className="lead text-lg text-[var(--color-foreground-dark-alt)] mb-8">
                  At ZVault ("we," "us," or "our"), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our ZPay service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access our service.
                </p>
                
                <h2>1. Information We Collect</h2>
                
                <h3>1.1 Information You Provide</h3>
                <p>
                  We may collect information that you provide directly to us when you:
                </p>
                <ul>
                  <li>Create or register an account</li>
                  <li>Fill out forms on our website</li>
                  <li>Correspond with us</li>
                  <li>Subscribe to our newsletters or updates</li>
                  <li>Request customer support</li>
                </ul>
                <p>
                  This information may include:
                </p>
                <ul>
                  <li>Basic identification and contact details (name, email address)</li>
                  <li>Business information (business name, website URL for webhook verification)</li>
                  <li>Zcash shielded address (where you receive payments)</li>
                  <li>Account credentials (password, authentication information)</li>
                </ul>
                
                <h3>1.2 Information Collected Automatically</h3>
                <p>
                  When you access our service, we may automatically collect certain information, including:
                </p>
                <ul>
                  <li>Device information (IP address, browser type and version, operating system)</li>
                  <li>Usage data (pages visited, time spent, referring website addresses)</li>
                  <li>Performance data (error reports, API usage statistics)</li>
                </ul>
                
                <h3>1.3 Information We Do Not Collect</h3>
                <p>
                  Due to the nature of Zcash's shielded transactions, we <strong>do not</strong> collect or store:
                </p>
                <ul>
                  <li>Transaction amounts</li>
                  <li>Sender Zcash addresses</li>
                  <li>Receiver Zcash addresses (beyond the addresses you provide for receiving funds)</li>
                  <li>Transaction memo fields</li>
                  <li>Any other data shielded by Zcash's zk-SNARKs technology</li>
                </ul>
                <p>
                  This means that while we facilitate the payment process, we do not have visibility into the details of individual transactions beyond the minimum required for our API to function.
                </p>
                
                <h2>2. How We Use Your Information</h2>
                <p>
                  We use the information we collect for various purposes, including to:
                </p>
                <ul>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Create and maintain your account</li>
                  <li>Process transactions and send notifications related to your account</li>
                  <li>Monitor usage patterns and analyze trends</li>
                  <li>Detect and prevent fraud, abuse, security incidents, and other harmful activity</li>
                  <li>Communicate with you about our services, including sending technical notices, updates, security alerts, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Comply with applicable laws, regulations, and legal processes</li>
                </ul>
                
                <h2>3. Legal Basis for Processing</h2>
                <p>
                  We process your personal information on the following legal bases:
                </p>
                <ul>
                  <li><strong>Contractual Necessity:</strong> To perform the contract we have with you, including processing your transactions and providing our services.</li>
                  <li><strong>Legitimate Interests:</strong> For our legitimate business interests, such as improving our services, securing our systems, and preventing fraud.</li>
                  <li><strong>Compliance with Legal Obligations:</strong> To comply with applicable laws and regulations.</li>
                  <li><strong>Consent:</strong> Where you have given us consent to process your data for specific purposes.</li>
                </ul>
                
                <h2>4. Information Sharing and Disclosure</h2>
                <p>
                  We may share the information we collect in the following circumstances:
                </p>
                
                <h3>4.1 Service Providers</h3>
                <p>
                  We may share your information with third-party vendors, service providers, and contractors who perform services on our behalf and require access to your information to provide these services. These may include payment processing, data analytics, hosting and cloud computing, customer service, and marketing.
                </p>
                
                <h3>4.2 Compliance with Laws</h3>
                <p>
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency). However, due to the nature of our service and the privacy protections of Zcash's shielded transactions, we have very limited ability to provide transaction-specific information.
                </p>
                
                <h3>4.3 Business Transfers</h3>
                <p>
                  If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.
                </p>
                
                <h3>4.4 With Your Consent</h3>
                <p>
                  We may share your information with your consent or at your direction.
                </p>
                
                <h2>5. KYC Requirements and Responsibility</h2>
                <p>
                  ZVault ZPay provides payment processing infrastructure as a service. We do not directly engage with the end customers who make payments through our system, and we have no visibility into the specific transaction details due to the privacy features of Zcash's shielded transactions.
                </p>
                
                <p>
                  <strong>Customer Responsibility for KYC/AML Compliance:</strong> If you use our service to receive payments for your business, you acknowledge and agree that:
                </p>
                <ul>
                  <li>You are solely responsible for complying with all applicable Know Your Customer (KYC), Anti-Money Laundering (AML), and Counter-Terrorist Financing (CTF) laws and regulations in the jurisdictions where you operate.</li>
                  <li>You are responsible for implementing appropriate KYC procedures to verify the identity of your customers as required by applicable laws.</li>
                  <li>You must maintain appropriate records of customer identification and transactions as required by relevant regulations.</li>
                  <li>You will ensure your use of our service complies with all applicable laws and regulations.</li>
                </ul>
                
                <p>
                  We reserve the right to request information from you to verify your compliance with these requirements and to suspend or terminate your access to our services if we have reason to believe you are not in compliance with applicable regulations.
                </p>
                
                <h2>6. Data Security</h2>
                <p>
                  We have implemented appropriate technical and organizational measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee its absolute security.
                </p>
                
                <p>
                  These security measures include:
                </p>
                <ul>
                  <li>Encryption of data in transit using TLS</li>
                  <li>Secure authentication for API access</li>
                  <li>Regular security audits and assessments</li>
                  <li>Access controls and authentication procedures</li>
                  <li>Regular monitoring for unauthorized access attempts</li>
                </ul>
                
                <h2>7. Data Retention</h2>
                <p>
                  We will retain your personal information only for as long as reasonably necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
                </p>
                
                <p>
                  When determining the appropriate retention period, we consider:
                </p>
                <ul>
                  <li>The amount, nature, and sensitivity of the personal information</li>
                  <li>The potential risk of harm from unauthorized use or disclosure</li>
                  <li>The purposes for which we process the information and whether we can achieve those purposes through other means</li>
                  <li>Applicable legal, regulatory, tax, accounting, or other requirements</li>
                </ul>
                
                <h2>8. Your Rights</h2>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, including:
                </p>
                
                <ul>
                  <li><strong>Access:</strong> You may request access to your personal information.</li>
                  <li><strong>Correction:</strong> You may request that we correct inaccurate or incomplete information.</li>
                  <li><strong>Deletion:</strong> You may request that we delete your personal information in certain circumstances.</li>
                  <li><strong>Restriction:</strong> You may request that we restrict the processing of your information in certain circumstances.</li>
                  <li><strong>Data Portability:</strong> You may request a copy of the information you provided to us in a structured, commonly used, and machine-readable format.</li>
                  <li><strong>Objection:</strong> You may object to our processing of your information based on our legitimate interests.</li>
                  <li><strong>Withdraw Consent:</strong> Where we process information based on your consent, you have the right to withdraw that consent at any time.</li>
                </ul>
                
                <p>
                  To exercise these rights, please contact us using the information provided in the "Contact Us" section below. Please note that these rights may be limited in some circumstances by applicable law.
                </p>
                
                <h2>9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country.
                </p>
                
                <p>
                  If we transfer your information to other countries, we will take appropriate safeguards to ensure that your information remains protected in accordance with this Privacy Policy and applicable law.
                </p>
                
                <h2>10. Children's Privacy</h2>
                <p>
                  Our services are not intended for individuals under the age of 18, and we do not knowingly collect personal information from children. If we learn that we have collected personal information from a child, we will take steps to delete that information as quickly as possible.
                </p>
                
                <h2>11. Changes to This Privacy Policy</h2>
                <p>
                  We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new privacy policy on this page and updating the "Last Updated" date.
                </p>
                
                <p>
                  We encourage you to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.
                </p>
                
                <h2>12. Contact Us</h2>
                <p>
                  If you have any questions about this privacy policy or our privacy practices, please contact us at:
                </p>
                
                <p>
                  <strong>Email:</strong> privacy@zvaultpay.com<br />
                  <strong>Address:</strong> ZVault, Inc.<br />
                  123 Privacy Boulevard<br />
                  San Francisco, CA 94103<br />
                  United States
                </p>
                
                <div className="mt-12 p-6 border rounded-lg border-blue-100 bg-blue-50">
                  <p className="text-sm text-neutral-600">
                    This Privacy Policy is for informational purposes only and does not constitute legal advice. We recommend consulting with legal counsel to ensure compliance with all applicable laws and regulations in the jurisdictions where you operate.
                  </p>
                </div>
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
                Have Questions About Our Privacy Policy?
              </motion.h2>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]" 
                variants={fadeInUp}
              >
                Our team is here to help you understand how we protect your privacy.
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