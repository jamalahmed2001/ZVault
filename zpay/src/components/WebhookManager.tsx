import { useState, useEffect } from "react";
import { ClipboardIcon, ArrowPathIcon, CheckIcon, GlobeAltIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";

interface WebhookManagerProps {
  initialWebhookUrl?: string;
  initialWebhookSecret?: string;
  initialApiKey?: string;
  onWebhookSelect?: (url: string, secret: string) => void;
}

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  name?: string;
}

export default function WebhookManager({ initialWebhookUrl, initialWebhookSecret, initialApiKey, onWebhookSelect }: WebhookManagerProps) {
  const { data: session } = useSession();
  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl || "");
  const [webhookSecret, setWebhookSecret] = useState(initialWebhookSecret || "");
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [activeWebhookId, setActiveWebhookId] = useState<string | null>(null);
  const [webhookName, setWebhookName] = useState<string>("Default Webhook");
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [copied, setCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
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

  // TRPC mutations and queries
  const saveWebhookMutation = api.auth.saveWebhookConfig.useMutation({
    onSuccess: (data) => {
      setWebhookConfig(data.webhookConfig);
      setWebhookUrl(data.webhookConfig.url);
      setWebhookSecret(data.webhookConfig.secret);
      setActiveWebhookId(data.webhookConfig.id);
      setSaveSuccess(true);
      setSaveMessage("Webhook configuration saved successfully!");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
      fetchWebhookConfigs.refetch();
    },
    onError: (error) => {
      setSaveSuccess(false);
      setSaveMessage(`Error: ${error.message}`);
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
    }
  });
  
  const generateSecretMutation = api.auth.generateWebhookSecret.useMutation({
    onSuccess: (data) => {
      setWebhookSecret(data.secret);
      setIsGenerating(false);
    },
    onError: (error) => {
      setIsGenerating(false);
      setSaveSuccess(false);
      setSaveMessage(`Error generating secret: ${error.message}`);
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
    }
  });
  
  const fetchWebhookConfig = api.auth.getWebhookConfig.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const fetchWebhookConfigs = api.auth.getWebhookConfig.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Handle webhook config data changes with useEffect
  useEffect(() => {
    const data = fetchWebhookConfig.data;
    if (data) {
      setWebhookConfig(data);
      setWebhookUrl(data.url);
      setWebhookSecret(data.secret);
      setActiveWebhookId(data.id);
    }
  }, [fetchWebhookConfig.data]);

  useEffect(() => {
    if (fetchWebhookConfigs.data) {
      // If we have webhook config data, put it in an array to display
      const configArray = [fetchWebhookConfigs.data];
      setWebhookConfigs(configArray);
      
      if (!activeWebhookId) {
        setActiveWebhookId(fetchWebhookConfigs.data.id);
        setWebhookUrl(fetchWebhookConfigs.data.url);
        setWebhookSecret(fetchWebhookConfigs.data.secret);
        setWebhookName("Default Webhook");
        if (onWebhookSelect) onWebhookSelect(fetchWebhookConfigs.data.url, fetchWebhookConfigs.data.secret);
      }
    }
  }, [fetchWebhookConfigs.data, activeWebhookId, onWebhookSelect]);

  // Update API key when prop changes
  useEffect(() => {
    if (initialApiKey) {
      setApiKey(initialApiKey);
    }
  }, [initialApiKey]);

  // Copy webhook secret to clipboard
  const copyWebhookSecret = () => {
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Generate new webhook secret
  const generateSecret = () => {
    setIsGenerating(true);
    generateSecretMutation.mutate();
  };
  
  // Save webhook configuration
  const saveWebhookConfig = () => {
    if (!webhookUrl) {
      setSaveSuccess(false);
      setSaveMessage("Webhook URL is required");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
      return;
    }
    
    saveWebhookMutation.mutate({
      url: webhookUrl,
      secret: webhookSecret
    });
  };

  // Select webhook config
  const selectWebhookConfig = (webhook: WebhookConfig) => {
    setActiveWebhookId(webhook.id);
    setWebhookUrl(webhook.url);
    setWebhookSecret(webhook.secret);
    setWebhookName(webhook.name || "Default Webhook");
    if (onWebhookSelect) onWebhookSelect(webhook.url, webhook.secret);
  };

  // Delete webhook config
  const deleteWebhookConfig = (id: string) => {
    if (confirm("Are you sure you want to delete this webhook configuration? This action cannot be undone.")) {
      // Add delete mutation here once implemented
      // deleteWebhookMutation.mutate({ id });
      
      // If we're deleting the active webhook, reset the state
      if (id === activeWebhookId) {
        setActiveWebhookId(null);
        setWebhookUrl("");
        setWebhookSecret("");
        if (onWebhookSelect) onWebhookSelect("", "");
      }
    }
  };

  // Test webhook
  const testWebhook = async () => {
    setTestWebhookLoading(true);
    setTestWebhookResult(null);
    
    try {
      if (!webhookUrl) {
        setTestWebhookResult({
          success: false,
          message: "No webhook URL specified. Please enter a webhook URL first.",
        });
        setTestWebhookLoading(false);
        return;
      }
      
      // Format payload to match the required format
      const payload = {
        json: {
          invoiceId: Number(invoiceId),
          userId: Number(userId)
        }
      };
      
      // Generate the curl command for the user to run
      const curlCommand = `curl -s -o /dev/null -w "%{http_code}" \\
    -X POST "${webhookUrl}" \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${webhookSecret}" \\
    -d '${JSON.stringify(payload)}'`;
      
      // Set a simulated response to show the curl command to the user
      setTestWebhookResult({
        success: true,
        message: "Here's the curl command to test your webhook. Copy and run it in your terminal.",
        payload: payload,
        response: {
          curl_command: curlCommand,
          notes: "Running this command in your terminal will send a test webhook and return the HTTP status code."
        }
      });
    } catch (error) {
      setTestWebhookResult({
        success: false,
        message: "Failed to prepare webhook test",
        response: {
          error: error instanceof Error ? error.message : "Unknown error",
        }
      });
    } finally {
      setTestWebhookLoading(false);
    }
  };

  // Copy curl command to clipboard
  const copyCurlCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  if (fetchWebhookConfig.isLoading || fetchWebhookConfigs.isLoading) {
    return (
      <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent)" }} />
          <span className="ml-2" style={{ color: "var(--color-foreground-alt)" }}>Loading webhook configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
      <div className="flex items-center mb-6">
        <GlobeAltIcon className="h-8 w-8 mr-4" style={{ color: "var(--color-accent)" }} />
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>Webhook Configuration</h2>
      </div>
      
      <p className="mb-6" style={{ color: "var(--color-foreground-alt)" }}>
        Configure webhook endpoints to receive real-time notifications about payment events. 
        Your server needs to respond with a 2xx status code to acknowledge receipt.
      </p>
      
      {/* Webhook List */}
      {webhookConfigs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Your Webhook Configurations</h3>
          <div className="space-y-4">
            {webhookConfigs.map((webhook) => (
              <div 
                key={webhook.id} 
                className={`p-4 border rounded-lg cursor-pointer`}
                style={{ 
                  backgroundColor: activeWebhookId === webhook.id ? "rgba(190, 164, 114, 0.1)" : "var(--color-surface)",
                  borderColor: activeWebhookId === webhook.id ? "var(--color-accent)" : "var(--color-border)"
                }}
                onClick={() => selectWebhookConfig(webhook)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{webhook.name || "Webhook"}</p>
                    <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Created on {new Date(webhook.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      deleteWebhookConfig(webhook.id);
                    }}
                    className="p-2 rounded-full"
                    style={{ color: "var(--color-error)" }}
                    title="Delete Webhook"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                {activeWebhookId === webhook.id && (
                  <div className="mt-3 font-mono text-sm p-2 rounded-lg overflow-x-auto" 
                    style={{ 
                      backgroundColor: "rgba(49, 55, 69, 0.5)", 
                      borderColor: "var(--color-accent)", 
                      borderWidth: "1px",
                      color: "var(--color-foreground)"
                    }}>
                    {webhook.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Create New Webhook Configuration */}
      <div className="rounded-lg border p-6 mb-8" 
        style={{ 
          backgroundColor: "rgba(7, 18, 36, 0.2)", 
          borderColor: "var(--color-border)" 
        }}>
        <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>
          {webhookConfigs.length ? "Create New Webhook" : "Create Your First Webhook"}
        </h3>
        
        <div className="mb-4">
          <label htmlFor="webhookName" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
            Webhook Name
          </label>
          <input
            type="text"
            id="webhookName"
            value={webhookName}
            onChange={(e) => setWebhookName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--color-surface)", 
              borderColor: "var(--color-border)", 
              borderWidth: "1px",
              color: "var(--color-foreground)"
            }}
            placeholder="My Webhook"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="webhookUrl" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
            Webhook URL
          </label>
          <input
            type="url"
            id="webhookUrl"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none"
            style={{ 
              backgroundColor: "var(--color-surface)", 
              borderColor: "var(--color-border)", 
              borderWidth: "1px",
              color: "var(--color-foreground)"
            }}
            placeholder="https://example.com/api/webhooks/zpay"
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="webhookSecret" className="block text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Webhook Secret
            </label>
            <button
              onClick={generateSecret}
              disabled={isGenerating}
              className="text-sm px-3 py-1 rounded transition-colors"
              style={{ 
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-foreground)",
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="inline h-4 w-4 mr-1 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate New Secret</span>
              )}
            </button>
          </div>
          <div className="relative">
            <input
              type="password"
              id="webhookSecret"
              value={webhookSecret}
              readOnly
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px",
                color: "var(--color-foreground)"
              }}
            />
            <button 
              onClick={copyWebhookSecret}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              style={{ color: "var(--color-accent)" }}
            >
              {copied ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <ClipboardIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-foreground-alt)" }}>
            This secret is used to verify that webhook events came from ZPay.
          </p>
        </div>
        
        {saveMessage && (
          <div className={`p-4 rounded-lg ${saveSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-start">
              {saveSuccess ? (
                <CheckIcon className="h-5 w-5 mr-2 mt-0.5" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2 mt-0.5">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                </svg>
              )}
              <p>{saveMessage}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-4 mt-4">
          <button 
            onClick={saveWebhookConfig}
            disabled={saveWebhookMutation.isPending}
            className="flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)"
            }}
          >
            {saveWebhookMutation.isPending ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Webhook</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Test Webhook Section */}
      <div className="rounded-lg border p-6" 
        style={{ 
          backgroundColor: "rgba(7, 18, 36, 0.2)", 
          borderColor: "var(--color-border)" 
        }}>
        <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Test Your Webhook</h3>
        <p className="text-sm mb-6" style={{ color: "var(--color-foreground-alt)" }}>
          Test your webhook by sending a sample payment notification with the following parameters:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="testInvoiceId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
              Invoice ID (numeric)
            </label>
            <input
              type="number"
              id="testInvoiceId"
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
            <label htmlFor="testUserId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
              User ID (numeric)
            </label>
            <input
              type="number"
              id="testUserId"
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
        
        <div className="mb-6">
          <label htmlFor="webhookUrlTest" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
            Webhook URL
          </label>
          <input
            type="text"
            id="webhookUrlTest"
            value={webhookUrl}
            readOnly
            className="w-full px-4 py-2 rounded-lg focus:outline-none font-mono"
            style={{ 
              backgroundColor: "rgba(49, 55, 69, 0.5)", 
              borderColor: "var(--color-border)", 
              borderWidth: "1px",
              color: "var(--color-foreground)"
            }}
          />
        </div>
        
        <button
          onClick={testWebhook}
          disabled={testWebhookLoading || !webhookUrl || !invoiceId || !userId || !apiKey}
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
              <span>Test Webhook</span>
            </>
          )}
        </button>
        
        {testWebhookResult && (
          <div className="mt-6 space-y-4">
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
            
       
            {/* {testWebhookResult.response && (
              <div className="rounded-lg p-4" style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px"
              }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Response Details</h4>
                <div className="p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "rgba(49, 55, 69, 0.5)" }}>
                  <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                    {JSON.stringify(testWebhookResult.response, null, 2)}
                  </pre>
                </div>
              </div>
            )} */}
            
            {testWebhookResult?.response?.curl_command && (
              <div className="rounded-lg p-4" style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px"
              }}>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium" style={{ color: "var(--color-foreground)" }}>CURL Command</h4>
                  <button 
                    onClick={() => copyCurlCommand(testWebhookResult.response.curl_command)}
                    className="flex items-center px-2 py-1 rounded-lg text-sm"
                    style={{ 
                      backgroundColor: "var(--color-accent)",
                      color: "var(--color-accent-foreground)",
                      opacity: curlCopied ? 0.7 : 1
                    }}
                  >
                    {curlCopied ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4 mr-1" />
                        <span>Copy Command</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "rgba(49, 55, 69, 0.5)" }}>
                  <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--color-foreground)" }}>
                    {testWebhookResult.response.curl_command}
                  </pre>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
                  Run this command in your terminal to test the webhook. It will return the HTTP status code from your server.
                </p>
              </div>

            )}
                 {testWebhookResult.payload && (
              <div className="rounded-lg p-4" style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px"
              }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Request Payload</h4>
                <div className="p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "rgba(49, 55, 69, 0.5)" }}>
                  <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                    {JSON.stringify(testWebhookResult.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            
            {testWebhookResult?.response && !testWebhookResult.response.curl_command && (
              <div className="rounded-lg p-4" style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px"
              }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Response Details</h4>
                <div className="p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "rgba(49, 55, 69, 0.5)" }}>
                  <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                    {JSON.stringify(testWebhookResult.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 