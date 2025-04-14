'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import {
  UserIcon as UsersIcon,
  KeyIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch system stats using the admin router
  const { data: systemStats, isLoading: statsLoading } = api.admin.getSystemStats.useQuery();
  
  // Handle success and error states
  useEffect(() => {
    if (!statsLoading) {
      setIsLoading(false);
    }
  }, [statsLoading]);

  // Fetch users using the admin router
  const { data: users, isLoading: usersLoading } = api.admin.getAllUsers.useQuery();
  
  // Log any errors from fetching users
  useEffect(() => {
    if (users === undefined && !usersLoading) {
      console.error("Error fetching users");
    }
  }, [users, usersLoading]);
  
  // Get recent users (top 5)
  const recentUsers = users?.slice(0, 5) || [];

  // Build stats for dashboard cards
  const stats = {
    userCount: systemStats?.totalUsers || 0,
    apiKeyCount: systemStats?.activeApiKeys || 0,
    webhookCount: systemStats?.webhookConfigs || 0,
    newUsers: systemStats?.newUsers || 0
  };

  // Define the dashboard cards
  const cards = [
    {
      name: "Total Users",
      value: stats.userCount,
      icon: UsersIcon,
      change: "+5.4%",
      trend: "up",
      href: "/admin/users",
    },
    {
      name: "API Keys",
      value: stats.apiKeyCount,
      icon: KeyIcon,
      change: "+2.1%",
      trend: "up",
      href: "/admin/api-keys",
    },
    {
      name: "Webhooks",
      value: stats.webhookCount,
      icon: BellIcon,
      change: "0%",
      trend: "neutral",
      href: "/admin/webhooks",
    },
    {
      name: "New Users (30d)",
      value: stats.newUsers,
      icon: DocumentTextIcon,
      change: "+12.5%",
      trend: "up",
      href: "/admin/users",
    },
  ];

  if (isLoading || statsLoading || usersLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {card.name}
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <button 
                  onClick={() => router.push(card.href)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </button>
              </div>
            </div>
            {card.trend !== "neutral" && (
              <div className="px-5 py-1 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center">
                  {card.trend === "up" ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span
                    className={`ml-1 text-xs font-medium ${
                      card.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {card.change}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Recently Added Users
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              List of the most recently added users to the platform.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Zcash Address
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Joined
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
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.email || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.zcashAddress ? 
                          <span className="truncate max-w-xs block">{user.zcashAddress}</span> : 
                          <span className="text-orange-500">Not Set</span>
                        }
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 