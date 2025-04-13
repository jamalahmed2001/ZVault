import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  ChatBubbleLeftRightIcon, 
  CheckCircleIcon,
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
  light: "py-20 lg:py-28 bg-[var(--color-background-alt)]",
  dark: "py-20 lg:py-28 bg-[var(--color-background)]"
};

// Consistent heading styling
const headingClasses = {
  section: "mb-6 text-3xl font-bold text-[var(--color-foreground)] md:text-4xl lg:text-5xl",
  sectionLight: "mb-6 text-3xl font-bold text-[var(--color-foreground-dark)] md:text-4xl lg:text-5xl",
  tagline: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--color-accent)]",
  taglineLight: "inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(10,25,48,0.1)] text-[var(--color-primary)]",
};

export default function Contact() {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    // Simulate API call with delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError("There was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact ZVault ZPay | Get Support & Connect With Our Team</title>
        <meta name="description" content="Have questions about ZPay? Contact our team for support, partnership opportunities, or general inquiries. We're here to help with your private payment needs." />
        <link rel="canonical" href="https://yourdomain.com/contact" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content="Contact ZVault ZPay | Get Support & Connect With Our Team" />
        <meta property="og:description" content="Have questions about ZPay? Contact our team for support, partnership opportunities, or general inquiries. We're here to help with your private payment needs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/contact" />
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
                Let's Connect
              </motion.div>
              <motion.h1 
                className="mb-8 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                style={{ color: "var(--color-primary-foreground)" }}
                variants={fadeInUp}
              >
                Get In <span style={{ color: "var(--color-accent)" }}>Touch</span>
              </motion.h1>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-3xl"
                style={{ color: "var(--color-foreground)" }}
                variants={fadeInUp}
              >
                Have questions or need support? Our team is ready to help you navigate
                the world of private payments.
              </motion.p>
            </motion.div>
          </div>
        </motion.section>

        {/* Contact Section - light background */}
        <motion.section 
          className={sectionClasses.light}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row gap-16">
              {/* Contact Form */}
              <motion.div 
                className="lg:w-2/3"
                variants={fadeInUp}
              >
                <span className={headingClasses.taglineLight}>Send a Message</span>
                <h2 className={headingClasses.sectionLight}>Contact Our Team</h2>
                <p className="text-lg text-[var(--color-foreground-dark-alt)] mb-10">
                  Fill out the form below, and a member of our team will get back to you 
                  within 24 hours.
                </p>

                {isSubmitted ? (
                  <motion.div 
                    className="bg-green-50 border border-green-200 rounded-xl p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-700 mb-2">Message Sent!</h3>
                    <p className="text-green-600 mb-6">
                      Thank you for reaching out. We've received your message and will respond shortly.
                    </p>
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="inline-flex items-center justify-center rounded-lg border border-green-500 bg-white px-6 py-3 text-green-600 shadow-sm transition-colors hover:bg-green-50"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-foreground-dark)]">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-[var(--color-border-light)] bg-white px-4 py-3 text-[var(--color-foreground)] shadow-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-colors"
                          placeholder="Jane Smith"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground-dark)]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-[var(--color-border-light)] bg-white px-4 py-3 text-[var(--color-foreground)] shadow-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-colors"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="subject" className="block text-sm font-medium text-[var(--color-foreground-dark)]">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[var(--color-border-light)] bg-white px-4 py-3 text-[var(--color-foreground)] shadow-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-colors"
                      >
                        <option value="" disabled>Select a subject</option>
                        <option value="Support">Technical Support</option>
                        <option value="Sales">Sales Inquiry</option>
                        <option value="Partnership">Partnership Opportunity</option>
                        <option value="Press">Press & Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="message" className="block text-sm font-medium text-[var(--color-foreground-dark)]">
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-[var(--color-border-light)] bg-white px-4 py-3 text-[var(--color-foreground)] shadow-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-light)] transition-colors"
                        placeholder="How can we help you?"
                      ></textarea>
                    </div>
                    
                    {error && (
                      <div className="rounded-lg bg-red-50 p-4 text-red-600 border border-red-200">
                        {error}
                      </div>
                    )}
                    
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-8 py-4 text-lg font-semibold text-[var(--color-accent-foreground)] shadow-md transition-all duration-300 hover:bg-[var(--color-accent-hover)] hover:shadow-xl ${
                          isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[var(--color-accent-foreground)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          "Send Message"
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
              
              {/* Contact Information - update styling only */}
              <motion.div 
                className="lg:w-1/3"
                variants={fadeInUp}
                transition={{ delay: 0.2 }}
              >
                <div className="rounded-xl p-8 lg:p-10 shadow-lg border border-[var(--color-border-light)]" 
                  style={{ backgroundColor: "var(--color-surface-light)" }}>
                  <h3 className="text-2xl font-bold text-[var(--color-foreground-dark)] mb-6">
                    Contact Information
                  </h3>
                  
                  <ul className="space-y-8 mb-10">
                    <li className="flex">
                      <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                        <EnvelopeIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm text-[var(--color-foreground-dark-alt)] font-medium mb-1">Email</h4>
                        <a href="mailto:support@zvaultpay.com" className="text-[var(--color-accent)] hover:text-[var(--color-accent)] font-semibold">
                          support@zvaultpay.com
                        </a>
                      </div>
                    </li>
                    
                    <li className="flex">
                      <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(10,25,48,0.2)", color: "var(--color-primary)" }}>
                        <MapPinIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm text-[var(--color-foreground-dark-alt)] font-medium mb-1">Headquarters</h4>
                        <p className="text-[var(--color-foreground-dark)]">
                          123 Privacy Boulevard<br />
                          Blockchain District<br />
                          San Francisco, CA 94103
                        </p>
                      </div>
                    </li>
                    
                    <li className="flex">
                      <div className="mr-4 h-12 w-12 flex-shrink-0 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(212,175,55,0.2)", color: "var(--color-accent)" }}>
                        <ChatBubbleLeftRightIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm text-[var(--color-foreground-dark-alt)] font-medium mb-1">Live Chat</h4>
                        <p className="text-[var(--color-foreground-dark)]">
                          Available Monday to Friday<br />
                          9:00 AM - 6:00 PM (UTC)
                        </p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className="pt-6 border-t border-[var(--color-border-light)]">
                    <h4 className="font-medium text-[var(--color-foreground-dark)] mb-4">Connect With Us</h4>
                    <div className="flex space-x-4">
                      <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-surface-light)] text-[var(--color-accent)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                      </a>
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-surface-light)] text-[var(--color-accent)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a 
                        href="https://linkedin.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-surface-light)] text-[var(--color-accent)] border border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Map Section */}
        <motion.section
          className={sectionClasses.dark}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
        >
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-8 text-center">Visit Our Office</h2>
            <div className="rounded-xl overflow-hidden shadow-lg border border-[var(--color-border)] h-96 w-full">
              {/* Replace with actual map implementation */}
              <div className="w-full h-full bg-[var(--color-surface)] flex items-center justify-center">
                <div className="text-center p-8">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
                  <p className="text-lg font-medium text-[var(--color-foreground)]">Interactive Map</p>
                  <p className="text-[var(--color-foreground-alt)] mt-2">
                    123 Privacy Boulevard, Blockchain District<br />
                    San Francisco, CA 94103
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Call to Action */}
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
              <motion.h2 
                className="mb-8 text-3xl font-bold md:text-4xl lg:text-5xl text-[var(--color-foreground-dark)]" 
                variants={fadeInUp}
              >
                Ready to Transform Your Payment Experience?
              </motion.h2>
              <motion.p 
                className="mb-12 text-lg md:text-xl mx-auto max-w-2xl text-[var(--color-foreground-dark-alt)]" 
                variants={fadeInUp}
              >
                Join thousands of businesses already using ZPay for private, secure transactions.
              </motion.p>
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
            </motion.div>
          </div>
        </motion.section>
      </main>
    </>
  );
}
              