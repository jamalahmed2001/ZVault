import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { motion } from "framer-motion";
import { ArrowPathIcon, CheckIcon, KeyIcon, GlobeAltIcon, UserCircleIcon, CogIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import ApiKeyManager from "@/components/ApiKeyManager";
import WebhookManager from "@/components/WebhookManager";
import TransactionLog from "@/components/TransactionLog";
import { api } from "@/utils/api";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/api/root";

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
  const [zecAddress, setZecAddress] = useState("zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly");
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState<boolean | null>(null);
  const [saveSettingsMessage, setSaveSettingsMessage] = useState<string | null>(null);
  
  // API key state
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  
  // Fetch user profile data
  const userProfile = api.auth.getUserProfile.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

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

  // Set initial values from fetched data
  useEffect(() => {
    if (userProfile.data) {
      if (userProfile.data.zcashAddress) {
        setZecAddress(userProfile.data.zcashAddress);
      }
    }
  }, [userProfile.data]);

  // Update API key when selected
  const handleApiKeySelect = (apiKey: string) => {
    setSelectedApiKey(apiKey);
  };

  // Test webhook
  const testWebhook = async () => {
    setTestWebhookLoading(true);
    setTestWebhookResult(null);
    
    // Create payload with invoice and user IDs in the format required by the API
    const payload = {
      json: {
        invoiceId: Number(invoiceId),
        userId: Number(userId),
        api_key: selectedApiKey  // Include the API key in the payload
      }
    };
    
    try {
      // Get webhook URL from the database using the API
      const webhookConfig = await utils.auth.getWebhookConfig.fetch();
      
      if (!webhookConfig) {
        setTestWebhookResult({
          success: false,
          message: "No webhook configuration found. Please save your webhook settings first.",
        });
        setTestWebhookLoading(false);
        return;
      }
      
      // Send the actual fetch request to the webhook URL
      const response = await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
          'Authorization': `Bearer ${selectedApiKey}`  // Add API key in Authorization header
        },
        body: JSON.stringify(payload)
      });
      
      // Get response data
      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Create response data object
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
        headers: Object.fromEntries([...response.headers.entries()]),
        request: {
          api_key: selectedApiKey
        }
      };
      
      // Determine if the request was successful (2xx status code)
      const success = response.ok;
      
      setTestWebhookResult({
        success: success,
        message: success 
          ? `Webhook test successful! Your endpoint responded with a ${responseData.status} ${responseData.statusText} status.`
          : `Webhook test failed. Your endpoint returned a ${responseData.status} error.`,
        payload: payload,
        response: responseData
      });
    } catch (error) {
      setTestWebhookResult({
        success: false,
        message: "Failed to send webhook: Network error or invalid URL",
        payload: payload,
        response: {
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    } finally {
      setTestWebhookLoading(false);
    }
  };

  // Save user settings
  const saveSettings = () => {
    updateUserSettings.mutate({
      zcashAddress: zecAddress,
      notificationsEnabled,
    });
  };

  return (
    <>
      <Head>
        <title>Account Settings | ZVault ZPay</title>
        <meta name="description" content="Manage your ZPay account settings, API keys, and webhook integrations." />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}>
        <div className="container mx-auto px-6 py-12">
          <motion.div 
            className="mb-12"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-3xl font-bold md:text-4xl"
              style={{ color: "var(--color-foreground)" }}
              variants={fadeInUp}
            >
              Account Settings
            </motion.h1>
            <motion.p 
              className="mt-2 text-lg"
              style={{ color: "var(--color-foreground-alt)" }}
              variants={fadeInUp}
            >
              Manage your ZPay account, API keys, and integration settings
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Sidebar Navigation */}
            <div className="md:col-span-1">
              <div className="sticky top-6 rounded-xl shadow-lg p-6" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
                <div className="flex items-center space-x-3 mb-8 pb-4" style={{ borderBottomColor: "var(--color-border)", borderBottomWidth: "1px" }}>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--dark-navy-blue)", opacity: 0.3 }}>
                    <UserCircleIcon className="h-8 w-8" style={{ color: "var(--color-foreground)" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{session?.user?.name || "Account Owner"}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>{session?.user?.email || "user@example.com"}</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <a href="#api-keys" className="flex items-center px-4 py-3 rounded-lg font-medium" style={{ 
                    backgroundColor: "var(--color-primary)", 
                    color: "var(--color-primary-foreground)" 
                  }}>
                    <KeyIcon className="h-5 w-5 mr-3" />
                    API Keys
                  </a>
                  <a href="#webhooks" className="flex items-center px-4 py-3 rounded-lg" style={{ color: "var(--color-foreground)" }}>
                    <GlobeAltIcon className="h-5 w-5 mr-3" />
                    Webhooks
                  </a>
                  <a href="#transactions" className="flex items-center px-4 py-3 rounded-lg" style={{ color: "var(--color-foreground)" }}>
                    <CurrencyDollarIcon className="h-5 w-5 mr-3" />
                    Transactions
                  </a>
                  <a href="#profile" className="flex items-center px-4 py-3 rounded-lg" style={{ color: "var(--color-foreground)" }}>
                    <CogIcon className="h-5 w-5 mr-3" />
                    Settings
                  </a>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-10">
              {/* API Keys Section */}
              <section id="api-keys">
                <ApiKeyManager initialApiKey="" onApiKeySelect={handleApiKeySelect} />
              </section>
              
              {/* Webhooks Section */}
              <section id="webhooks">
                <WebhookManager 
                  initialApiKey={selectedApiKey}
                  onWebhookSelect={(url, secret) => {
                    // Handle selected webhook if needed
                  }} 
                />
              </section>

              {/* Transactions Section */}
              <section id="transactions">
                <TransactionLog initialApiKey={selectedApiKey} />
              </section>
              
              {/* Profile Settings Section */}
              <section id="profile" className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
                <div className="flex items-center mb-6">
                  <CogIcon className="h-8 w-8 mr-4" style={{ color: "var(--color-accent)" }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>Account Settings</h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Payout Settings</h3>
                    <div>
                      <label htmlFor="zecAddress" className="block mb-2" style={{ color: "var(--color-foreground)" }}>
                        Zcash Shielded Address (zs...)
                      </label>
                      <input
                        type="text"
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
                      <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                        All payments will be sent directly to this shielded address.
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
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}