import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  LockClosedIcon, 
  CodeBracketIcon, 
  CreditCardIcon, 
  GlobeAltIcon, 
  QuestionMarkCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

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

// Update styling constants
const sectionClasses = {
  light: "py-20 lg:py-24 bg-[var(--color-background-alt)]",
  dark: "py-20 lg:py-24 bg-[var(--color-background)]"
};

// Consistent heading styling
const headingClasses = {
  section: "mb-6 text-3xl font-bold text-[var(--color-foreground)] md:text-4xl lg:text-5xl",
  sectionLight: "mb-6 text-3xl font-bold text-[var(--color-foreground-dark)] md:text-4xl lg:text-5xl",
  tagline: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--color-accent)]",
  taglineLight: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(10,25,48,0.1)] text-[var(--color-primary)]",
};

// Card styling
const cardClasses = "h-full rounded-xl bg-[var(--color-surface)] p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] card-hover";
const cardClassesLight = "h-full rounded-xl bg-[var(--color-surface-light)] p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent)] card-hover";

// FAQ Categories
const categories = [
  { id: "general", name: "General", icon: QuestionMarkCircleIcon },
  { id: "payment", name: "Payments", icon: CurrencyDollarIcon },
  { id: "security", name: "Security & Privacy", icon: ShieldCheckIcon },
  { id: "integration", name: "Integration", icon: CodeBracketIcon },
  { id: "account", name: "Account", icon: CreditCardIcon },
  { id: "support", name: "Support", icon: GlobeAltIcon },
];

