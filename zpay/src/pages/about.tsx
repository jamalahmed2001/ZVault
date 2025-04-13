import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  UserGroupIcon, 
  LightBulbIcon, 
  DocumentTextIcon, 
  ArrowRightIcon, 
  GlobeAltIcon, 
  CurrencyDollarIcon,
  BeakerIcon
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

export default function About() {
  return (
    <>
      <Head>
        <title>About ZVault ZPay | Our Mission, Team & Technology</title>
        <meta name="description" content="Learn about ZVault ZPay's mission to revolutionize private payments with Zcash, our dedicated team, and the technology that powers true financial privacy." />
        <link rel="canonical" href="https://yourdomain.com/about" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="About ZVault ZPay | Our Mission, Team & Technology" />
        <meta property="og:description" content="Learn about ZVault ZPay's mission to revolutionize private payments with Zcash, our dedicated team, and the technology that powers true financial privacy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/about" />
        <meta property="og:image" content="https://yourdomain.com/og-image.png" />
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
              <motion.div 
                className="mb-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold backdrop-blur-sm"
                style={{ 
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-foreground)",
                  opacity: "0.9"
                }}
                variants={fadeInUp}
              >
                Our Story
              </motion.div>
              <motion.h1 
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Redefining <span style={{ color: "var(--color-accent)" }}>Financial Privacy</span>
              </motion.h1>
              <motion.p 
                className="mb-12 text-lg md:text-xl lg:text-2xl mx-auto max-w-3xl"
                style={{ color: "var(--color-foreground)" }}
                variants={fadeInUp}
              >
                ZPay by ZVault is pioneering a new era of truly private, secure, and seamless
                payment processing powered by Zcash technology.
              </motion.p>
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

        {/* Our Mission Section - Light Background */}
        <motion.section
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div className="lg:w-1/2" variants={fadeInUp}>
                <span className={headingClasses.taglineLight}>Our Mission</span>
                <LightBulbIcon className="h-16 w-16 mb-6" style={{ color: "var(--color-accent)" }} />
                <h2 className={headingClasses.sectionLight}>Building a Private Financial Future</h2>
                <p className="text-lg mb-8 leading-relaxed text-[var(--color-foreground-dark-alt)]">
                  At ZVault, we believe financial privacy is a fundamental right, not a privilege. 
                  Our mission is to provide businesses and individuals with payment solutions that 
                  protect transaction data through state-of-the-art cryptography, all while maintaining 
                  the speed and convenience expected in modern commerce.
                </p>
                <div className="space-y-6 text-[var(--color-foreground-dark-alt)] mb-8">
                  <div className="flex items-start">
                    <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                      <LockClosedIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-[var(--color-foreground-dark)]">Privacy by Design</h3>
                      <p>We integrate privacy at the core of our technology stack, not as an afterthought.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: "rgba(10,25,48,0.1)", color: "var(--color-primary)" }}>
                      <GlobeAltIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-[var(--color-foreground-dark)]">Financial Inclusion</h3>
                      <p>We're creating payment solutions accessible to everyone, regardless of geographical location.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center" 
                         style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                      <CurrencyDollarIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-[var(--color-foreground-dark)]">Transparent Operation</h3>
                      <p>While your payments remain private, our business practices are transparent and ethical.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="lg:w-1/2 relative"
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                <div className="aspect-square p-6 rounded-full flex items-center justify-center shadow-inner border border-[var(--color-border-light)]"
                     style={{ background: "var(--gradient-light)" }}>
                  <div className="w-full h-full rounded-full border-4 border-dashed border-[var(--color-border-light)] p-6 flex items-center justify-center animate-spin-slow">
                    <div className="w-full h-full rounded-full shadow-lg flex items-center justify-center"
                         style={{ background: "var(--gradient-blue-gold)" }}>
                      <div className="text-center p-8 text-[var(--color-primary-foreground)]">
                        <div className="font-bold text-3xl mb-2">ZVault</div>
                        <div className="text-lg font-medium" style={{ color: "var(--color-accent)" }}>Pioneering Private Finance</div>
                        <div className="mt-4 text-sm text-[var(--color-foreground)]">Est. 2023</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Our Technology Section - Dark Background */}
        <motion.section
          className={sectionClasses.dark}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-20 text-center" variants={fadeInUp}>
              <span className={headingClasses.tagline}>Powerful Technology</span>
              <h2 className={headingClasses.section}>The Science Behind ZPay</h2>
              <p className="mx-auto max-w-3xl text-lg mt-4 text-[var(--color-foreground-alt)]">
                ZPay leverages cutting-edge cryptographic techniques and blockchain technology 
                to deliver truly private payment processing.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
            >
              {/* Tech Feature 1 */}
              <motion.div 
                className={cardClasses}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                     style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 1-.659 1.591L9.75 14.5M15 3.186V7.5c0 .613-.246 1.2-.682 1.632m0 0-4.5 4.5a2.25 2.25 0 0 1-3.182 0l0 0a2.25 2.25 0 0 1 0-3.182" />
                  </svg>
                </div>
                <h3 className={headingClasses.card}>zk-SNARKs Technology</h3>
                <p className="text-[var(--color-foreground-alt)] leading-relaxed">
                  Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge allow verification 
                  of transaction authenticity without revealing any identifying data.
                </p>
              </motion.div>

              {/* Tech Feature 2 */}
              <motion.div 
                className={cardClasses}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full"
                     style={{ backgroundColor: "rgba(10,25,48,0.3)", color: "var(--color-foreground)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499" />
                  </svg>
                </div>
                <h3 className={headingClasses.card}>Shielded Transactions</h3>
                <p className="text-[var(--color-foreground-alt)] leading-relaxed">
                  Unlike transparent blockchains where all transaction data is public, 
                  ZPay's shielded transactions conceal sender, receiver, and amount information.
                </p>
              </motion.div>

              {/* Tech Feature 3 */}
              <motion.div 
                className={cardClasses}
                variants={fadeInUp}
                whileHover={cardHoverEffect}
              >
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full shadow-inner" 
                     style={{ 
                       background: "linear-gradient(to right, rgba(212,175,55,0.1), rgba(212,175,55,0.3))", 
                       borderColor: "rgba(212,175,55,0.3)", 
                       borderWidth: "1px",
                       color: "var(--color-accent)" 
                     }}>
                  <BeakerIcon className="h-8 w-8" />
                </div>
                <h3 className={headingClasses.card}>RESTful API Architecture</h3>
                <p className="text-[var(--color-foreground-alt)] leading-relaxed">
                  Our developer-friendly API enables seamless integration with existing 
                  e-commerce platforms and custom solutions using familiar REST principles.
                </p>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="mt-16 text-center"
              variants={fadeInUp}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/docs"
                className="inline-flex items-center rounded-lg px-8 py-4 text-lg font-semibold transition duration-300"
                style={{ 
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-foreground)"
                }}
              >
                <DocumentTextIcon className="mr-2 h-6 w-6" />
                Read the Technical Documentation
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Team Section - Light Background */}
        <motion.section
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-20 text-center" variants={fadeInUp}>
              <span className={headingClasses.taglineLight}>The Experts</span>
              <h2 className={headingClasses.sectionLight}>Meet Our Core Team</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-dark-alt)] mt-4">
                The driving force behind ZVault is a diverse team of cryptographers, 
                developers, and privacy advocates.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
            >
              {/* Team Member 1 */}
              <motion.div 
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className="h-64 flex items-center justify-center"
                     style={{ background: "var(--gradient-blue-gold)" }}>
                  <UserGroupIcon className="h-24 w-24 text-white/50" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--color-foreground-dark)] mb-2">Alex Morgan</h3>
                  <p className="text-[var(--color-accent)] font-medium mb-4">Founder & CEO</p>
                  <p className="text-[var(--color-foreground-dark-alt)]">
                    Cryptography expert with over 15 years of experience in privacy-focused technologies 
                    and a passion for financial sovereignty.
                  </p>
                </div>
              </motion.div>

              {/* Team Member 2 */}
              <motion.div 
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className="h-64 flex items-center justify-center"
                     style={{ background: "var(--gradient-gold)" }}>
                  <UserGroupIcon className="h-24 w-24 text-white/50" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--color-foreground-dark)] mb-2">Sofia Chen</h3>
                  <p className="text-[var(--color-accent)] font-medium mb-4">CTO</p>
                  <p className="text-[var(--color-foreground-dark-alt)]">
                    Blockchain architect and Zcash protocol specialist with a background in 
                    cryptographic systems and distributed computing.
                  </p>
                </div>
              </motion.div>

              {/* Team Member 3 */}
              <motion.div 
                className={cardClassesLight}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <div className="h-64 flex items-center justify-center"
                     style={{ background: "var(--gradient-blue-gold)" }}>
                  <UserGroupIcon className="h-24 w-24 text-white/50" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--color-foreground-dark)] mb-2">Marcus Kim</h3>
                  <p className="text-[var(--color-accent)] font-medium mb-4">Lead Developer</p>
                  <p className="text-[var(--color-foreground-dark-alt)]">
                    Full-stack engineer with expertise in secure API development, React, and 
                    payment processing systems integration.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Values Section - Dark Background */}
        <motion.section
          className={sectionClasses.dark}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6">
            <motion.div className="mb-16 text-center" variants={fadeInUp}>
              <span className={headingClasses.tagline}>Our Values</span>
              <h2 className={headingClasses.section}>Principles That Guide Us</h2>
              <p className="mx-auto max-w-3xl text-lg text-[var(--color-foreground-alt)] mt-4">
                Our core values drive every decision we make at ZVault.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
              variants={fadeInUp}
            >
              <div>
                <ul className="space-y-8">
                  <li className="flex">
                    <div className="mr-6 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                      <ShieldCheckIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-[var(--color-foreground)]">Privacy as a Right</h3>
                      <p className="text-[var(--color-foreground-alt)]">We believe every person and business deserves control over their financial information.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-6 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: "rgba(26,42,58,0.3)", color: "var(--color-foreground)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-[var(--color-foreground)]">Quality Execution</h3>
                      <p className="text-[var(--color-foreground-alt)]">We're committed to building reliable, secure, and elegant solutions that simply work.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-6 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-[var(--color-foreground)]">Global Perspective</h3>
                      <p className="text-[var(--color-foreground-alt)]">We design for global accessibility, serving users from every corner of the world.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="relative">
                <div className={cardClasses}>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-4">Our Promise</h3>
                    <p className="text-[var(--color-foreground-alt)] mb-6 leading-relaxed">
                      "At ZVault, we promise to remain at the forefront of payment privacy technology, 
                      continually innovating to protect our users' financial sovereignty while providing 
                      seamless and reliable service."
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center"
                           style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                        <UserGroupIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-foreground)]">The ZVault Team</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

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
                Ready to Experience True Payment Privacy?
              </motion.h2>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]" 
                variants={fadeInUp}
              >
                Join us in building a more private financial future. Get started with ZPay today.
              </motion.p>
              <motion.div className="flex flex-col sm:flex-row justify-center items-center gap-4" variants={fadeInUp}>
                <Link 
                  href="/"
                  className="transform rounded-lg px-10 py-4 text-lg font-semibold shadow-lg transition duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 animate-pulse-slow"
                  style={{ 
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-accent-foreground)" 
                  }}
                >
                  Get Started Free
                  <ArrowRightIcon className="inline-block h-6 w-6 ml-3"/>
                </Link>
                <Link 
                  href="/contact"
                  className="transform rounded-lg border px-8 py-4 text-lg font-semibold backdrop-blur-sm transition duration-300 ease-in-out hover:-translate-y-1"
                  style={{ 
                    borderColor: "var(--color-border-light)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--color-foreground-dark)"
                  }}
                >
                  Contact Our Team
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>
    </>
  );
} 