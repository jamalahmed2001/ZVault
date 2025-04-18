import { useState, useEffect, useRef } from "react";
import { ClipboardIcon, ArrowPathIcon, CheckIcon, BeakerIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";
import { Decimal } from "@prisma/client/runtime/library";
interface ApiKeyManagerProps {
  initialApiKey?: string;
  onApiKeySelect?: (apiKey: string) => void;
}

interface ApiKey {
  id: string;
  key: string;
  name?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  transactionFee: Decimal;
}

export default function ApiKeyManager({ initialApiKey, onApiKeySelect }: ApiKeyManagerProps) {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");
  const [apiKeyName, setApiKeyName] = useState<string>("Default API Key");
  const [isLiveKey, setIsLiveKey] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyStrength, setKeyStrength] = useState<'weak' | 'medium' | 'strong'>('medium');
  const clearClipboardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // API test state
  const [userId, setUserId] = useState("1");
  const [invoiceId, setInvoiceId] = useState("477");
  const [amount, setAmount] = useState("10");
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<null | { 
    success: boolean; 
    message: string; 
    response?: any;
  }>(null);

  // TRPC mutations and queries
  const generateApiKeyMutation = api.auth.generateApiKey.useMutation({
    onSuccess: (data) => {
      setApiKey(data.apiKey);
      setActiveKeyId(data.id);
      setIsRegenerating(false);
      if (onApiKeySelect) onApiKeySelect(data.apiKey);
      fetchApiKeys.refetch();
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
      setErrorMessage(null);
    },
    onError: (error) => {
      console.error("Error generating API key:", error);
      setIsRegenerating(false);
      setErrorMessage(error.message || "Failed to generate API key");
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
    }
  });
  
  const deleteApiKeyMutation = api.auth.deleteApiKey.useMutation({
    onSuccess: () => {
      fetchApiKeys.refetch();
    }
  });
  
  const fetchApiKeys = api.auth.getApiKeys.useQuery(undefined, {
    enabled: !!session?.user,
  });

  useEffect(() => {
    if (fetchApiKeys.data) {
      setApiKeys(fetchApiKeys.data);
      if (fetchApiKeys.data.length > 0 && !activeKeyId) {
        setActiveKeyId(fetchApiKeys.data[0]!.id);
        setApiKey(fetchApiKeys.data[0]!.key);
        if (onApiKeySelect) onApiKeySelect(fetchApiKeys.data[0]!.key);
      }
    }
  }, [fetchApiKeys.data, activeKeyId, onApiKeySelect]);

  // Evaluate API key strength
  useEffect(() => {
    if (!apiKey || apiKey.length < 20) {
      setKeyStrength('weak');
    } else if (apiKey.length < 40) {
      setKeyStrength('medium');
    } else {
      setKeyStrength('strong');
    }
  }, [apiKey]);

  // Copy API key to clipboard securely
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
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
  
  // Generate API key with safety timeout
  const regenerateApiKey = () => {
    setIsRegenerating(true);
    setErrorMessage(null);
    
    // Set a safety timeout to reset UI state if the request takes too long
    generationTimeoutRef.current = setTimeout(() => {
      if (isRegenerating) {
        setIsRegenerating(false);
        setErrorMessage("API key generation timed out. Please try again.");
      }
    }, 15000); // 15 seconds timeout
    
    generateApiKeyMutation.mutate({ 
      name: apiKeyName,
      isLiveKey: isLiveKey
    });
  };
  
  // Delete API key
  const deleteApiKey = (id: string) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      deleteApiKeyMutation.mutate({ id });
      
      // If we're deleting the active key, reset the state
      if (id === activeKeyId) {
        setActiveKeyId(null);
        setApiKey("");
        if (onApiKeySelect) onApiKeySelect("");
      }
    }
  };
  
  // Select an API key
  const selectApiKey = (key: ApiKey) => {
    setActiveKeyId(key.id);
    setApiKey(key.key);
    setApiKeyName(key.name || "Default API Key");
    if (onApiKeySelect) onApiKeySelect(key.key);
  };
  
  // Test API
  const testApiKey = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    
    try {
      // Use the API endpoint provided with API key in the request
      const url = `https://www.v3nture.link/create?api_key=${apiKey}&user_id=${userId}&invoice_id=${invoiceId}&amount=${Number(amount) * 100}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
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
          url: url,
          api_key: apiKey
        }
      };
      
      // Determine if the request was successful (2xx status code)
      const success = response.ok;
      
      setTestResult({
        success: success,
        message: success 
          ? `API test successful! The endpoint responded with a ${responseData.status} ${responseData.statusText} status.`
          : `API test failed. The endpoint returned a ${responseData.status} error.`,
        response: responseData
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test API: Network error or invalid URL",
        response: {
          error: error instanceof Error ? error.message : "Unknown error",
          request: {
            api_key: apiKey
          }
        }
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
      if (clearClipboardTimeoutRef.current) {
        clearTimeout(clearClipboardTimeoutRef.current);
      }
    };
  }, []);

  if (fetchApiKeys.isLoading) {
    return (
      <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent)" }} />
          <span className="ml-2" style={{ color: "var(--color-foreground-alt)" }}>Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
      <div className="flex items-center mb-6">
        <ClipboardIcon className="h-8 w-8 mr-4" style={{ color: "var(--color-accent)" }} />
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>API Key Management</h2>
      </div>
      
      <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: "rgba(7, 18, 36, 0.4)", borderColor: "var(--color-accent)", borderWidth: "1px" }}>
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 mr-2 mt-0.5" style={{ color: "var(--color-accent)" }} />
          <div>
            <p className="font-medium" style={{ color: "var(--color-foreground)" }}>API Security Best Practices</p>
            <ul className="mt-2 text-sm list-disc pl-5" style={{ color: "var(--color-foreground-alt)" }}>
              <li>Never expose your API keys in client-side code or public repositories</li>
              <li>Use different API keys for development and production environments</li>
              <li>Set up IP restrictions for your API keys when possible</li>
              <li>Rotate API keys periodically and after team member changes</li>
              <li>Monitor API key usage for unusual patterns</li>
            </ul>
            <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
              <strong>Note:</strong> Both test and live keys process real payments. The difference is that test keys don't 
              verify payment amounts, allowing you to test with smaller payments while maintaining the same workflow.
            </p>
          </div>
        </div>
      </div>
      
      <p className="mb-6" style={{ color: "var(--color-foreground-alt)" }}>
        Your API keys grant access to your ZPay account. Keep them secure and never share them in public repositories or client-side code.
      </p>
      
      {/* API Keys List */}
      {apiKeys.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Your API Keys</h3>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div 
                key={key.id} 
                className={`p-4 border rounded-lg cursor-pointer`}
                style={{ 
                  backgroundColor: activeKeyId === key.id ? "rgba(190, 164, 114, 0.1)" : "var(--color-surface)",
                  borderColor: activeKeyId === key.id ? "var(--color-accent)" : "var(--color-border)"
                }}
                onClick={() => selectApiKey(key)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{key.name || "API Key"}</p>
                      {key.key.startsWith('zv_live_') && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs" 
                          style={{ backgroundColor: "rgba(22, 163, 74, 0.2)", color: "var(--color-success)" }}>
                          LIVE
                        </span>
                      )}
                      {key.key.startsWith('zv_test_') && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs" 
                          style={{ backgroundColor: "rgba(190, 164, 114, 0.2)", color: "var(--color-accent)" }}>
                          TEST
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Created on {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      deleteApiKey(key.id);
                    }}
                    className="p-2 rounded-full"
                    style={{ color: "var(--color-error)" }}
                    title="Delete API Key"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                {activeKeyId === key.id && (
                  <div className="mt-3 font-mono text-sm p-2 rounded-lg overflow-x-auto" 
                    style={{ 
                      backgroundColor: "rgba(49, 55, 69, 0.5)", 
                      borderColor: "var(--color-accent)", 
                      borderWidth: "1px",
                      color: "var(--color-foreground)"
                    }}>
                    {keyVisible ? key.key : key.key.replace(/./g, '•')}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeyVisible(!keyVisible);
                      }}
                      className="ml-2 p-1 rounded-full inline-flex"
                      style={{ color: "var(--color-foreground-alt)" }}
                      title={keyVisible ? "Hide API Key" : "Show API Key"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        {keyVisible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        )}
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Create New API Key */}
      <div className="rounded-lg border p-6 mb-8" 
        style={{ 
          backgroundColor: "rgba(7, 18, 36, 0.2)", 
          borderColor: "var(--color-border)" 
        }}>
        <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>
          {apiKeys.length ? "Create New API Key" : "Create Your First API Key"}
        </h3>
        
        <div className="mb-4">
          <label htmlFor="apiKeyName" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
            API Key Name
          </label>
          <input
            type="text"
            id="apiKeyName"
            value={apiKeyName}
            onChange={(e) => setApiKeyName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: "var(--color-surface)", 
              borderColor: "var(--color-border)", 
              borderWidth: "1px",
              color: "var(--color-foreground)"
            }}
            placeholder="My API Key"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
            API Key Type
          </label>
          <div className="flex items-center space-x-2">
            <div 
              className={`px-4 py-2 rounded-lg cursor-pointer flex items-center ${!isLiveKey ? 'border-2' : 'border'}`}
              style={{ 
                backgroundColor: !isLiveKey ? "rgba(190, 164, 114, 0.1)" : "var(--color-surface)",
                borderColor: !isLiveKey ? "var(--color-accent)" : "var(--color-border)",
                color: "var(--color-foreground)"
              }}
              onClick={() => setIsLiveKey(false)}
            >
              <div className={`w-4 h-4 rounded-full mr-2 border ${!isLiveKey ? 'bg-amber-500 border-amber-600' : 'bg-transparent border-gray-400'}`}></div>
              <span>Test Key</span>
            </div>
            <div 
              className={`px-4 py-2 rounded-lg cursor-pointer flex items-center ${isLiveKey ? 'border-2' : 'border'}`}
              style={{ 
                backgroundColor: isLiveKey ? "rgba(22, 163, 74, 0.1)" : "var(--color-surface)",
                borderColor: isLiveKey ? "var(--color-success)" : "var(--color-border)",
                color: "var(--color-foreground)"
              }}
              onClick={() => setIsLiveKey(true)}
            >
              <div className={`w-4 h-4 rounded-full mr-2 border ${isLiveKey ? 'bg-green-500 border-green-600' : 'bg-transparent border-gray-400'}`}></div>
              <span>Live Key</span>
            </div>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-foreground-alt)" }}>
            {isLiveKey ? 
              "Live keys verify payment amounts and are intended for production use." : 
              "Test keys process real payments but don't verify amounts, allowing testing with smaller payments."}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={regenerateApiKey}
            disabled={isRegenerating || generateApiKeyMutation.isPending}
            className="flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: isLiveKey ? "var(--color-success)" : "var(--color-accent)",
              color: "var(--color-accent-foreground)",
              borderColor: isLiveKey ? "var(--color-success)" : "var(--color-accent)",
              borderWidth: "1px"
            }}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : `Generate ${isLiveKey ? 'Live' : 'Test'} Key`}</span>
          </button>
          
          {apiKey && (
            <button 
              onClick={copyApiKey}
              className="flex items-center px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)" 
              }}
              title="Copy to clipboard (will be cleared after 60 seconds)"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" style={{ color: "var(--color-success)" }} />
                  <span style={{ color: "var(--color-success)" }}>Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-5 w-5 mr-2" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
        
        {errorMessage && (
          <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-foreground)" }}>
            Error: {errorMessage}
          </div>
        )}
        
        {generateApiKeyMutation.error && !errorMessage && (
          <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-foreground)" }}>
            Error: {generateApiKeyMutation.error.message}
          </div>
        )}
        
        {apiKey && (
          <div className="mt-4">
            <div className="relative">
              <div className="flex items-center rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto" 
                style={{ 
                  backgroundColor: "rgba(49, 55, 69, 0.5)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)" 
                }}>
                {apiKey.startsWith('zv_live_') && (
                  <span className="inline-flex items-center px-2 py-1 mr-2 rounded text-xs" 
                    style={{ backgroundColor: "rgba(22, 163, 74, 0.2)", color: "var(--color-success)" }}>
                    LIVE
                  </span>
                )}
                {apiKey.startsWith('zv_test_') && (
                  <span className="inline-flex items-center px-2 py-1 mr-2 rounded text-xs" 
                    style={{ backgroundColor: "rgba(190, 164, 114, 0.2)", color: "var(--color-accent)" }}>
                    TEST
                  </span>
                )}
                {keyVisible ? apiKey : apiKey.replace(/./g, '•')}
                <button 
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="ml-2 p-1 rounded-full"
                  style={{ color: "var(--color-foreground-alt)" }}
                  title={keyVisible ? "Hide API Key" : "Show API Key"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    {keyVisible ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            {/* API Key strength indicator */}
            <div className="mt-2 flex items-center">
              <div className="flex-1 h-1 mr-2 rounded-full overflow-hidden bg-gray-300">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: keyStrength === 'weak' ? '33%' : keyStrength === 'medium' ? '66%' : '100%',
                    backgroundColor: keyStrength === 'weak' ? 'var(--color-error)' : 
                                  keyStrength === 'medium' ? 'var(--color-warning)' : 
                                  'var(--color-success)'
                  }}
                ></div>
              </div>
              <span className="text-xs" style={{ 
                color: keyStrength === 'weak' ? 'var(--color-error)' : 
                      keyStrength === 'medium' ? 'var(--color-warning)' : 
                      'var(--color-success)' 
              }}>
                {keyStrength === 'weak' ? 'Weak' : keyStrength === 'medium' ? 'Medium' : 'Strong'}
              </span>
            </div>
            
            <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
              Store this API key securely. For security reasons, it will be masked after you leave this page and you won't be able to see the full key again.
            </p>
          </div>
        )}
      </div>
      
      {/* API Testing Section */}
      {apiKey && (
        <div className="rounded-lg border p-6" 
          style={{ 
            backgroundColor: "rgba(7, 18, 36, 0.2)", 
            borderColor: "var(--color-border)" 
          }}>
          <h3 className="font-medium mb-4" style={{ color: "var(--color-foreground)" }}>Test API Key</h3>
          <p className="text-sm mb-6" style={{ color: "var(--color-foreground-alt)" }}>
            Test your API key by creating a Zcash payment request with the following parameters:
            {apiKey.startsWith('zv_test_') && (
              <span className="block mt-2 italic">
                Using a test key allows you to send a smaller amount than specified while still validating the payment.
              </span>
            )}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
                placeholder="1"
              />
            </div>
            
            <div>
              <label htmlFor="invoiceId" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                Invoice ID
              </label>
              <input
                type="text"
                id="invoiceId"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
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
              <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
                Amount (ZEC)
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
                placeholder="10"
              />
            </div>
          </div>
          
          {/* API Key field (readonly) */}
          <div className="mb-6">
            <label htmlFor="apiKeyTest" className="block text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>
              API Key
            </label>
            <input
              type="text"
              id="apiKeyTest"
              value={apiKey}
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
          
          <div className="mb-6">
            <div className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>API Endpoint:</div>
            <div className="rounded-lg px-4 py-3 font-mono text-sm break-all" 
              style={{ 
                backgroundColor: "rgba(49, 55, 69, 0.5)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px",
                color: "var(--color-foreground)" 
              }}>
              https://www.v3nture.link/create?user_id={userId}&invoice_id={invoiceId}&amount={Number(amount) * 100}
            </div>
          </div>
          
          <button
            onClick={testApiKey}
            disabled={isTestingApi || !userId || !invoiceId || !amount || !apiKey}
            className="flex items-center px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-foreground)"
            }}
          >
            {isTestingApi ? (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <BeakerIcon className="h-5 w-5 mr-2" />
                <span>Test API Key</span>
              </>
            )}
          </button>
          
          {testResult && (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-lg" style={{ 
                backgroundColor: testResult.success ? "var(--color-success)" : "var(--color-error)",
                color: testResult.success ? "var(--color-success-foreground)" : "var(--color-error-foreground)"
              }}>
                <div className="flex items-start">
                  {testResult.success ? (
                    <CheckIcon className="h-5 w-5 mr-2 mt-0.5" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2 mt-0.5">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p>{testResult.message}</p>
                </div>
              </div>
              
              {testResult.response && (
                <div className="rounded-lg p-4" style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px"
                }}>
                  <h4 className="font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Response Details</h4>
                  <div className="p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: "rgba(49, 55, 69, 0.5)" }}>
                    <pre className="text-xs" style={{ color: "var(--color-foreground)" }}>
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
        <p>Need a production API key? <a href="#" style={{ color: "var(--color-accent)" }}>Contact our team</a> to verify your account.</p>
      </div>
    </div>
  );
} 