// FAQ Questions
const faqs = {
  general: [
    {
      question: "What is ZVault ZPay?",
      answer: "ZVault ZPay is a private payment processing platform powered by Zcash blockchain technology. We enable businesses and individuals to accept secure, private cryptocurrency payments with instant settlement and no intermediaries holding your funds."
    },
    {
      question: "How is ZPay different from other payment processors?",
      answer: "Unlike traditional payment processors that expose transaction data or standard crypto payment services, ZPay offers true transaction privacy through Zcash's zk-SNARKs technology. We also offer direct payouts to your shielded address, eliminating the need for a third party to hold your funds."
    },
    {
      question: "What cryptocurrencies does ZPay support?",
      answer: "Currently, ZPay exclusively supports Zcash (ZEC) through shielded transactions. This specialized focus allows us to provide the highest level of privacy and security for all transactions. We may add support for additional privacy-focused cryptocurrencies in the future."
    },
    {
      question: "Where can I use ZPay?",
      answer: "ZPay can be integrated into virtually any online business model including e-commerce stores, digital services, content creators, freelancers, subscription services, and more. If you can sell it online, you can accept payment through ZPay."
    }
  ],
  payment: [
    {
      question: "How quickly are payments processed?",
      answer: "Payments are processed as quickly as the Zcash network confirms transactions, typically within 10-40 minutes depending on network conditions. Your funds are sent directly to your designated Zcash address immediately upon confirmation."
    },
    {
      question: "Are there transaction limits?",
      answer: "Standard accounts can process up to $10,000 USD equivalent per day with no monthly limits. Enterprise accounts can be configured with custom limits based on business needs. There are no minimum transaction amounts."
    },
    {
      question: "What are the fees for using ZPay?",
      answer: "ZPay charges a flat 1% fee on successful transactions, which is among the lowest in the cryptocurrency payment industry. There are no monthly fees, setup costs, or hidden charges. Enterprise customers may qualify for volume-based discounts."
    },
    {
      question: "How do refunds work?",
      answer: "Merchants can issue refunds through the ZPay dashboard by referencing the original transaction ID. The refund will be processed as a new transaction from the merchant's Zcash address back to the customer's original payment address."
    },
    {
      question: "Can I receive automatic payouts in fiat currency?",
      answer: "Currently, ZPay focuses exclusively on Zcash payments with settlement directly to your Zcash address. Automatic conversion to fiat currencies is not supported at this time, but may be added as a feature in the future."
    }
  ],
  security: [
    {
      question: "How does ZPay protect transaction privacy?",
      answer: "ZPay leverages Zcash's zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) to shield all transaction details. This cryptographic technology ensures that transaction metadata such as sender, receiver, and amount remain private and are not visible on the public blockchain."
    },
    {
      question: "Is my customer's payment information secure?",
      answer: "Absolutely. When customers pay through ZPay, their payment information is protected by Zcash's encryption protocols. No sensitive payment details are stored on our servers, and all transaction data is shielded using zero-knowledge proofs."
    },
    {
      question: "What security measures does ZPay implement?",
      answer: "ZPay implements industry-leading security practices including encrypted communications (TLS), secure API authentication, IP filtering, rate limiting, and regular security audits. Our infrastructure is hosted on secure cloud platforms with multiple layers of protection."
    },
    {
      question: "Can transaction data be subpoenaed or seized?",
      answer: "ZPay does not store transaction amounts, sender/receiver information, or other private transaction details, so this information cannot be provided. We only maintain minimal records required for operational purposes, such as API usage statistics and account information."
    }
  ],
  integration: [
    {
      question: "How do I integrate ZPay with my website?",
      answer: "ZPay offers multiple integration options: 1) Pre-built payment buttons for simple implementations, 2) REST API for custom integrations, and 3) Plugins for popular e-commerce platforms. Our documentation provides step-by-step guides for each method."
    },
    {
      question: "Which e-commerce platforms are supported?",
      answer: "We currently offer official plugins for WooCommerce, Shopify, Magento, and OpenCart. Our REST API can be used to create custom integrations with any platform. More official plugins are being developed based on user demand."
    },
    {
      question: "Do I need technical knowledge to use ZPay?",
      answer: "Basic technical knowledge is helpful but not required. Our pre-built payment buttons require minimal setup - just copy and paste a snippet of code. For more complex integrations, some development experience is beneficial, or you can work with a developer familiar with API integration."
    },
    {
      question: "How do webhooks work with ZPay?",
      answer: "Webhooks are HTTP callbacks that notify your system when a payment event occurs. When a customer completes a payment, ZPay sends a webhook notification to your specified URL with transaction details. This allows your system to automatically update orders, deliver digital products, or trigger other business processes."
    }
  ],
  account: [
    {
      question: "How do I create a ZPay account?",
      answer: "Creating a ZPay account is simple: 1) Visit our signup page, 2) Enter your email and create a password (or sign up with Google), 3) Verify your email address, 4) Enter your business details and Zcash address, 5) Set up your webhook URL. The entire process takes less than 10 minutes."
    },
    {
      question: "What information do I need to provide when signing up?",
      answer: "To create a basic account, you'll need to provide: 1) Your email address, 2) Your business name, 3) Your website URL for webhook verification, and 4) A Zcash shielded address (zs...) where you want to receive payments."
    },
    {
      question: "Can I have multiple Zcash addresses for different products?",
      answer: "Yes, ZPay allows you to set up multiple payment destinations for different product lines, websites, or business divisions. You can configure different Zcash addresses for various payment buttons or API endpoints through your dashboard."
    },
    {
      question: "How do I update my account information?",
      answer: "You can update your account information, including your business details, Zcash address, webhook URL, and API settings through the ZPay dashboard. Changes to critical settings like payment addresses require re-authentication for security."
    }
  ],
  support: [
    {
      question: "How can I get help with ZPay integration?",
      answer: "We offer multiple support channels: 1) Comprehensive documentation at docs.zvaultpay.com, 2) Email support at support@zvaultpay.com, 3) Live chat during business hours, and 4) Video tutorials on our YouTube channel. Enterprise customers also receive access to dedicated support specialists."
    },
    {
      question: "Does ZPay offer technical support?",
      answer: "Yes, our technical support team is available to help with integration issues, webhook configuration, and general troubleshooting. Standard support is available through email with a 24-hour response time. Premium and Enterprise accounts receive priority support with faster response times."
    },
    {
      question: "What should I do if a payment doesn't arrive?",
      answer: "If a payment doesn't arrive in your wallet, first check the transaction status in your ZPay dashboard. If the transaction shows as confirmed but funds haven't arrived, contact our support team with the transaction ID. We'll help track and resolve the issue promptly."
    },
    {
      question: "Are there resources to help with integration?",
      answer: "Yes, we provide extensive resources including detailed documentation, integration guides, code examples, SDKs for popular programming languages, and video tutorials. These resources cover everything from basic setup to advanced integration scenarios."
    },
    {
      question: "How do I report a security issue?",
      answer: "If you discover a security vulnerability, please contact us immediately at security@zvaultpay.com with detailed information. We have a responsible disclosure policy and work quickly to address security concerns. Please encrypt sensitive information using our PGP key available on our security page."
    }
  ]
};

