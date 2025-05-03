import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { motion } from "framer-motion";
import { 
  ArrowPathIcon, 
  CheckIcon, 
  KeyIcon, 
  GlobeAltIcon, 
  UserCircleIcon, 
  CogIcon, 
  CurrencyDollarIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';



import { api } from "@/utils/api";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/api/root";
import { loadStripe } from '@stripe/stripe-js';

// Animation variants
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

export default function Account() {
  const { data: session } = useSession();
  const utils = api.useContext();
  
  // Section visibility state
  const [visibleSection, setVisibleSection] = useState<string | null>("api-keys");
  
  // Test webhook state
  const [invoiceId, setInvoiceId] = useState("477");
  const [userId, setUserId] = useState("1");
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState<null | { 
    success: boolean; 
    message: string; 
    payload?: any;
    response?: any 
  }>(null);
  
  // User profile settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [zecAddress, setZecAddress] = useState("zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly");
  const [addressVisible, setAddressVisible] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState<boolean | null>(null);
  const [saveSettingsMessage, setSaveSettingsMessage] = useState<string | null>(null);
  const clearClipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API key state
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  // Add state for copy feedback
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  
  // Stripe payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Stripe subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  // Stripe publishable key (replace with your actual key or env variable)
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

  // Replace with your actual Stripe price ID for the subscription
  const STRIPE_SUBSCRIPTION_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1RKiebEln2I26eQPnZ9Q75em';

  // Fetch user profile data
  const userProfile = api.auth.getUserProfile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Add API key fetching
  const apiKeysQuery = api.auth.getApiKeys.useQuery(undefined, { enabled: paymentSuccess });

  // Update user settings mutation
  const updateUserSettings = api.auth.updateUserSettings.useMutation({
    onSuccess: () => {
      setSaveSettingsSuccess(true);
      setSaveSettingsMessage("Settings saved successfully!");
      setTimeout(() => {
        setSaveSettingsSuccess(null);
        setSaveSettingsMessage(null);
      }, 3000);
      // Invalidate user profile query to refresh data
      utils.auth.getUserProfile.invalidate();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setSaveSettingsSuccess(false);
      setSaveSettingsMessage(`Error: ${error.message}`);
      setTimeout(() => {
        setSaveSettingsSuccess(null);
        setSaveSettingsMessage(null);
      }, 3000);
    }
  });

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    setVisibleSection(visibleSection === sectionId ? null : sectionId);
  };

  // Update API key when selected
  const handleApiKeySelect = (apiKey: string) => {
    setSelectedApiKey(apiKey);
  };

  // Copy address to clipboard securely
  const copyAddress = () => {
    navigator.clipboard.writeText(zecAddress);
    
    // Clear timeout if it exists
    if (clearClipboardTimeoutRef.current) {
      clearTimeout(clearClipboardTimeoutRef.current);
    }
    
    // Clear clipboard after 60 seconds for security
    clearClipboardTimeoutRef.current = setTimeout(() => {
      navigator.clipboard.writeText('');
      console.log('Clipboard cleared for security');
    }, 60000);
  };
  
  // Clean up clipboard timeout on unmount
  useEffect(() => {
    return () => {
      if (clearClipboardTimeoutRef.current) {
        clearTimeout(clearClipboardTimeoutRef.current);
      }
    };
  }, []);

  // Copy API key to clipboard
  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  // Save user settings
  const saveSettings = () => {
    updateUserSettings.mutate({
      zcashAddress: zecAddress,
      notificationsEnabled,
    });
  };

  // Mask address for display
  const maskAddress = (address: string) => {
    if (!address) return "";
    const firstChars = address.substring(0, 8);
    const lastChars = address.substring(address.length - 8);
    return `${firstChars}...${lastChars}`;
  };

  // Generate section content
  const renderSectionContent = (sectionId: string) => {
    if (visibleSection !== sectionId) return null;
    
    switch (sectionId) {
 
      case "profile":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Payout Settings</h3>
              <div>
                <label htmlFor="zecAddress" className="block mb-2" style={{ color: "var(--color-foreground)" }}>
                  Zcash Shielded Address (zs...)
                </label>
                <div className="relative">
                  <input
                    type={addressVisible ? "text" : "password"}
                    id="zecAddress"
                    value={zecAddress}
                    onChange={(e) => setZecAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none"
                    style={{ 
                      backgroundColor: "var(--color-surface)", 
                      borderColor: "var(--color-border)", 
                      borderWidth: "1px",
                      color: "var(--color-foreground)"
                    }}
                    placeholder="zs1..."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <button 
                      onClick={() => setAddressVisible(!addressVisible)}
                      className="p-1 rounded-full"
                      style={{ color: "var(--color-foreground-alt)" }}
                      title={addressVisible ? "Hide Address" : "Show Address"}
                    >
                      {addressVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    <button 
                      onClick={copyAddress}
                      className="p-1 rounded-full"
                      style={{ color: "var(--color-accent)" }}
                      title="Copy to clipboard (will be cleared after 60 seconds)"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                  All payments will be sent directly to this shielded address. Keep this address private for security.
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Notification Preferences</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="h-5 w-5 rounded focus:ring-2"
                  style={{ 
                    accentColor: "var(--color-accent)",
                    borderColor: "var(--color-border)" 
                  }}
                />
                <label htmlFor="notifications" className="ml-3" style={{ color: "var(--color-foreground)" }}>
                  Email me when payments are received
                </label>
              </div>
            </div>
            
            {saveSettingsMessage && (
              <div className={`p-4 rounded-lg ${saveSettingsSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-start">
                  {saveSettingsSuccess ? (
                    <CheckIcon className="h-5 w-5 mr-2 mt-0.5" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2 mt-0.5">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p>{saveSettingsMessage}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={updateUserSettings.isPending}
                className="px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                style={{ 
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-primary-foreground)"
                }}
              >
                {updateUserSettings.isPending ? (
                  <>
                    <ArrowPathIcon className="inline h-5 w-5 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Start Stripe subscription
  const handleStripeSubscription = async () => {
    setSubscriptionLoading(true);
    setSubscriptionError(null);
    try {
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: true, priceId: STRIPE_SUBSCRIPTION_PRICE_ID }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) throw new Error(data.error || 'Failed to create Stripe session');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err: any) {
      setSubscriptionError(err.message || 'Subscription failed');
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Check for payment success in URL (for Stripe redirect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') setPaymentSuccess(true);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Account | ZVault Automation</title>
        <meta name="description" content="Manage your ZVault plan and downloads." />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}>
        <div className="container mx-auto px-6 pt-28 pb-12 max-w-3xl">
          <motion.div className="mb-12" initial="initial" animate="animate" variants={staggerContainer}>
            <motion.h1 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--color-foreground)" }} variants={fadeInUp}>
              Your Plan
            </motion.h1>
            <motion.p className="mt-2 text-lg" style={{ color: "var(--color-foreground-alt)" }} variants={fadeInUp}>
              View and manage your ZVault subscription.
            </motion.p>
          </motion.div>

          {/* Plans Section */}
          <section className="mb-8 rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-foreground)" }}>ZVault API Access</h2>
            <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
              {paymentSuccess ? 'You have purchased API access.' : 'Pay £500 to unlock your API key and downloads.'}
            </p>
            {/* Subscription Button */}
            {!paymentSuccess && (
              <button
                onClick={handleStripeSubscription}
                disabled={subscriptionLoading}
                className="px-6 py-3 rounded-lg transition-colors disabled:opacity-50 mr-4"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
              >
                {subscriptionLoading ? 'Subscribing...' : 'Subscribe with Stripe'}
              </button>
            )}
            {subscriptionError && <div className="mt-2 text-red-600">{subscriptionError}</div>}
            {/* One-time payment Button */}
            {!paymentSuccess && (
              <button
                onClick={() => {
                  window.location.href = '/api/create-stripe-session';
                }}
                disabled={paymentLoading}
                className="px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
              >
                {paymentLoading ? 'Processing...' : 'Pay £500 with Stripe'}
              </button>
            )}
            {/* Manage Subscription Button (shown after paymentSuccess) */}
            {paymentSuccess && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/api/stripe-portal'}
                  className="px-6 py-3 rounded-lg transition-colors"
                  style={{ backgroundColor: "var(--color-surface)", color: "var(--color-foreground)", border: '1px solid var(--color-border)' }}
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </section>

          {/* Downloads Section (gated) */}
          {paymentSuccess && (
            <motion.section className="py-12" initial="initial" animate="animate" variants={staggerContainer}>
              <div className="max-w-2xl mx-auto text-center">
                {/* API Key Display */}
                {Array.isArray(apiKeysQuery.data) && apiKeysQuery.data && apiKeysQuery.data.length > 0 && apiKeysQuery.data[0] && apiKeysQuery.data[0].key && (
                  <div className="mb-10 flex flex-col items-center">
                    <div className="w-full max-w-md bg-surface-alt border border-border rounded-xl shadow-md px-8 py-6 flex flex-col items-center">
                      <h3 className="text-xl font-bold mb-4 text-accent tracking-tight">Your API Key</h3>
                      <div className="w-full flex items-center gap-3 mb-2">
                        <div className="flex-1 bg-surface rounded-lg px-4 py-3 font-mono text-base text-accent break-all select-all border border-border-accent shadow-inner-accent">
                          {apiKeysQuery.data[0].key}
                        </div>
                        <button
                          onClick={() => copyApiKey(apiKeysQuery.data[0]?.key ?? "")}
                          className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${apiKeyCopied ? 'bg-accent text-accent-foreground border-border-accent' : 'bg-surface-alt text-accent border-border hover:bg-accent/10'}`}
                          style={{ minWidth: '90px' }}
                          title="Copy API Key"
                          disabled={!apiKeysQuery.data[0]?.key}
                        >
                          {apiKeyCopied ? (
                            <>
                              <CheckIcon className="h-5 w-5 mr-1" />Copied!
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="5" y="6" width="14" height="16" rx="2"/></svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-foreground-alt text-center leading-relaxed">
                        Store this key securely. You won't be able to see it again.<br />
                        <span className="text-warning font-medium">Do not share this key with anyone.</span>
                      </p>
                    </div>
                  </div>
                )}
                <span className="inline-block px-4 py-1.5 mb-4 text-sm font-semibold rounded-full bg-[rgba(212,175,55,0.15)] text-[var(--color-accent)]">Direct Download</span>
                <h2 className="mb-6 text-3xl font-bold text-[var(--color-foreground)] md:text-4xl lg:text-5xl">ZVault Setup Files</h2>
                <p className="mb-8 text-lg text-[var(--color-foreground-alt)]">
                  Click the button below to download the latest ZVault setup package. If you need help, see the documentation or contact support.
                </p>
                <a
                  href="/setup.zip"
                  download
                  className="inline-flex items-center rounded-lg px-8 py-4 text-lg font-semibold transition duration-300 shadow-lg border border-[var(--color-border)] hover:shadow-xl hover:border-[var(--color-accent)]"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-foreground)" }}
                >
                  <svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6-6m6 6 6-6" /></svg>
                  Download Setup Zip
                </a>
                <div className="mt-6 flex justify-center gap-4">
                  <a href="/docs" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-[rgba(10,25,48,0.05)]" style={{ borderColor: "var(--color-border-light)", color: "var(--color-foreground-dark)" }}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5M19.5 12A7.5 7.5 0 1112 4.5a7.5 7.5 0 017.5 7.5z" /></svg>
                    Read Documentation
                  </a>
                  <a href="/contact" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-[rgba(10,25,48,0.05)]" style={{ borderColor: "var(--color-border-light)", color: "var(--color-foreground-dark)" }}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" /></svg>
                    Contact Support
                  </a>
                </div>
                <p className="mt-8 text-sm text-[var(--color-foreground-alt)]">
                  <strong>Note:</strong> If the download does not start, please ensure the file <code>setup.zip</code> is present in the <code>/public</code> directory.
                </p>
              </div>
            </motion.section>
          )}
        </div>
      </main>
    </>
  );
}