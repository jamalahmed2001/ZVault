import { useState, useEffect } from "react";
import { ClipboardIcon, ArrowPathIcon, CheckIcon, BeakerIcon, TrashIcon } from '@heroicons/react/24/outline';
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";

interface ApiKeyManagerProps {
  initialApiKey?: string;
}

interface ApiKey {
  id: string;
  key: string;
  name?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ApiKeyManager({ initialApiKey }: ApiKeyManagerProps) {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");
  const [apiKeyName, setApiKeyName] = useState<string>("Default API Key");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
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
      fetchApiKeys.refetch();
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
      }
    }
  }, [fetchApiKeys.data, activeKeyId]);

  // Copy API key to clipboard
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Generate API key
  const regenerateApiKey = () => {
    setIsRegenerating(true);
    generateApiKeyMutation.mutate({ name: apiKeyName });
  };
  
  // Delete API key
  const deleteApiKey = (id: string) => {
    if (confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      deleteApiKeyMutation.mutate({ id });
      
      // If we're deleting the active key, reset the state
      if (id === activeKeyId) {
        setActiveKeyId(null);
        setApiKey("");
      }
    }
  };
  
  // Select an API key
  const selectApiKey = (key: ApiKey) => {
    setActiveKeyId(key.id);
    setApiKey(key.key);
    setApiKeyName(key.name || "Default API Key");
  };
  
  // Test API
  const testApiKey = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    
    try {
      // Use the API endpoint provided
      const response = await fetch(`https://www.v3nture.link/create?user_id=${userId}&invoice_id=${invoiceId}&amount=${Number(amount) * 100}`, {
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
        headers: Object.fromEntries([...response.headers.entries()])
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
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    } finally {
      setIsTestingApi(false);
    }
  };

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
                    <p className="font-medium" style={{ color: "var(--color-foreground)" }}>{key.name || "API Key"}</p>
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
                    {key.key}
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
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={regenerateApiKey}
            disabled={isRegenerating || generateApiKeyMutation.isPending}
            className="flex items-center px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-foreground)",
              borderColor: "var(--color-accent)",
              borderWidth: "1px"
            }}
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : 'Generate API Key'}</span>
          </button>
          
          {apiKey && (
            <button 
              onClick={copyApiKey}
              className="flex items-center px-4 py-2 rounded-lg border transition-colors"
              style={{ 
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)" 
              }}
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
        
        {generateApiKeyMutation.error && (
          <div className="mt-4 p-3 rounded-md" style={{ backgroundColor: "var(--color-error)", color: "var(--color-error-foreground)" }}>
            Error: {generateApiKeyMutation.error.message}
          </div>
        )}
        
        {apiKey && (
          <div className="mt-4">
            <div className="flex items-center rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto" 
              style={{ 
                backgroundColor: "rgba(49, 55, 69, 0.5)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px",
                color: "var(--color-foreground)" 
              }}>
              {apiKey}
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
              Store this somewhere safe. For security reasons, you won't be able to see the full key again.
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
            disabled={isTestingApi || !userId || !invoiceId || !amount}
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