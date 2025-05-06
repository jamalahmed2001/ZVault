import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { motion } from "framer-motion";
import { 
  ArrowPathIcon, 
  CheckIcon, 
  KeyIcon, 
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
  const [zecAddress, setZecAddress] = useState("");
  const [addressVisible, setAddressVisible] = useState(false);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState<boolean | null>(null);
  const [saveSettingsMessage, setSaveSettingsMessage] = useState<string | null>(null);
  const clearClipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API key state
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  
  // Stripe payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessUrl, setPaymentSuccessUrl] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Stripe subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  const STRIPE_SUBSCRIPTION_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1RKiebEln2I26eQPnZ9Q75em';

  const userProfile = api.auth.getUserProfile.useQuery(undefined, {
    refetchOnWindowFocus: false,

  });

  const { data: subscriptionStatus, isLoading: subscriptionStatusLoading } = api.auth.checkStripeSubscriptionActive.useQuery(undefined, { refetchOnWindowFocus: false });
  const paymentSuccess = paymentSuccessUrl || !!(subscriptionStatus && subscriptionStatus.active);
  const apiKeysQuery = api.auth.getApiKeys.useQuery(undefined, { enabled: paymentSuccess });

  const updateUserSettings = api.auth.updateUserSettings.useMutation({
    onSuccess: () => {
      setSaveSettingsSuccess(true);
      setSaveSettingsMessage("Settings saved successfully!");
      setTimeout(() => {
        setSaveSettingsSuccess(null);
        setSaveSettingsMessage(null);
      }, 3000);
      utils.auth.getUserProfile.invalidate();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setSaveSettingsSuccess(false);
      setSaveSettingsMessage(`Error saving settings: ${error.message}`);
      setTimeout(() => {
        setSaveSettingsSuccess(null);
        setSaveSettingsMessage(null);
      }, 5000);
    }
  });

  const copyAddress = () => {
    if (!zecAddress) return;
    navigator.clipboard.writeText(zecAddress);
    if (clearClipboardTimeoutRef.current) {
      clearTimeout(clearClipboardTimeoutRef.current);
    }
    clearClipboardTimeoutRef.current = setTimeout(() => {
      navigator.clipboard.writeText('');
      console.log('Clipboard cleared for security (ZEC Address)');
    }, 60000);
  };
  
  useEffect(() => {
    return () => {
      if (clearClipboardTimeoutRef.current) {
        clearTimeout(clearClipboardTimeoutRef.current);
      }
    };
  }, []);

  const copyApiKey = (apiKey: string) => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const saveSettings = () => {
    updateUserSettings.mutate({
      zcashAddress: zecAddress,
      notificationsEnabled,
    });
  };

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
  
  const handleOneTimePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.sessionId) throw new Error(data.error || 'Failed to create Stripe session for payment');
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        setPaymentSuccessUrl(true);
      }
    }
  }, []);
  
  if (userProfile.isLoading || subscriptionStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-background)" }}>
        <ArrowPathIcon className="h-12 w-12 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{paymentSuccess ? "Account Dashboard" : "Get Plan"} | ZVault Automation</title>
        <meta name="description" content="Manage your ZVault plan, API keys, downloads, and settings." />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}>
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl">
          <motion.div 
            className="mb-10 text-center sm:text-left" 
            initial="initial" 
            animate="animate" 
            variants={staggerContainer}
          >
            <motion.h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--color-foreground)" }} variants={fadeInUp}>
              {paymentSuccess ? "Account Dashboard" : "Unlock ZVault Pro"}
            </motion.h1>
            <motion.p className="mt-2 text-lg" style={{ color: "var(--color-foreground-alt)" }} variants={fadeInUp}>
              {paymentSuccess ? "Manage your subscription, API key, downloads, and personal settings." : "Subscribe to access premium features, API key, and direct downloads."}
            </motion.p>
          </motion.div>

          {paymentSuccess ? (
            <motion.div 
              className="space-y-8"
              variants={staggerContainer} 
              initial="initial" 
              animate="animate"
            >
              <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">Subscription Status</h2>
                    <p className="text-foreground-alt">
                      Plan: <span className="font-semibold text-accent">ZVault Pro</span> <span className="text-green-500">(Active)</span>
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/api/stripe-portal'}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    Manage Subscription
                  </button>
                </div>
              </motion.section>

              {apiKeysQuery.isLoading && (
                <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-accent mx-auto" />
                    <p className="mt-2 text-foreground-alt">Loading API Key...</p>
                </motion.section>
              )}
              {apiKeysQuery.data && Array.isArray(apiKeysQuery.data) && apiKeysQuery.data.length > 0 && apiKeysQuery.data[0]?.key && (
                 <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center">Your API Key</h2>
                    <div className="w-full max-w-lg mx-auto bg-surface-alt border border-border-accent rounded-lg shadow-inner-accent p-4 md:p-6 flex flex-col items-center">
                      <div className="w-full flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-surface rounded-md px-4 py-3 font-mono text-sm md:text-base text-accent break-all select-all border border-border shadow-sm">
                          {apiKeysQuery.data[0].key}
                        </div>
                        <button
                          onClick={() => copyApiKey(apiKeysQuery.data[0]?.key ?? "")}
                          className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-md border text-sm md:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${apiKeyCopied ? 'bg-accent text-accent-foreground border-border-accent' : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'}`}
                          style={{ minWidth: '110px' }}
                          title="Copy API Key"
                          disabled={!apiKeysQuery.data[0]?.key || apiKeyCopied}
                        >
                          {apiKeyCopied ? (
                            <>
                              <CheckIcon className="h-5 w-5" />Copied!
                            </>
                          ) : (
                            <>
                              <KeyIcon className="h-5 w-5" />
                              Copy Key
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-xs md:text-sm text-foreground-alt text-center leading-relaxed">
                        <span className="font-semibold">Important:</span> Store this key securely. You will not be able to see it again after leaving this page.
                        <br />
                        <span className="text-warning font-medium">Do not share this key with anyone.</span>
                      </p>
                    </div>
                 </motion.section>
              )}
               {apiKeysQuery.data && Array.isArray(apiKeysQuery.data) && apiKeysQuery.data.length === 0 && !apiKeysQuery.isLoading && (
                 <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">API Key</h2>
                    <p className="text-foreground-alt">No API key found. Please contact support if you believe this is an error.</p>
                 </motion.section>
               )}

              <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 text-center">
                 <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">ZVault Software</h2>
                 <p className="mb-6 text-base md:text-lg text-foreground-alt max-w-md mx-auto">
                  Download the latest ZVault setup package. For assistance, refer to the documentation or contact our support team.
                </p>
                <a
                  href="/release.zip"
                  download
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-foreground)", border: '1px solid var(--color-accent-dark, var(--color-accent))' }}
                >
                  <svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0-6-6m6 6 6-6" /></svg>
                  Download ZVault (release.zip)
                </a>
                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <a href="/docs" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-surface-alt" style={{ borderColor: "var(--color-border-light)", color: "var(--color-foreground-dark)" }}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5M19.5 12A7.5 7.5 0 1112 4.5a7.5 7.5 0 017.5 7.5z" /></svg>
                    Documentation
                  </a>
                  <a href="/contact" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-surface-alt" style={{ borderColor: "var(--color-border-light)", color: "var(--color-foreground-dark)" }}>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" /></svg>
                    Contact Support
                  </a>
                </div>
                <p className="mt-6 text-xs md:text-sm text-foreground-alt">
                  <strong>Note:</strong> If the download doesn't start, ensure <code>release.zip</code> is in the <code>/public</code> directory.
                </p>
              </motion.section>

              <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8">
                 <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Profile Settings</h2>
                 <div className="space-y-8 max-w-lg mx-auto">
                    <div>
                      <h3 className="font-medium mb-3 text-lg" style={{ color: "var(--color-foreground)" }}>Payout Address</h3>
                      <label htmlFor="zecAddress" className="block mb-1.5 text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>
                        Zcash Shielded Address (zs...)
                      </label>
                      <div className="relative">
                        <input
                          type={addressVisible ? "text" : "password"}
                          id="zecAddress"
                          value={zecAddress}
                          onChange={(e) => setZecAddress(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                          style={{ 
                            backgroundColor: "var(--color-surface-alt, var(--color-surface))", 
                            borderColor: "var(--color-border)", 
                            borderWidth: "1px",
                            color: "var(--color-foreground)"
                          }}
                          placeholder="Enter your Zcash shielded address (zs...)"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                          <button 
                            onClick={() => setAddressVisible(!addressVisible)}
                            className="p-1.5 rounded-full hover:bg-surface-alt focus:outline-none focus:ring-1 focus:ring-accent"
                            style={{ color: "var(--color-foreground-alt)" }}
                            title={addressVisible ? "Hide Address" : "Show Address"}
                          >
                            {addressVisible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                          <button 
                            onClick={copyAddress}
                            className="p-1.5 rounded-full hover:bg-surface-alt focus:outline-none focus:ring-1 focus:ring-accent"
                            style={{ color: "var(--color-accent)" }}
                            title="Copy address (cleared after 60s)"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs" style={{ color: "var(--color-foreground-alt)" }}>
                        Payments are sent here. Keep this address private.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-3 text-lg" style={{ color: "var(--color-foreground)" }}>Notification Preferences</h3>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="notifications"
                          checked={notificationsEnabled}
                          onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                          className="h-5 w-5 rounded focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface"
                          style={{ 
                            accentColor: "var(--color-accent)",
                            borderColor: "var(--color-border)",
                            backgroundColor: "var(--color-surface-alt)",
                          }}
                        />
                        <label htmlFor="notifications" className="ml-3 text-base" style={{ color: "var(--color-foreground)" }}>
                          Email me when payments are received
                        </label>
                      </div>
                    </div>
                    
                    {saveSettingsMessage && (
                      <div className={`p-4 rounded-lg text-sm ${saveSettingsSuccess ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                        <div className="flex items-start">
                          {saveSettingsSuccess ? (
                            <CheckIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.707-4.293a1 1 0 00-1.414-1.414L6.586 10.707l-1.707-1.707a1 1 0 00-1.414 1.414L5.172 12.12l-1.707 1.707a1 1 0 101.414 1.414L8 13.536l1.707 1.707a1 1 0 001.414-1.414L9.414 12.12l1.707-1.707a1 1 0 00-1.414-1.414L8 10.707l-.707.707z" clipRule="evenodd" />
                            </svg>
                          )}
                          <p>{saveSettingsMessage}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={saveSettings}
                        disabled={updateUserSettings.isPending || userProfile.isLoading}
                        className="px-8 py-3 rounded-lg transition-colors disabled:opacity-60 text-base font-semibold shadow-md hover:shadow-lg"
                        style={{ 
                          backgroundColor: "var(--color-primary)",
                          color: "var(--color-primary-foreground)"
                        }}
                      >
                        {updateUserSettings.isPending ? (
                          <>
                            <ArrowPathIcon className="inline h-5 w-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <span>Save Settings</span>
                        )}
                      </button>
                    </div>
                 </div>
              </motion.section>

            </motion.div>
          ) : (
            <section className="mb-8 rounded-xl shadow-xl bg-surface border border-border p-6 md:p-10 text-center">
              <KeyIcon className="h-16 w-16 text-accent mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Unlock Full Access</h2>
              <p className="mb-8 text-lg text-foreground-alt max-w-md mx-auto">
                Subscribe to ZVault Pro for £500 to get your API key, direct software downloads, and premium support.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  onClick={handleStripeSubscription}
                  disabled={subscriptionLoading || paymentLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-60 shadow-md hover:shadow-lg"
                  style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  {subscriptionLoading ? (
                     <> <ArrowPathIcon className="inline h-5 w-5 mr-2 animate-spin" />Subscribing...</>
                  ) : (
                    'Subscribe Now (£500)'
                  )}
                </button>
                <button
                    onClick={handleOneTimePayment}
                    disabled={paymentLoading || subscriptionLoading}
                    className="w-full sm:w-auto px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-60 border border-primary text-primary hover:bg-primary/10 shadow-md hover:shadow-lg"
                  >
                    {paymentLoading ? (
                       <> <ArrowPathIcon className="inline h-5 w-5 mr-2 animate-spin" />Processing...</>
                    ) : (
                      'One-Time Payment'
                    )}
                  </button>
              </div>
              {subscriptionError && <div className="mt-4 text-red-500 text-sm">{subscriptionError}</div>}
              {paymentError && <div className="mt-4 text-red-500 text-sm">{paymentError}</div>}
              <p className="mt-8 text-sm text-foreground-alt">
                Secure payments processed by Stripe. Manage your subscription anytime.
              </p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}