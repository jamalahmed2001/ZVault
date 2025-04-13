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
                <p className="lead text-lg text-black mb-8">
                  Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the ZPay service operated by ZVault ("us", "we", "our"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
                </p>

                <p className="font-medium">
                  By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
                </p>
                
                <h2>1. Service Description</h2>
                <p>
                  ZVault provides ZPay, a payment processing service that facilitates private cryptocurrency transactions using Zcash's shielded transaction technology. Our service allows businesses and individuals to accept Zcash payments through API integration, payment buttons, and other methods.
                </p>
                
                <h2>2. Account Registration and Requirements</h2>
                <p>
                  To use certain features of our Service, you must register for an account. When you register, you agree to provide accurate, current, and complete information about yourself and to keep this information updated.
                </p>
                
                <p>
                  You are responsible for:
                </p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                </ul>
                
                <p>
                  We reserve the right to suspend or terminate your account if we determine, in our sole discretion, that you have violated these Terms.
                </p>
                
                <h2>3. Service Usage Requirements</h2>
                <h3>3.1 Acceptable Use</h3>
                <p>
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
                </p>
                <ul>
                  <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                  <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way</li>
                  <li>To engage in any activity that is fraudulent, false, or misleading</li>
                  <li>To transmit or facilitate the distribution of any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
                  <li>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service</li>
                  <li>For any purpose that competes with our business</li>
                </ul>
                
                <h3>3.2 Prohibited Activities</h3>
                <p>
                  You specifically agree not to use our Service for:
                </p>
                <ul>
                  <li>Any illegal activity, including but not limited to money laundering, terrorist financing, or fraud</li>
                  <li>Sale of illegal goods or services</li>
                  <li>Sale of counterfeit or unauthorized goods</li>
                  <li>Activities that infringe on intellectual property rights</li>
                  <li>Activities that violate export control or sanctions regulations</li>
                  <li>High-risk activities where the failure of the Service could lead to death, personal injury, or environmental damage</li>
                </ul>
                
                <h2>4. KYC and Compliance Responsibilities</h2>
                <p>
                  ZVault ZPay is a payment processing infrastructure service. We do not directly interact with the end users who make payments through our platform. As such, certain compliance responsibilities fall to you as our customer.
                </p>
                
                <h3>4.1 Your Compliance Obligations</h3>
                <p>
                  You acknowledge and agree that:
                </p>
                <ul>
                  <li><strong>You are solely responsible</strong> for complying with all applicable Know Your Customer (KYC), Anti-Money Laundering (AML), Counter-Terrorist Financing (CTF), and other regulatory requirements in the jurisdictions where you operate.</li>
                  <li>You will implement appropriate procedures to verify the identity of your customers when required by applicable laws and regulations.</li>
                  <li>You will maintain appropriate records of customer identification and transactions as required by relevant regulations.</li>
                  <li>You will monitor transactions for suspicious activity and report as required by applicable laws.</li>
                  <li>You will obtain all necessary licenses, registrations, and permissions to conduct your business and use our Service.</li>
                </ul>
                
                <h3>4.2 Our Compliance Measures</h3>
                <p>
                  While primary KYC responsibility rests with you, we retain the right to:
                </p>
                <ul>
                  <li>Request information from you to verify your compliance with regulatory requirements.</li>
                  <li>Suspend or terminate your access to our services if we have reason to believe you are not in compliance with applicable regulations.</li>
                  <li>Report suspicious activity to relevant authorities as required by law.</li>
                  <li>Implement risk-based monitoring of our platform's usage.</li>
                </ul>
                
                <h3>4.3 Liability for Compliance</h3>
                <p>
                  You agree to indemnify and hold harmless ZVault from any claims, damages, liabilities, costs, or expenses (including reasonable attorneys' fees) arising from your failure to comply with applicable laws and regulations, including KYC, AML, and CTF requirements.
                </p>
                
                <h2>5. Payment Terms</h2>
                <h3>5.1 Fees</h3>
                <p>
                  ZVault charges a fee for the use of our Service as described on our pricing page. We reserve the right to change our fees at any time by providing notice through our website or direct communication. Continued use of the Service after such notice constitutes acceptance of the new fees.
                </p>
                
                <h3>5.2 Payment Processing</h3>
                <p>
                  ZPay facilitates Zcash transactions between your customers and your designated Zcash shielded address. We do not hold, store, or escrow funds at any point in the transaction process. Payments are sent directly to your specified Zcash address.
                </p>
                
                <h3>5.3 Refunds and Chargebacks</h3>
                <p>
                  Due to the nature of cryptocurrency transactions, all payments processed through our Service are final and non-reversible. You are responsible for managing refunds to your customers directly from your own Zcash address. We provide tools to help you track and manage refunds, but the execution of refunds is your responsibility.
                </p>
                
                <h2>6. Intellectual Property</h2>
                <h3>6.1 Our Intellectual Property</h3>
                <p>
                  The Service and its original content, features, and functionality are and will remain the exclusive property of ZVault and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of ZVault.
                </p>
                
                <h3>6.2 License to Use Our Service</h3>
                <p>
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to use our Service for your personal or business purposes. This license does not include the right to:
                </p>
                <ul>
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose other than to process payments for your business</li>
                  <li>Attempt to decompile or reverse engineer any software contained in our Service</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>
                
                <h3>6.3 Your Content</h3>
                <p>
                  You retain all rights to any content you submit, post, or display on or through the Service. By submitting, posting, or displaying content on or through the Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content in connection with providing the Service.
                </p>
                
                <h2>7. Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Our Privacy Policy, which is incorporated into these Terms by reference, explains how we collect, use, and protect your personal information. By using our Service, you consent to the collection and use of information as described in our Privacy Policy.
                </p>
                
                <h2>8. Disclaimers and Limitations of Liability</h2>
                <h3>8.1 Service Provided "As Is"</h3>
                <p>
                  YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK. THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. ZVAULT EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                
                <h3>8.2 No Warranty of Service Availability</h3>
                <p>
                  ZVAULT DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, THAT THE RESULTS THAT MAY BE OBTAINED FROM THE USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE, OR THAT ANY ERRORS IN THE SERVICE WILL BE CORRECTED.
                </p>
                
                <h3>8.3 Cryptocurrency Risks</h3>
                <p>
                  You acknowledge that cryptocurrencies involve significant risks, including but not limited to price volatility, regulatory uncertainty, and technical vulnerabilities. ZVault is not responsible for any losses you may incur due to cryptocurrency price fluctuations or any other inherent risks of cryptocurrency usage.
                </p>
                
                <h3>8.4 Limitation of Liability</h3>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ZVAULT, ITS AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA OR OTHER INTANGIBLE LOSSES, THAT RESULT FROM THE USE OF, OR INABILITY TO USE, THE SERVICE.
                </p>
                
                <p>
                  IN NO EVENT WILL ZVAULT'S TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, OR CAUSES OF ACTION EXCEED THE AMOUNT YOU HAVE PAID TO ZVAULT IN THE LAST SIX (6) MONTHS, OR, IF GREATER, ONE HUNDRED DOLLARS ($100).
                </p>
                
                <h3>8.5 Indemnification</h3>
                <p>
                  You agree to defend, indemnify, and hold harmless ZVault, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.
                </p>
                
                <h2>9. Term and Termination</h2>
                <p>
                  These Terms shall remain in full force and effect while you use the Service. We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                </p>
                
                <p>
                  Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
                </p>
                
                <p>
                  All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
                </p>
                
                <h2>10. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of such changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                </p>
                
                <p>
                  It is your responsibility to review these Terms periodically for changes. If you do not agree to the revised Terms, you must stop using the Service.
                </p>
                
                <h2>11. Governing Law and Dispute Resolution</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
                </p>
                
                <p>
                  Any dispute arising out of or relating to these Terms or the Service shall be resolved exclusively through final and binding arbitration in San Francisco, California, using the rules of the American Arbitration Association. The arbitration shall be conducted by a single arbitrator, and judgment on the award rendered by the arbitrator may be entered in any court having jurisdiction thereof.
                </p>
                
                <p>
                  Any arbitration under these Terms will take place on an individual basis; class arbitrations and class actions are not permitted. You understand that by agreeing to these Terms, you and ZVault are each waiving the right to trial by jury or to participate in a class action.
                </p>
                
                <h2>12. Waiver and Severability</h2>
                <p>
                  The failure of ZVault to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                </p>
                
                <h2>13. Integration and Entire Agreement</h2>
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and ZVault regarding the Service and supersede all prior and contemporaneous agreements, proposals, or representations, written or oral, concerning its subject matter.
                </p>
                
                <h2>14. Force Majeure</h2>
                <p>
                  ZVault shall not be liable for any delay or failure to perform resulting from causes outside its reasonable control, including but not limited to acts of God, natural disasters, pandemic, war, terrorism, riots, civil unrest, government action, labor disputes, or Internet service provider failures or delays.
                </p>
                
                <h2>15. Relationship of the Parties</h2>
                <p>
                  Nothing in these Terms shall be construed as creating a partnership, joint venture, agency, employment, or fiduciary relationship between you and ZVault.
                </p>
                
                <h2>16. Assignment</h2>
                <p>
                  You may not assign these Terms or any rights or obligations hereunder without the prior written consent of ZVault, and any attempted assignment without such consent will be void. ZVault may assign these Terms without restriction.
                </p>
                
                <h2>17. Notifications</h2>
                <p>
                  We may provide notifications to you via email, regular mail, or postings on our website. You may provide notifications to us by contacting us at the address below.
                </p>
                
                <h2>18. Contact Information</h2>
                <p>
                  If you have any questions about these Terms, please contact us at:
                </p>
                
                <p>
                  <strong>Email:</strong> legal@zvaultpay.com<br />
                  <strong>Address:</strong> ZVault, Inc.<br />
                  123 Privacy Boulevard<br />
                  San Francisco, CA 94103<br />
                  United States
                </p>
                
                <div className="mt-12 p-6 border rounded-lg border-blue-100 bg-blue-50">
                  <p className="text-sm text-neutral-600">
                    This Terms of Service document is for informational purposes only and does not constitute legal advice. We recommend consulting with legal counsel to ensure compliance with all applicable laws and regulations in the jurisdictions where you operate.
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