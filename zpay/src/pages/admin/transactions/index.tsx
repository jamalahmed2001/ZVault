'use client';
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Dialog, Transition } from "@headlessui/react";

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusClasses = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REVERSED: "bg-purple-100 text-purple-800",
  };

  const defaultClass = "bg-gray-100 text-gray-800";
  const statusClass = statusClasses[status as keyof typeof statusClasses] || defaultClass;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
    >
      {status}
    </span>
  );
}

export default function TransactionManagement() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  // Format filters for API
  const getQueryFilters = () => {
    const queryFilters: any = {
      page,
      limit,
      sortBy,
      sortOrder,
    };
    
    if (filters.status) queryFilters.status = filters.status;
    if (filters.userId) queryFilters.userId = filters.userId;
    if (filters.startDate) queryFilters.startDate = new Date(filters.startDate);
    if (filters.endDate) queryFilters.endDate = new Date(filters.endDate);
    
    return queryFilters;
  };
  
  const { 
    data: transactionsData, 
    isLoading, 
    refetch 
  } = api.admin.getAllTransactions.useQuery(
    getQueryFilters(),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Transaction details query
  const { 
    data: transactionDetails,
    isLoading: isLoadingDetails
  } = api.admin.getTransactionById.useQuery(
    { transactionId: selectedTransactionId || "" },
    {
      enabled: !!selectedTransactionId,
      refetchOnWindowFocus: false,
    }
  );

  // Stats queries
  const { 
    data: statsData,
    isLoading: statsLoading 
  } = api.admin.getTransactionStats.useQuery(
    { period: "month" },
    {
      refetchOnWindowFocus: false,
    }
  );
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);
  
  const handleResetFilters = () => {
    setFilters({
      status: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setShowFilters(false);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleViewTransaction = (id: string) => {
    setSelectedTransactionId(id);
    setIsTransactionModalOpen(true);
  };
  
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };
  
  // Status count cards
  const statCards = [
    {
      name: "Total Transactions",
      value: statsData?.totalTransactions || 0,
      className: "bg-white",
    },
    {
      name: "Pending",
      value: statsData?.statuses?.pending || 0,
      className: "bg-yellow-50",
    },
    {
      name: "Processing",
      value: statsData?.statuses?.processing || 0,
      className: "bg-blue-50",
    },
    {
      name: "Completed",
      value: statsData?.statuses?.completed || 0,
      className: "bg-green-50",
    },
    {
      name: "Failed",
      value: statsData?.statuses?.failed || 0,
      className: "bg-red-50",
    },
  ];
  
  // Format amount as currency
  const formatAmount = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <AdminLayout title="Transactions">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.name}
            className={`px-4 py-3 rounded-lg shadow-sm ${card.className}`}
          >
            <dt className="text-sm font-medium text-gray-500 truncate">
              {card.name}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-gray-900">
              {card.value}
            </dd>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Transactions
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="ml-3 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
              <button
                onClick={() => refetch()}
                className="ml-2 inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Show:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    User ID
                  </label>
                  <input
                    type="text"
                    name="userId"
                    id="userId"
                    value={filters.userId}
                    onChange={handleFilterChange}
                    placeholder="Filter by user ID"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center cursor-pointer">
                  ID
                  {sortBy === "id" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center cursor-pointer">
                  Amount
                  {sortBy === "amount" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                User
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center cursor-pointer">
                  Status
                  {sortBy === "status" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                onClick={() => handleSort("createdAt")}
              >
                <div className="flex items-center cursor-pointer">
                  Created
                  {sortBy === "createdAt" && (
                    <span className="ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="relative py-3.5 pl-3 pr-4 sm:pr-6"
              >
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                </td>
              </tr>
            ) : transactionsData?.transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            ) : (
              transactionsData?.transactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewTransaction(transaction.id)}
                >
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                    <div className="truncate max-w-[120px]">{transaction.id}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatAmount(Number(transaction.amount))}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {transaction.user?.email || transaction.user?.username || transaction.userId || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <StatusBadge status={transaction.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {transaction.createdAt
                      ? format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')
                      : 'N/A'
                    }
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTransaction(transaction.id);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {transactionsData && transactionsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                page === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(transactionsData.pagination.totalPages, page + 1))}
              disabled={page === transactionsData.pagination.totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                page === transactionsData.pagination.totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(page - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    page * limit,
                    transactionsData.pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {transactionsData.pagination.total}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium ${
                    page === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
                    page === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">
                  {page} / {transactionsData.pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPage(Math.min(transactionsData.pagination.totalPages, page + 1))}
                  disabled={page === transactionsData.pagination.totalPages}
                  className={`relative inline-flex items-center px-2 py-2 text-sm font-medium ${
                    page === transactionsData.pagination.totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage(transactionsData.pagination.totalPages)}
                  disabled={page === transactionsData.pagination.totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium ${
                    page === transactionsData.pagination.totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Last</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <Transition appear show={isTransactionModalOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="fixed inset-0 z-50 overflow-y-auto" 
          onClose={() => setIsTransactionModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Transaction Details
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setIsTransactionModalOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-4">
                  {isLoadingDetails ? (
                    <div className="py-10 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    </div>
                  ) : transactionDetails ? (
                    <div className="space-y-6">
                      {/* Transaction ID */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Transaction ID</h4>
                        <p className="mt-1 text-sm text-gray-900 break-all">{transactionDetails.id}</p>
                      </div>

                      {/* Amount and Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {formatAmount(Number(transactionDetails.amount))}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <div className="mt-1">
                            <StatusBadge status={transactionDetails.status} />
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {transactionDetails.createdAt
                              ? format(new Date(transactionDetails.createdAt), 'MMM d, yyyy HH:mm:ss')
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Completed At</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {transactionDetails.completedAt
                              ? format(new Date(transactionDetails.completedAt), 'MMM d, yyyy HH:mm:ss')
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      {/* User Information */}
                      {transactionDetails.user && (
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-4">User Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-xs font-medium text-gray-500">Name</h5>
                              <p className="mt-1 text-sm text-gray-900">
                                {transactionDetails.user.first_name} {transactionDetails.user.last_name}
                              </p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-500">Email</h5>
                              <p className="mt-1 text-sm text-gray-900">{transactionDetails.user.email}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-500">Username</h5>
                              <p className="mt-1 text-sm text-gray-900">{transactionDetails.user.username || 'N/A'}</p>
                            </div>
                            <div>
                              <h5 className="text-xs font-medium text-gray-500">ZCash Address</h5>
                              <p className="mt-1 text-sm text-gray-900 break-all">
                                {transactionDetails.user.zcashAddress || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Details */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Additional Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">Transaction Fee</h5>
                            <p className="mt-1 text-sm text-gray-900">
                              {transactionDetails.fee ? formatAmount(Number(transactionDetails.fee)) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-gray-500">User ID</h5>
                            <p className="mt-1 text-sm text-gray-900 break-all">
                              {transactionDetails.userId || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Transaction Metadata */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Transaction Metadata</h4>
                        <div className="space-y-3">
                          {/* Display any additional non-standard fields from transaction object */}
                          {transactionDetails && Object.entries(transactionDetails).map(([key, value]) => {
                            // Skip standard fields we've already displayed
                            if (['id', 'amount', 'status', 'createdAt', 'completedAt', 'fee', 'userId', 'user'].includes(key)) {
                              return null;
                            }
                            
                            // Display arrays (like addressesUsed, txHashes) properly
                            if (Array.isArray(value) && value.length > 0) {
                              return (
                                <div key={key}>
                                  <h5 className="text-xs font-medium text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </h5>
                                  <div className="mt-1 space-y-1">
                                    {value.map((item, index) => (
                                      <p key={index} className="text-sm text-gray-900 break-all bg-gray-50 p-1 rounded">
                                        {String(item)}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            
                            // Display simple values
                            if (value !== null && value !== undefined && typeof value !== 'object') {
                              return (
                                <div key={key}>
                                  <h5 className="text-xs font-medium text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </h5>
                                  <p className="mt-1 text-sm text-gray-900 break-all">
                                    {String(value)}
                                  </p>
                                </div>
                              );
                            }
                            
                            return null;
                          })}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsTransactionModalOpen(false)}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-gray-500">
                      Transaction not found
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </AdminLayout>
  );
} 