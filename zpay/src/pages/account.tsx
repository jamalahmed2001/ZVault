import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { motion } from "framer-motion";
import { 
  ArrowPathIcon, 
  CheckIcon, 
  KeyIcon, 
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';



import { api } from "@/utils/api";
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
  
  // API key state
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  
  // Stripe payment state
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessUrl, setPaymentSuccessUrl] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Stripe subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  // Custom package generation state
  const [targetServerIp, setTargetServerIp] = useState("");
  const [isCompilingPackage, setIsCompilingPackage] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{ link?: string; error?: string } | null>(null);
  
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
  const STRIPE_SUBSCRIPTION_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_PRICE_ID || 'price_1RKiebEln2I26eQPnZ9Q75em';

  const userProfile = api.auth.getUserProfile.useQuery(undefined, {
    refetchOnWindowFocus: false,

  });

  const { data: subscriptionStatus, isLoading: subscriptionStatusLoading } = api.auth.checkStripeSubscriptionActive.useQuery(undefined, { refetchOnWindowFocus: false });
  const paymentSuccess = paymentSuccessUrl || !!(subscriptionStatus && subscriptionStatus.active);
  const apiKeysQuery = api.auth.getApiKeys.useQuery(undefined, { enabled: paymentSuccess });

  const copyApiKey = (apiKey: string) => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
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

  const handleGenerateCustomPackage = async () => {
    if (!targetServerIp) {
      setCompilationResult({ error: "Please enter the target server IP address." });
      return;
    }
    if (!apiKeysQuery.data?.[0]?.key) {
      setCompilationResult({ error: "API Key not available. Cannot generate package." });
      return;
    }

    setIsCompilingPackage(true);
    setCompilationResult(null);

    try {
      // Hypothetical API endpoint
      const response = await fetch('/api/generate-custom-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeysQuery.data[0].key,
          targetServerIp: targetServerIp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate package. Please try again.');
      }

      setCompilationResult({ link: result.downloadLink }); 
    } catch (err: any) {
      setCompilationResult({ error: err.message || 'An unknown error occurred during package generation.' });
    } finally {
      setIsCompilingPackage(false);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ArrowPathIcon className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{paymentSuccess ? "Account Dashboard" : "Unlock ZVault Pro"} | ZVault Self-Hosted</title>
        <meta name="description" content="Manage your ZVault Pro subscription, API keys, software downloads, and profile settings for self-hosted shielded Zcash payments." />
      </Head>

      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 max-w-4xl">
          <motion.div 
            className="mb-10 text-center sm:text-left" 
            initial="initial" 
            animate="animate" 
            variants={staggerContainer}
          >
            <motion.h1 className="text-3xl sm:text-4xl font-bold text-foreground" variants={fadeInUp}>
              {paymentSuccess ? "Account Dashboard" : "Unlock ZVault Pro"}
            </motion.h1>
            <motion.p className="mt-2 text-lg text-foreground-alt" variants={fadeInUp}>
              {paymentSuccess 
                ? "Manage your subscription, API key, software, and profile settings."
                : "Subscribe to ZVault Pro to access your API key, software downloads, and premium features."
              }
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
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 flex items-center">
                      <CreditCardIcon className="h-7 w-7 mr-3 text-accent" />
                      Subscription Status
                    </h2>
                    <p className="text-foreground-alt ml-10 sm:ml-0">
                      Plan: <span className="font-semibold text-accent">ZVault Pro</span> <span className="text-success">(Active)</span>
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/api/stripe-portal'}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg transition-colors bg-primary text-primary-foreground hover:bg-hover-primary text-base font-semibold whitespace-nowrap shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
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
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 text-center flex items-center justify-center">
                      <KeyIcon className="h-7 w-7 mr-3 text-accent" /> 
                      Your API Key
                    </h2>
                    <div className="w-full max-w-lg mx-auto bg-surface-alt border border-border-accent rounded-lg shadow-inner-accent p-4 md:p-6 flex flex-col items-center">
                      <div className="w-full flex items-center gap-3 mb-3">
                        <div className="flex-1 bg-background rounded-md px-4 py-3 font-mono text-sm md:text-base text-accent break-all select-all border border-border shadow-sm">
                          {apiKeysQuery.data[0].key}
                        </div>
                        <button
                          onClick={() => copyApiKey(apiKeysQuery.data[0]?.key ?? "")}
                          className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-md border text-sm md:text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${apiKeyCopied ? 'bg-accent text-accent-foreground border-accent' : 'bg-primary text-primary-foreground border-primary hover:bg-hover-primary'}`}
                          style={{ minWidth: '120px' }}
                          title="Copy API Key"
                          disabled={!apiKeysQuery.data[0]?.key || apiKeyCopied}
                        >
                          {apiKeyCopied ? (
                            <>
                              <CheckIcon className="h-5 w-5" />Copied!
                            </>
                          ) : (
                            <>
                              <CreditCardIcon className="h-5 w-5" />
                              Copy Key
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-xs md:text-sm text-foreground-alt text-center leading-relaxed">
                        <span className="font-semibold text-warning">Important:</span> Store this key securely. 
                        <br />
                        This key grants access to your ZVault automation. <span className="text-warning font-medium">Do not share it.</span>
                      </p>
                    </div>
                 </motion.section>
              )}
               {apiKeysQuery.data && Array.isArray(apiKeysQuery.data) && apiKeysQuery.data.length === 0 && !apiKeysQuery.isLoading && (
                 <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 flex items-center justify-center">
                      <KeyIcon className="h-7 w-7 mr-3 text-accent" /> 
                      API Key
                    </h2>
                    <p className="text-foreground-alt">No API key found. This is unusual for an active subscription. Please contact support if you believe this is an error.</p>
                 </motion.section>
               )}

              {/* Software Download Section - Modified for Custom Package Generation */}
              <motion.section variants={fadeInUp} className="bg-surface border border-border rounded-xl shadow-lg p-6 md:p-8 text-center">
                 <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center justify-center">
                    <CubeTransparentIcon className="h-7 w-7 mr-3 text-accent" />
                    Custom ZVault Package
                  </h2>
                 <p className="mb-4 text-base md:text-lg text-foreground-alt max-w-lg mx-auto">
                  Generate a custom ZVault AutoShield package pre-configured for your deployment. Enter your server's public IP address below.
                  The package will be configured with your current API key and Zcash payout address from your profile settings.
                </p>
                
                <div className="max-w-md mx-auto mb-6">
                  <label htmlFor="targetServerIp" className="block text-sm font-medium text-foreground-alt mb-1.5 text-left">
                    Target Server Public IP Address:
                  </label>
                  <input
                    type="text"
                    id="targetServerIp"
                    value={targetServerIp}
                    onChange={(e) => setTargetServerIp(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-surface-alt border border-border text-foreground placeholder-foreground-alt shadow-sm"
                    placeholder="e.g., 203.0.113.45"
                    disabled={isCompilingPackage}
                  />
                </div>

                <button
                  onClick={handleGenerateCustomPackage}
                  disabled={isCompilingPackage || !targetServerIp || !apiKeysQuery.data?.[0]?.key}
                  className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-lg font-semibold transition duration-300 shadow-lg hover:shadow-xl bg-accent text-accent-foreground hover:bg-hover-primary border border-accent disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCompilingPackage ? (
                    <>
                      <ArrowPathIcon className="h-6 w-6 mr-3 animate-spin" />
                      Generating Package...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-6 w-6 mr-3" />
                      Generate & Download Package
                    </>
                  )}
                </button>

                {compilationResult && compilationResult.link && (
                  <motion.div 
                    variants={fadeInUp}
                    className="mt-6 p-4 bg-success/10 border border-success/30 rounded-lg max-w-md mx-auto">
                    <p className="text-success font-semibold mb-2">Package Generated Successfully!</p>
                    <a 
                      href={compilationResult.link} 
                      className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-semibold bg-success text-success-foreground hover:bg-success/80 transition-colors shadow-md"
                      download // Suggests a download, actual filename depends on backend response
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download Your Custom Package
                    </a>
                  </motion.div>
                )}
                {compilationResult && compilationResult.error && (
                  <motion.div 
                    variants={fadeInUp}
                    className="mt-6 p-4 bg-error/10 border border-error/30 rounded-lg text-error font-medium max-w-md mx-auto">
                    Error: {compilationResult.error}
                  </motion.div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <a href="/docs" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-surface-alt border-border text-foreground-alt hover:text-foreground hover:border-border-accent">
                    <BookOpenIcon className="h-5 w-5 mr-2" />
                    Documentation
                  </a>
                  <a href="/contact" className="inline-flex items-center rounded-lg border px-6 py-3 text-base font-medium transition duration-300 hover:bg-surface-alt border-border text-foreground-alt hover:text-foreground hover:border-border-accent">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Contact Support
                  </a>
                </div>
              </motion.section>

            </motion.div>
          ) : (
            <motion.section 
              variants={fadeInUp} 
              initial="initial" 
              animate="animate"
              className="mb-8 rounded-xl shadow-xl bg-surface border border-border p-6 md:p-10 text-center"
            >
              <KeyIcon className="h-16 w-16 text-accent mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">Unlock Full Access to ZVault Pro</h2>
              <p className="mb-8 text-lg text-foreground-alt max-w-md mx-auto">
                Subscribe to ZVault Pro for just £500/month to receive your API key, access direct software downloads, and benefit from premium support and features.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                  onClick={handleStripeSubscription}
                  disabled={subscriptionLoading || paymentLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-60 bg-primary text-primary-foreground hover:bg-hover-primary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {subscriptionLoading ? (
                     <> <ArrowPathIcon className="inline h-5 w-5 animate-spin" />Subscribing...</>
                  ) : (
                    <><CreditCardIcon className="h-6 w-6"/> Subscribe Now (£500/month)</>
                  )}
                </button>
              </div>
              {subscriptionError && <div className="mt-4 text-error text-sm">{subscriptionError}</div>}
              {paymentError && <div className="mt-4 text-error text-sm">{paymentError}</div>}
              <p className="mt-8 text-sm text-foreground-alt">
                Secure payments via Stripe. Manage your subscription anytime through your dashboard.
              </p>
            </motion.section>
          )}
        </div>
      </main>
    </>
  );
}