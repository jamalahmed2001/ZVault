'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import {
  UserIcon,
  KeyIcon,
  BellIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ServerIcon,
  CircleStackIcon,
  UsersIcon,
  ClockIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

// Type definitions for our data
type ApiStat = {
  date: string;
  requests: number;
};

type EntityDistribution = {
  min: number;
  max: number;
  median: number;
};

// Simple bar chart component
const BarChart = ({ data, xKey, yKey, title, description }: { 
  data: any[]; 
  xKey: string; 
  yKey: string; 
  title: string;
  description: string;
}) => {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => item[yKey] || 0));
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="p-6">
        <div className="h-64">
          <div className="flex h-full items-end">
            {data.map((item, index) => (
              <div key={index} className="flex-1 mx-1 flex flex-col items-center">
                <div 
                  className="w-full bg-indigo-500 rounded-t"
                  style={{ 
                    height: `${(item[yKey] / maxValue) * 100}%`,
                    minHeight: item[yKey] ? '4px' : '0',
                  }}
                ></div>
                <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                  {item[xKey]}
                </div>
                <div className="mt-1 text-xs font-medium text-gray-900 truncate w-full text-center">
                  {item[yKey]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminAnalytics() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days for API stats

  // API queries with refetch functions
  const { data: systemStats, isLoading: statsLoading, refetch: refetchSystemStats } = api.admin.getSystemStats.useQuery();
  const { data: dbStats, isLoading: dbStatsLoading, refetch: refetchDbStats } = api.admin.getDbSchemaStats.useQuery();
  const { data: growthStats, isLoading: growthStatsLoading, refetch: refetchGrowthStats } = api.admin.getUserGrowthStats.useQuery();
  const { data: entityStats, isLoading: entityStatsLoading, refetch: refetchEntityStats } = api.admin.getEntityRelationStats.useQuery();
  const { data: apiUsage, isLoading: apiUsageLoading, refetch: refetchApiUsage } = api.admin.getApiUsageStats.useQuery({ days: timeRange });

  // Function to refresh all data
  const refreshAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      refetchSystemStats(),
      refetchDbStats(),
      refetchGrowthStats(),
      refetchEntityStats(),
      refetchApiUsage()
    ]);
    setIsLoading(false);
  };

  // Refetch API usage data when time range changes
  useEffect(() => {
    refetchApiUsage();
  }, [timeRange, refetchApiUsage]);

  // Handle loading state
  useEffect(() => {
    if (!statsLoading && !dbStatsLoading && !growthStatsLoading && !entityStatsLoading && !apiUsageLoading) {
      setIsLoading(false);
    }
  }, [statsLoading, dbStatsLoading, growthStatsLoading, entityStatsLoading, apiUsageLoading]);

  if (isLoading) {
    return (
      <AdminLayout title="Analytics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  // Format numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes.toFixed(2)} KB`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <AdminLayout title="Analytics">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Comprehensive analytics of the ZVault database, including user growth, entity relationships, and storage usage.
          </p>
        </div>
        <button
          onClick={refreshAllData}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors duration-300 flex items-center`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refreshing...
            </>
          ) : (
            'Refresh Data'
          )}
        </button>
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(growthStats?.total ?? 0)}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <ArrowUpRightIcon className="h-4 w-4 mr-1" />
                  +{formatNumber(growthStats?.last30d ?? 0)} in 30 days
                </div>
                <div className="text-sm text-gray-500">
                  {(((growthStats?.last30d ?? 0) / Math.max(growthStats?.total ?? 1, 1)) * 100).toFixed(1)}% growth
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                <KeyIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">API Keys</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(dbStats?.counts?.apiKeys ?? 0)}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">
                  {formatNumber(Number(entityStats?.averages?.apiKeysPerUser?.toFixed(2) ?? 0))} per user
                </div>
                <div className="text-sm text-gray-500">
                  Max: {formatNumber(entityStats?.distributions?.apiKeys?.max ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Webhooks</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(dbStats?.counts?.webhooks ?? 0)}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">
                  {((dbStats?.counts?.webhooks ?? 0) / Math.max(dbStats?.counts?.users ?? 1, 1) * 100).toFixed(1)}% of users
                </div>
                <div className="text-sm text-gray-500">
                  Active: {formatNumber(systemStats?.webhookConfigs ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <CircleStackIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Database Size</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatBytes((dbStats?.storageEstimates?.totalKB ?? 0) * 1024)}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">
                  {dbStats?.counts?.users ? (formatBytes(((dbStats.storageEstimates?.totalKB ?? 0) * 1024) / dbStats.counts.users)) : "0 KB"} per user
                </div>
                <div className="text-sm text-gray-500">
                  {Object.keys(dbStats?.counts ?? {}).length ?? 0} tables
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <BarChart 
        data={growthStats?.monthlyData ?? []}
        xKey="month"
        yKey="count"
        title="User Growth by Month"
        description="Number of new users registered each month over the past year"
      />

      {/* API Usage Chart - Updated to handle large time ranges without overflow */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">API Usage by Day</h3>
            <p className="mt-1 text-sm text-gray-500">Number of API requests processed each day</p>
          </div>
          <div>
            <select 
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64 overflow-x-auto">
            <div className="flex h-full items-end" style={{ minWidth: timeRange > 30 ? `${timeRange * 20}px` : '100%' }}>
              {(() => {
                const dailyStats = apiUsage?.dailyStats ?? [];
                const maxValue = Math.max(...dailyStats.map(item => item.requests || 0), 1);
                
                return dailyStats.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0" 
                    style={{ 
                      width: timeRange > 30 ? '20px' : `calc(100% / ${Math.max(dailyStats.length, 1)})`,
                      marginLeft: '1px',
                      marginRight: '1px'
                    }}
                  >
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ 
                        height: `${(item.requests / maxValue) * 100}%`,
                        minHeight: item.requests ? '4px' : '0',
                      }}
                    ></div>
                    <div className="mt-2 text-xs text-gray-500 truncate w-full text-center">
                      {timeRange > 30 ? item.date?.split('-').slice(1).join('/') ?? '' : item.date ?? ''}
                    </div>
                    <div className="mt-1 text-xs font-medium text-gray-900 truncate w-full text-center">
                      {formatNumber(item.requests)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
          {timeRange > 30 && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Scroll horizontally to see all data points
            </div>
          )}
        </div>
      </div>

      {/* Entity Relationships */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Entity Relationships</h3>
          <p className="mt-1 text-sm text-gray-500">
            Analysis of relationships between database entities
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <div className="text-sm font-medium text-gray-500">Metric</div>
            <div className="text-sm font-medium text-gray-500">Average</div>
            <div className="text-sm font-medium text-gray-500">Median</div>
            <div className="text-sm font-medium text-gray-500">Maximum</div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <div className="text-sm font-medium text-gray-500">Accounts per User</div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.averages?.accountsPerUser?.toFixed(2) ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.accounts?.median ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.accounts?.max ?? "0"}
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 bg-gray-50">
            <div className="text-sm font-medium text-gray-500">Sessions per User</div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.averages?.sessionsPerUser?.toFixed(2) ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.sessions?.median ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.sessions?.max ?? "0"}
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
            <div className="text-sm font-medium text-gray-500">Posts per User</div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.averages?.postsPerUser?.toFixed(2) ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.posts?.median ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.posts?.max ?? "0"}
            </div>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6 bg-gray-50">
            <div className="text-sm font-medium text-gray-500">API Keys per User</div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.averages?.apiKeysPerUser?.toFixed(2) ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.apiKeys?.median ?? "0"}
            </div>
            <div className="mt-1 text-sm text-gray-900 sm:mt-0">
              {entityStats?.distributions?.apiKeys?.max ?? "0"}
            </div>
          </div>
        </div>
      </div>

      {/* Database Schema Stats */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Database Schema Analysis</h3>
          <p className="mt-1 text-sm text-gray-500">
            Record counts and storage estimations for each database table
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <div className="text-sm font-medium text-gray-500">Table</div>
            <div className="text-sm font-medium text-gray-500">Records</div>
            <div className="text-sm font-medium text-gray-500">Storage Estimate</div>
          </div>
          {dbStats && Object.entries(dbStats.counts ?? {}).map(([table, count], idx) => (
            <div key={table} className={`border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${idx % 2 ? 'bg-gray-50' : ''}`}>
              <div className="text-sm font-medium text-gray-500 capitalize">{table}</div>
              <div className="mt-1 text-sm text-gray-900 sm:mt-0">{formatNumber(count as number)}</div>
              <div className="mt-1 text-sm text-gray-900 sm:mt-0">
                {formatBytes(((dbStats.storageEstimates as any)?.[table] ?? 0) * 1024)}
              </div>
            </div>
          ))}
          <div className="border-t border-gray-200 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-100">
            <div className="text-sm font-medium text-gray-700">Total</div>
            <div className="mt-1 text-sm font-medium text-gray-900 sm:mt-0">
              {formatNumber(Object.values(dbStats?.counts ?? {}).reduce((sum, c) => sum + (c as number), 0))}
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900 sm:mt-0">
              {formatBytes((dbStats?.storageEstimates?.totalKB ?? 0) * 1024)}
            </div>
          </div>
        </div>
      </div>

      {/* API Usage Stats */}
      <div className="mt-8 mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <ServerIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total API Requests</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(apiUsage?.totalRequests ?? 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-teal-500 rounded-md p-3">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unique API Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(apiUsage?.uniqueUsers ?? 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Requests/Day</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(apiUsage?.avgRequestsPerDay ?? 0)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}