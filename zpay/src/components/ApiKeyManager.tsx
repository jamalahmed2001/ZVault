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
    onSuccess: (data) => {
      setApiKeys(data);
      if (data.length > 0 && !activeKeyId) {
        setActiveKeyId(data[0].id);
        setApiKey(data[0].key);
      }
    }
  });

  useEffect(() => {
    // If we have API keys and no active key is selected, use the first one
    if (apiKeys.length > 0 && !activeKeyId) {
      setActiveKeyId(apiKeys[0]!.id);
      setApiKey(apiKeys[0]!.key);
    }
  }, [apiKeys, activeKeyId]);

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
      <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
        <div className="flex justify-center items-center h-40">
          <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-neutral-600">Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-blue-100">
      <div className="flex items-center mb-6">
        <ClipboardIcon className="h-8 w-8 text-amber-500 mr-4" />
        <h2 className="text-2xl font-bold text-blue-800">API Key Management</h2>
      </div>
      
      <p className="text-neutral-600 mb-6">
        Your API keys grant access to your ZPay account. Keep them secure and never share them in public repositories or client-side code.
      </p>
      
      {/* API Keys List */}
      {apiKeys.length > 0 && (
        <div className="mb-8">
          <h3 className="font-medium text-blue-800 mb-4">Your API Keys</h3>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div 
                key={key.id} 
                className={`p-4 border rounded-lg cursor-pointer ${
                  activeKeyId === key.id ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => selectApiKey(key)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{key.name || "API Key"}</p>
                    <p className="text-sm text-gray-500">Created on {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation();
                      deleteApiKey(key.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    title="Delete API Key"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                {activeKeyId === key.id && (
                  <div className="mt-3 font-mono text-sm p-2 bg-white border border-amber-200 rounded-lg overflow-x-auto">
                    {key.key}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Create New API Key */}
      <div className="rounded-lg border border-blue-200 p-6 bg-blue-50 mb-8">
        <h3 className="font-medium text-blue-800 mb-4">
          {apiKeys.length ? "Create New API Key" : "Create Your First API Key"}
        </h3>
        
        <div className="mb-4">
          <label htmlFor="apiKeyName" className="block text-neutral-700 text-sm font-medium mb-2">
            API Key Name
          </label>
          <input
            type="text"
            id="apiKeyName"
            value={apiKeyName}
            onChange={(e) => setApiKeyName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="My API Key"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={regenerateApiKey}
            disabled={isRegenerating || generateApiKeyMutation.isPending}
            className="flex items-center px-4 py-2 rounded-lg border border-amber-200 bg-amber-100 hover:bg-amber-200 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? 'Generating...' : 'Generate API Key'}</span>
          </button>
          
          {apiKey && (
            <button 
              onClick={copyApiKey}
              className="flex items-center px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 mr-2 text-green-600" />
                  <span className="text-green-600">Copied!</span>
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
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
            Error: {generateApiKeyMutation.error.message}
          </div>
        )}
        
        {apiKey && (
          <div className="mt-4">
            <div className="flex items-center bg-white border border-blue-200 rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
              {apiKey}
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Store this somewhere safe. For security reasons, you won't be able to see the full key again.
            </p>
          </div>
        )}
      </div>
      
      {/* API Testing Section */}
      {apiKey && (
        <div className="rounded-lg border border-blue-200 p-6 bg-blue-50">
          <h3 className="font-medium text-blue-800 mb-4">Test API Key</h3>
          <p className="text-sm text-neutral-600 mb-6">
            Test your API key by creating a Zcash payment request with the following parameters:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="userId" className="block text-neutral-700 text-sm font-medium mb-2">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="1"
              />
            </div>
            
            <div>
              <label htmlFor="invoiceId" className="block text-neutral-700 text-sm font-medium mb-2">
                Invoice ID
              </label>
              <input
                type="text"
                id="invoiceId"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="477"
              />
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-neutral-700 text-sm font-medium mb-2">
                Amount (ZEC)
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="10"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-neutral-700 font-medium mb-2">API Endpoint:</div>
            <div className="bg-white border border-blue-200 rounded-lg px-4 py-3 font-mono text-sm break-all">
              https://www.v3nture.link/create?user_id={userId}&invoice_id={invoiceId}&amount={Number(amount) * 100}
            </div>
          </div>
          
          <button
            onClick={testApiKey}
            disabled={isTestingApi || !userId || !invoiceId || !amount}
            className="flex items-center px-6 py-3 bg-amber-200 text-blue-800 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Response Details</h4>
                  <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    <pre className="text-xs">
                      {JSON.stringify(testResult.response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 text-sm text-neutral-500">
        <p>Need a production API key? <a href="#" className="text-amber-600 hover:text-amber-700">Contact our team</a> to verify your account.</p>
      </div>
    </div>
  );
} 