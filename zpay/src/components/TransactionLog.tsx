import { useState } from "react";
import { CurrencyDollarIcon, FunnelIcon, ArrowPathIcon, XMarkIcon, CloudArrowUpIcon, CheckIcon } from '@heroicons/react/24/outline';
import { format } from "date-fns";
import { api } from "@/utils/api";
import { Decimal } from "@prisma/client/runtime/library";

// Define type for Transaction
// Note: There seems to be a type mismatch between our Transaction interface
// and what's defined in the Prisma schema. In a real application, you would
// ensure these match exactly. For now, we're type-casting to handle the discrepancy.
interface Transaction {
  id: string;
  amount: Decimal;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REVERSED";
  fee?: Decimal | null;
  invoiceId?: string | null;
  clientUserId?: string | null;
  txHashes?: string[];
  addressesUsed?: string[];
  createdAt: Date;
  completedAt?: Date | null;
  updatedAt: Date;
  userId: string;
  apiKeyId?: string | null;
  apiKey?: {
    name?: string | null;
  } | null;
}

interface TransactionLogProps {
  // Optional props if needed
  initialApiKey?: string;
}

export default function TransactionLog({ initialApiKey }: TransactionLogProps) {
  // Transaction filters
  const [transactionStatus, setTransactionStatus] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [clientUserIdFilter, setClientUserIdFilter] = useState<string | undefined>(undefined);
  const [invoiceIdFilter, setInvoiceIdFilter] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  
  // Transaction details modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // Manual sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{success: boolean; message: string} | null>(null);
  const [apiKey, setApiKey] = useState<string>(initialApiKey || "");
  
  // Fetch transaction data with filters
  const transactions = api.auth.getTransactions.useQuery(
    {
      status: transactionStatus as any,
      startDate,
      endDate,
      clientUserId: clientUserIdFilter,
      invoiceId: invoiceIdFilter,
      sortDirection,
      limit: 50
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Clear all transaction filters
  const clearFilters = () => {
    setTransactionStatus(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setClientUserIdFilter(undefined);
    setInvoiceIdFilter(undefined);
    setSortDirection("desc");
  };
  
  // Handle transaction row click to show details
  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction as Transaction);
    setShowTransactionDetails(true);
  };
  
  // Close transaction details modal
  const closeTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };

  // Manual sync with Venute API
  const syncWithVenute = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      // Use the shared-data endpoint with API key
      const url = `https://www.v3nture.link/shared-data`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Successful sync, refresh the transaction list
        await transactions.refetch();
        setSyncResult({
          success: true,
          message: "Successfully synced data with Venute!"
        });
      } else {
        // Handle error
        const errorText = await response.text();
        setSyncResult({
          success: false,
          message: `Sync failed: ${response.status} ${response.statusText}. ${errorText}`
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: `Sync error: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    } finally {
      setIsSyncing(false);
      // Clear sync result after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  return (
    <div className="rounded-xl shadow-lg p-8" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CurrencyDollarIcon className="h-8 w-8 mr-4" style={{ color: "var(--color-accent)" }} />
          <h2 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>Transaction History</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={syncWithVenute}
            disabled={isSyncing}
            className="flex items-center px-3 py-2 rounded-lg"
            style={{ 
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
              opacity: isSyncing ? 0.7 : 1
            }}
          >
            {isSyncing ? (
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            )}
            <span>{isSyncing ? "Syncing..." : "Sync with Venute"}</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 rounded-lg"
            style={{ 
              backgroundColor: showFilters ? "var(--color-accent)" : "transparent",
              color: showFilters ? "white" : "var(--color-foreground)",
              borderColor: "var(--color-border)",
              borderWidth: "1px"
            }}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Show sync result message if there is one */}
      {syncResult && (
        <div 
          className="mb-4 p-3 rounded-lg flex items-center"
          style={{ 
            backgroundColor: syncResult.success ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.1)",
            borderColor: syncResult.success ? "rgba(52, 211, 153, 0.5)" : "rgba(239, 68, 68, 0.5)",
            borderWidth: "1px",
            color: syncResult.success ? "rgb(6, 95, 70)" : "rgb(153, 27, 27)"
          }}
        >
          {syncResult.success ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : (
            <XMarkIcon className="h-5 w-5 mr-2" />
          )}
          <span>{syncResult.message}</span>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="status" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Status
              </label>
              <select
                id="status"
                value={transactionStatus || ""}
                onChange={(e) => setTransactionStatus(e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="clientUserId" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Client User ID
              </label>
              <input
                type="text"
                id="clientUserId"
                value={clientUserIdFilter || ""}
                onChange={(e) => setClientUserIdFilter(e.target.value || undefined)}
                placeholder="Filter by user ID"
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              />
            </div>
            
            <div>
              <label htmlFor="invoiceId" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Invoice ID
              </label>
              <input
                type="text"
                id="invoiceId"
                value={invoiceIdFilter || ""}
                onChange={(e) => setInvoiceIdFilter(e.target.value || undefined)}
                placeholder="Filter by invoice ID"
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              />
            </div>
            
            <div>
              <label htmlFor="startDate" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate ? startDate.toISOString().split('T')[0] : ""}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate ? endDate.toISOString().split('T')[0] : ""}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              />
            </div>
            
            <div>
              <label htmlFor="sortDirection" className="block mb-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Sort Order
              </label>
              <select
                id="sortDirection"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as "asc" | "desc")}
                className="w-full px-3 py-2 rounded-lg focus:outline-none"
                style={{ 
                  backgroundColor: "var(--color-surface)", 
                  borderColor: "var(--color-border)", 
                  borderWidth: "1px",
                  color: "var(--color-foreground)"
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg mr-2"
              style={{ 
                backgroundColor: "transparent",
                color: "var(--color-foreground)",
                borderColor: "var(--color-border)",
                borderWidth: "1px"
              }}
            >
              Clear Filters
            </button>
            <button
              onClick={() => transactions.refetch()}
              className="px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-foreground)"
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-x-auto" style={{ backgroundColor: "var(--color-surface)" }}>
        {transactions.isLoading ? (
          <div className="py-12 text-center">
            <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin" style={{ color: "var(--color-foreground-alt)" }} />
            <p className="mt-4" style={{ color: "var(--color-foreground-alt)" }}>Loading transactions...</p>
          </div>
        ) : transactions.data?.transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p style={{ color: "var(--color-foreground-alt)" }}>No transactions found</p>
            {(transactionStatus || startDate || endDate || clientUserIdFilter || invoiceIdFilter) && (
              <button
                onClick={clearFilters}
                className="mt-2 px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: "var(--color-surface-alt)",
                  color: "var(--color-foreground)",
                  borderColor: "var(--color-border)",
                  borderWidth: "1px"
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="pb-2 text-sm" style={{ color: "var(--color-foreground-alt)" }}>
              Showing {transactions.data?.transactions.length} of {transactions.data?.totalCount || 0} transactions
            </div>
            
            <table className="w-full" style={{ color: "var(--color-foreground)" }}>
              <thead>
                <tr style={{ borderBottomColor: "var(--color-border)", borderBottomWidth: "1px" }}>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>Invoice ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: "var(--color-foreground-alt)" }}>Client User</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data?.transactions.map((transaction) => (
                  <tr 
                    key={transaction.id}
                    style={{ 
                      borderBottomColor: "var(--color-border)", 
                      borderBottomWidth: "1px" 
                    }}
                    className="hover:opacity-80 cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(transaction.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {Number(transaction.amount).toFixed(4)} ZEC
                      {transaction.fee && (
                        <span className="ml-1 text-xs" style={{ color: "var(--color-foreground-alt)" }}>
                          (Fee: {Number(transaction.fee).toFixed(4)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(transaction as Transaction).invoiceId ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                        transaction.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                        transaction.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        transaction.status === "PROCESSING" ? "bg-blue-100 text-blue-800" :
                        transaction.status === "FAILED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {(transaction as Transaction).clientUserId ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.data?.nextCursor && (
              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    // Load more functionality would go here
                  }}
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--color-surface-alt)",
                    color: "var(--color-foreground)",
                    borderColor: "var(--color-border)",
                    borderWidth: "1px"
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Summary Stats - Could be expanded with charts later */}
      {transactions.data?.totalCount && transactions.data.totalCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-alt)", borderColor: "var(--color-border)", borderWidth: "1px" }}>
            <p className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Total Transactions</p>
            <p className="text-xl font-bold mt-1" style={{ color: "var(--color-foreground)" }}>{transactions.data?.totalCount || 0}</p>
          </div>
          {/* Additional stats could be added here */}
        </div>
      )}
      
      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="relative rounded-xl max-w-2xl w-full p-6 overflow-hidden shadow-xl" 
              style={{ 
                backgroundColor: "var(--color-surface)", 
                borderColor: "var(--color-border)", 
                borderWidth: "1px" 
              }}
            >
              {/* Close button */}
              <button 
                onClick={closeTransactionDetails} 
                className="absolute top-4 right-4 p-1 rounded-full"
                style={{ backgroundColor: "var(--color-surface-alt)" }}
              >
                <XMarkIcon className="h-5 w-5" style={{ color: "var(--color-foreground)" }} />
              </button>
              
              <div className="mb-4 pb-3" style={{ borderBottomColor: "var(--color-border)", borderBottomWidth: "1px" }}>
                <h3 className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
                  Transaction Details
                </h3>
              </div>
              
              {/* Transaction information */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Transaction ID</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{selectedTransaction.id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Status</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                    selectedTransaction.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    selectedTransaction.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    selectedTransaction.status === "PROCESSING" ? "bg-blue-100 text-blue-800" :
                    selectedTransaction.status === "FAILED" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Amount</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {Number(selectedTransaction.amount).toFixed(4)} ZEC
                  </span>
                </div>
                
                {selectedTransaction.fee && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Fee</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {Number(selectedTransaction.fee).toFixed(4)} ZEC
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Created At</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {format(new Date(selectedTransaction.createdAt), "MMM d, yyyy h:mm:ss a")}
                  </span>
                </div>
                
                {selectedTransaction.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Completed At</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {format(new Date(selectedTransaction.completedAt), "MMM d, yyyy h:mm:ss a")}
                    </span>
                  </div>
                )}
                
                {selectedTransaction.invoiceId && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Invoice ID</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {selectedTransaction.invoiceId}
                    </span>
                  </div>
                )}
                
                {selectedTransaction.clientUserId && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>Client User ID</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {selectedTransaction.clientUserId}
                    </span>
                  </div>
                )}
                
                {selectedTransaction.apiKey?.name && (
                  <div className="flex justify-between">
                    <span className="text-sm" style={{ color: "var(--color-foreground-alt)" }}>API Key</span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {selectedTransaction.apiKey.name}
                    </span>
                  </div>
                )}
                
                {/* Transaction hashes */}
                {selectedTransaction.txHashes && selectedTransaction.txHashes.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Transaction Hashes</h4>
                    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-surface-alt)", maxHeight: "100px", overflowY: "auto" }}>
                      {selectedTransaction.txHashes.map((hash, index) => (
                        <div key={index} className="text-xs mb-1 break-all" style={{ color: "var(--color-foreground)" }}>
                          {hash}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Addresses used */}
                {selectedTransaction.addressesUsed && selectedTransaction.addressesUsed.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground)" }}>Addresses Used</h4>
                    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--color-surface-alt)", maxHeight: "100px", overflowY: "auto" }}>
                      {selectedTransaction.addressesUsed.map((address, index) => (
                        <div key={index} className="text-xs mb-1 break-all" style={{ color: "var(--color-foreground)" }}>
                          {address}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeTransactionDetails}
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-primary-foreground)"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 