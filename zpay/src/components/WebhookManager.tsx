import { useState, useEffect, useRef } from "react";
import { ClipboardIcon, ArrowPathIcon, CheckIcon, GlobeAltIcon, BellAlertIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
  const [secretVisible, setSecretVisible] = useState(false);
  const clearClipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [secretStrength, setSecretStrength] = useState<'weak' | 'medium' | 'strong'>('medium');
  
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

  // Evaluate webhook secret strength
  useEffect(() => {
    if (!webhookSecret || webhookSecret.length < 20) {
      setSecretStrength('weak');
    } else if (webhookSecret.length < 40) {
      setSecretStrength('medium');
    } else {
      setSecretStrength('strong');
    }
  }, [webhookSecret]);

  // Copy webhook secret to clipboard securely and clear after use
  const copyWebhookSecret = () => {
    // Copy to clipboard
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    
    // Clear timeout if it exists
    if (clearClipboardTimeoutRef.current) {
      clearTimeout(clearClipboardTimeoutRef.current);
    }
    
    // Set visual indication timeout
    setTimeout(() => setCopied(false), 2000);
    
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
  
  // Generate new webhook secret
  const generateSecret = () => {
    setIsGenerating(true);
    generateSecretMutation.mutate();
  };
  
  // Save webhook configuration with validation
  const saveWebhookConfig = () => {
    // Validate webhook URL
    if (!webhookUrl) {
      setSaveSuccess(false);
      setSaveMessage("Webhook URL is required");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
      return;
    }
    
    // Validate webhook URL format
    try {
      new URL(webhookUrl);
    } catch (e) {
      setSaveSuccess(false);
      setSaveMessage("Invalid webhook URL format");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
      return;
    }
    
    // Validate webhook secret
    if (!webhookSecret || webhookSecret.length < 20) {
      setSaveSuccess(false);
      setSaveMessage("Webhook secret must be at least 20 characters long");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 3000);
      return;
    }
    
    // Prefer HTTPS for production
    if (webhookUrl.startsWith('http:') && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
      setSaveSuccess(false);
      setSaveMessage("Warning: Using HTTP for webhooks is not secure. Please use HTTPS for production environments.");
      setTimeout(() => {
        setSaveSuccess(null);
        setSaveMessage(null);
      }, 5000);
      // Continue saving despite the warning
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
      
      <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: "rgba(7, 18, 36, 0.4)", borderColor: "var(--color-accent)", borderWidth: "1px" }}>
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 mr-2 mt-0.5" style={{ color: "var(--color-accent)" }} />
          <div>
            <p className="font-medium" style={{ color: "var(--color-foreground)" }}>Security Best Practices</p>
            <ul className="mt-2 text-sm list-disc pl-5" style={{ color: "var(--color-foreground-alt)" }}>
              <li>Always use HTTPS for production webhook endpoints</li>
              <li>Keep your webhook secret private and secure</li>
              <li>Validate webhook signatures on your server to prevent spoofing attacks</li>
              <li>Implement timeout handling for webhook requests</li>
              <li>Set up proper error logging for webhook failures</li>
            </ul>
          </div>
        </div>
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
              type={secretVisible ? "text" : "password"}
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
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
              <button 
                onClick={() => setSecretVisible(!secretVisible)}
                className="p-1 rounded-full"
                style={{ color: "var(--color-foreground-alt)" }}
                title={secretVisible ? "Hide Secret" : "Show Secret"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  {secretVisible ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  )}
                </svg>
              </button>
              <button 
                onClick={copyWebhookSecret}
                className="p-1 rounded-full"
                style={{ color: "var(--color-accent)" }}
                title="Copy to clipboard (will be cleared after 60 seconds)"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClipboardIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          {/* Secret strength indicator */}
          <div className="mt-2 flex items-center">
            <div className="flex-1 h-1 mr-2 rounded-full overflow-hidden bg-gray-300">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: secretStrength === 'weak' ? '33%' : secretStrength === 'medium' ? '66%' : '100%',
                  backgroundColor: secretStrength === 'weak' ? 'var(--color-error)' : 
                                  secretStrength === 'medium' ? 'var(--color-warning)' : 
                                  'var(--color-success)'
                }}
              ></div>
            </div>
            <span className="text-xs" style={{ 
              color: secretStrength === 'weak' ? 'var(--color-error)' : 
                    secretStrength === 'medium' ? 'var(--color-warning)' : 
                    'var(--color-success)' 
            }}>
              {secretStrength === 'weak' ? 'Weak' : secretStrength === 'medium' ? 'Medium' : 'Strong'}
            </span>
          </div>
          
          <div className="mt-3 p-3 rounded-lg border border-dashed" style={{ 
            backgroundColor: "rgba(190, 164, 114, 0.1)", 
            borderColor: "var(--color-accent)"
          }}>
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                className="w-5 h-5 mr-2 mt-0.5" style={{ color: "var(--color-accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="font-medium" style={{ color: "var(--color-foreground)" }}>
                  Coming Soon
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-foreground-alt)" }}>
                  Webhook secret validation is not currently in use but will be implemented soon. Generate and save your secret now to be ready when this feature is activated.
                </p>
              </div>
            </div>
          </div>
          
          <p className="mt-2 text-xs" style={{ color: "var(--color-foreground-alt)" }}>
            This secure secret is used to verify that webhook events came from ZPay. Keep it confidential and use it to validate webhook signatures.
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