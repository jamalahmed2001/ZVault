import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { motion } from "framer-motion";
import { ClipboardIcon, ArrowPathIcon, CheckIcon, BellAlertIcon, KeyIcon, GlobeAltIcon, UserCircleIcon, CogIcon } from '@heroicons/react/24/outline';
import ApiKeyManager from "@/components/ApiKeyManager";

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
  
  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState("http://192.168.1.229:3000/api/trpc/payment.confirmZcashPayment");
  const [webhookSecret, setWebhookSecret] = useState("whsec_3f8j29vm4l5j6h7g8f9d0");
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
  
  // Test webhook
  const testWebhook = async () => {
    setTestWebhookLoading(true);
    setTestWebhookResult(null);
    
    // Create payload with invoice and user IDs in the format required by the API
    const payload = {
      json: {
        invoiceId: Number(invoiceId),
        userId: Number(userId)
      }
    };
    
    try {
      // Send the actual fetch request to the webhook URL
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json'
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
        headers: Object.fromEntries([...response.headers.entries()])
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

  // Save webhook settings
  const saveWebhookSettings = async () => {
    try {
      // Simulate API call to save webhook settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = {
        status: 200,
        body: {
          success: true,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        }
      };
      
      setTestWebhookResult({
        success: true,
        message: "Webhook settings saved successfully!",
        response: response
      });
    } catch (error) {
      setTestWebhookResult({
        success: false,
        message: "Failed to save webhook settings",
        response: {
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
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
                <ApiKeyManager initialApiKey="zv_test_8f4j2n9v7m3k4l5j6h7g8f9d0s1a2p3o" />
              </section>
              
              {/* Webhooks Section */}
              <section id="webhooks" className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
                <div className="flex items-center mb-6">
                  <GlobeAltIcon className="h-8 w-8 mr-4" style={{ color: "var(--color-accent)" }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>Webhook Configuration</h2>
                </div>
                
                <p className="mb-6" style={{ color: "var(--color-foreground-alt)" }}>
                  Configure webhook endpoints to receive real-time notifications about payment events. 
                  Your server needs to respond with a 2xx status code to acknowledge receipt.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="webhookUrl" className="block font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      id="webhookUrl"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg focus:outline-none"
                      style={{ 
                        backgroundColor: "var(--color-surface)", 
                        borderColor: "var(--color-border)", 
                        borderWidth: "1px",
                        color: "var(--color-foreground)"
                      }}
                      placeholder="https://example.com/api/webhooks/zpay"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="webhookSecret" className="block font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                      Webhook Secret
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="webhookSecret"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none"
                        style={{ 
                          backgroundColor: "var(--color-surface)", 
                          borderColor: "var(--color-border)", 
                          borderWidth: "1px",
                          color: "var(--color-foreground)"
                        }}
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(webhookSecret);
                          alert("Webhook secret copied to clipboard");
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        style={{ color: "var(--color-accent)" }}
                      >
                        <ClipboardIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                      This secret is used to verify that webhook events came from ZPay.
                    </p>
                  </div>
                  
                  <div className="rounded-lg p-6" style={{ backgroundColor: "rgba(7,18,36,0.1)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
                    <h3 className="font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Test Your Webhook</h3>
                    <p className="mb-4" style={{ color: "var(--color-foreground-alt)" }}>
                      Send a test event to the <code>payment.confirmZcashPayment</code> endpoint.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label htmlFor="invoiceId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                          Invoice ID (numeric)
                        </label>
                        <input
                          type="number"
                          id="invoiceId"
                          value={invoiceId}
                          onChange={(e) => setInvoiceId(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{ 
                            backgroundColor: "var(--color-surface)", 
                            borderColor: "var(--color-border)", 
                            borderWidth: "1px",
                            color: "var(--color-foreground)"
                          }}
                          placeholder="477"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="userId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                          User ID (numeric)
                        </label>
                        <input
                          type="number"
                          id="userId"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none"
                          style={{ 
                            backgroundColor: "var(--color-surface)", 
                            borderColor: "var(--color-border)", 
                            borderWidth: "1px",
                            color: "var(--color-foreground)"
                          }}
                          placeholder="1"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={testWebhook}
                      disabled={testWebhookLoading || !webhookUrl || !invoiceId || !userId}
                      className="flex items-center px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        backgroundColor: "var(--color-accent)",
                        color: "var(--color-accent-foreground)"
                      }}
                    >
                      {testWebhookLoading ? (
                        <>
                          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                          <span>Testing...</span>
                        </>
                      ) : (
                        <>
                          <BellAlertIcon className="h-5 w-5 mr-2" />
                          <span>Send Test Webhook</span>
                        </>
                      )}
                    </button>
                    
                    {testWebhookResult && (
                      <div className="mt-4 space-y-4">
                        <div className={`p-4 rounded-lg ${testWebhookResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <div className="flex items-start">
                            {testWebhookResult.success ? (
                              <CheckIcon className="h-5 w-5 mr-2 mt-0.5" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2 mt-0.5">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                              </svg>
                            )}
                            <p>{testWebhookResult.message}</p>
                          </div>
                        </div>
                        
                        {testWebhookResult.payload && (
                          <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Request Payload</h4>
                            <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                              <pre className="text-xs">
                                {JSON.stringify(testWebhookResult.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        
                        {testWebhookResult.response && (
                          <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-800 mb-2">Endpoint Response</h4>
                            <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                              <pre className="text-xs">
                                {JSON.stringify(testWebhookResult.response, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={saveWebhookSettings}
                      className="px-6 py-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-primary-foreground)"
                      }}
                    >
                      Save Webhook Settings
                    </button>
                  </div>
                </div>
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
                  
                  <div className="flex justify-end">
                    <button className="px-6 py-3 rounded-lg transition-colors"
                      style={{ 
                        backgroundColor: "var(--color-primary)",
                        color: "var(--color-primary-foreground)"
                      }}
                    >
                      Save Settings
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