export default function FAQ() {
  return (
    <>
      <Head>
        <title>Frequently Asked Questions | ZVault ZPay</title>
        <meta name="description" content="Find answers to common questions about ZVault ZPay's private payment processing, security features, integration options, and account management." />
        <link rel="canonical" href="https://yourdomain.com/faq" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Frequently Asked Questions | ZVault ZPay" />
        <meta property="og:description" content="Find answers to common questions about ZVault ZPay's private payment processing, security features, integration options, and account management." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/faq" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />
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
                Help Center
              </motion.div>
              <motion.h1 
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Frequently Asked <span style={{ color: "var(--color-accent)" }}>Questions</span>
              </motion.h1>
              <motion.p 
                className="mb-8 text-lg md:text-xl mx-auto max-w-3xl"
                style={{ color: "var(--color-foreground)" }}
                variants={fadeInUp}
              >
                Find answers to common questions about ZVault ZPay's private payment processing.
              </motion.p>
              
              {/* Search Bar - update input styling */}
              <motion.div
                className="mx-auto max-w-2xl relative"
                variants={fadeInUp}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for answers..."
                    className="w-full rounded-lg border-2 border-white/20 bg-white/10 px-5 py-4 pl-12 text-white placeholder-white/60 backdrop-blur-sm focus:border-[var(--color-accent)]/70 focus:outline-none focus:ring-0 transition-colors"
                  />
                  <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Decorative Element */}
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

        {/* Categories Section - Light Background */}
        <motion.section
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-16 text-center" variants={fadeInUp}>
              <span className={headingClasses.taglineLight}>Browse by Topic</span>
              <h2 className={headingClasses.sectionLight}>FAQ Categories</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-dark-alt)] mt-4">
                Find the information you need by exploring our frequently asked questions by category.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {categories.map((category) => (
                <motion.a
                  key={category.id}
                  href={`#${category.id}`}
                  className={cardClassesLight}
                  variants={fadeInUp}
                >
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                       style={{ backgroundColor: "rgba(10,25,48,0.1)", color: "var(--color-primary)" }}>
                    <category.icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[var(--color-foreground-dark)]">{category.name}</h3>
                  <p className="text-[var(--color-foreground-dark-alt)] leading-relaxed">
                    {category.id === "general" && "Basic information about ZVault ZPay"}
                    {category.id === "payment" && "Questions about processing payments"}
                    {category.id === "security" && "Privacy and security information"}
                    {category.id === "integration" && "Help with implementing ZPay"}
                    {category.id === "account" && "Managing your ZPay account"}
                    {category.id === "support" && "Getting help with ZPay"}
                  </p>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Content Sections - alternate between light/dark */}
        {categories.map((category, index) => (
          <motion.section
            key={category.id}
            id={category.id}
            className={index % 2 === 0 ? sectionClasses.dark : sectionClasses.light}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <div className="container mx-auto px-6">
              <motion.div 
                className="flex items-center mb-12 gap-4"
                variants={fadeInUp}
              >
                <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                   style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                  <category.icon className="h-6 w-6" />
                </div>
                <h2 className={`text-3xl font-bold ${index % 2 === 0 ? "text-[var(--color-foreground)]" : "text-[var(--color-foreground-dark)]"}`}>
                  {category.name} Questions
                </h2>
              </motion.div>

              <motion.div 
                className="space-y-6"
                variants={staggerContainer}
              >
                {faqs[category.id as keyof typeof faqs].map((faq, i) => (
                  <motion.details
                    key={i}
                    className={`group rounded-xl overflow-hidden ${index % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-light)]"} shadow-md border ${index % 2 === 0 ? "border-[var(--color-border)]" : "border-[var(--color-border-light)]"}`}
                    variants={fadeInUp}
                  >
                    <summary className="flex cursor-pointer items-center justify-between p-6">
                      <h3 className={`text-lg font-semibold ${index % 2 === 0 ? "text-[var(--color-accent)]" : "text-[var(--color-foreground-dark)]"}`}>
                        {faq.question}
                      </h3>
                      <span className={`ml-6 flex-shrink-0 rounded-full p-1.5 transition-colors ${index % 2 === 0 ? "bg-[rgba(26,42,58,0.3)] text-[var(--color-accent)]" : "bg-[rgba(10,25,48,0.1)] text-[var(--color-primary)]"} group-open:bg-[rgba(212,175,55,0.2)] group-open:text-[var(--color-accent)]`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </summary>
                    <div className={`px-6 py-4 border-t ${index % 2 === 0 ? "border-[var(--color-border)]" : "border-[var(--color-border-light)]"}`}>
                      <p className={`leading-relaxed ${index % 2 === 0 ? "text-[var(--color-foreground-alt)]" : "text-[var(--color-foreground-dark-alt)]"}`}>
                        {faq.answer}
                      </p>
                    </div>
                  </motion.details>
                ))}
              </motion.div>
            </div>
          </motion.section>
        ))}

        {/* CTA Section - updated to use gradient blue */}
        <motion.section
          className="relative overflow-hidden py-20"
          style={{ 
            background: "var(--gradient-light)",
            color: "var(--color-foreground-dark)" 
          }}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              variants={staggerContainer}
            >
              <motion.div className="mb-6" variants={fadeInUp}>
                <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
              </motion.div>
              <motion.h2 
                className="mb-8 text-3xl font-bold md:text-4xl lg:text-5xl text-[var(--color-foreground-dark)]" 
                variants={fadeInUp}
              >
                Didn't Find Your Answer?
              </motion.h2>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]" 
                variants={fadeInUp}
              >
                Our support team is here to help with any other questions you might have.
              </motion.p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link 
                  href="/contact"
                  className="transform rounded-lg px-10 py-4 text-lg font-semibold shadow-lg transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 animate-pulse-slow"
                  style={{ 
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)" 
                  }}
                >
                  Contact Support
                  <ArrowRightIcon className="inline-block h-6 w-6 ml-3"/>
                </Link>
                <Link 
                  href="/docs"
                  className="rounded-lg border px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300 hover:bg-[rgba(10,25,48,0.05)]"
                  style={{ 
                    borderColor: "var(--color-border-light)",
                    color: "var(--color-foreground-dark)"
                  }}
                >
                  Read Documentation
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Additional resources */}
        <motion.section
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-12 text-center" variants={fadeInUp}>
              <h2 className="text-3xl font-bold text-[var(--color-foreground-dark)] mb-4">Additional Resources</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-dark-alt)] mt-4">
                Explore these resources to learn more about ZPay and get the most out of our platform.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              <motion.a
                href="/docs"
                className={cardClassesLight}
                variants={fadeInUp}
              >
                <CodeBracketIcon className="h-12 w-12 mb-4" style={{ color: "var(--color-primary)" }} />
                <h3 className="mb-2 text-xl font-bold text-[var(--color-foreground-dark)]">Developer Documentation</h3>
                <p className="text-[var(--color-foreground-dark-alt)] mb-4 leading-relaxed">
                  Comprehensive guides and API references for integrating ZPay.
                </p>
                <div className="mt-auto flex items-center text-[var(--color-accent)] font-medium">
                  View Documentation <ArrowRightIcon className="ml-2 h-5 w-5" />
                </div>
              </motion.a>

              <motion.a
                href="/blog"
                className={cardClassesLight}
                variants={fadeInUp}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 mb-4" style={{ color: "var(--color-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                </svg>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-foreground-dark)]">Blog & Tutorials</h3>
                <p className="text-[var(--color-foreground-dark-alt)] mb-4">
                  Implementation guides, use cases, and updates about ZPay features.
                </p>
                <div className="mt-auto flex items-center text-[var(--color-accent)] font-medium">
                  Read Articles <ArrowRightIcon className="ml-2 h-5 w-5" />
                </div>
              </motion.a>

              <motion.a
                href="https://youtube.com"
                target="_blank" 
                rel="noopener noreferrer"
                className={cardClassesLight}
                variants={fadeInUp}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 mb-4" style={{ color: "var(--color-primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <h3 className="mb-2 text-xl font-bold text-[var(--color-foreground-dark)]">Video Tutorials</h3>
                <p className="text-[var(--color-foreground-dark-alt)] mb-4">
                  Step-by-step video guides for setting up and using ZPay.
                </p>
                <div className="mt-auto flex items-center text-[var(--color-accent)] font-medium">
                  Watch Videos <ArrowRightIcon className="ml-2 h-5 w-5" />
                </div>
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* Feedback Section */}
        <motion.section
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
        >
          <div className="container mx-auto px-6 text-center">
            <h2 className="mb-4 text-2xl font-bold text-[var(--color-foreground-dark)]">Was This Helpful?</h2>
            <p className="mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)] mb-8">
              Help us improve our FAQ section by providing feedback.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface-light)] px-6 py-3 font-medium text-[var(--color-foreground-dark)] hover:bg-[rgba(10,25,48,0.05)] transition-colors">
                Yes, it was helpful
              </button>
              <button className="rounded-lg border border-[var(--color-border-light)] bg-[var(--color-surface-light)] px-6 py-3 font-medium text-[var(--color-foreground-dark)] hover:bg-[rgba(10,25,48,0.05)] transition-colors">
                No, I need more help
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </>
  );
} 