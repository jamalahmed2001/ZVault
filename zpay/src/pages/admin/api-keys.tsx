'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import { KeyIcon, CheckIcon, XMarkIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Image from "next/image";
export default function AdminApiKeys() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const { data, isLoading, refetch } = api.admin.getAllApiKeys.useQuery({ page, limit });
  const toggleStatus = api.admin.toggleApiKeyStatus.useMutation({
    onSuccess: () => refetch(),
  });
  const updateApiKey = api.admin.updateApiKey.useMutation({
    onSuccess: () => {
      setEditingId(null);
      refetch();
    },
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});

  const startEdit = (key: any) => {
    setEditingId(key.id);
    setEditFields({
      name: key.name || "",
      transactionFee: key.transactionFee !== undefined ? Number(key.transactionFee) : 0,
      usageLimit: key.usageLimit !== undefined ? Number(key.usageLimit) : 0,
      totalUsage: key.totalUsage !== undefined ? Number(key.totalUsage) : 0,
      monthlyUsage: key.monthlyUsage !== undefined ? Number(key.monthlyUsage) : 0,
      isActive: key.isActive ?? true,
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditFields({});
  };
  const saveEdit = (id: string) => {
    updateApiKey.mutate({ id, data: editFields });
  };
  const handleField = (field: string, value: any) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    refetch();
  }, [page, refetch]);

  return (
    <AdminLayout title="API Key Management">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Fee (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : data?.apiKeys?.length ? (
              data.apiKeys.map((key: any) => (
                <tr key={key.id}>
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-xs">
                    {key.key ? key.key.substring(0, 10) + '...' : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {editingId === key.id ? (
                      <input
                        type="text"
                        className="w-32 px-1 py-0.5 border rounded text-xs"
                        value={editFields.name}
                        onChange={e => handleField('name', e.target.value)}
                      />
                    ) : (
                      key.name || 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {key.user ? (
                      <span>{key.user.first_name} {key.user.last_name} <span className="text-xs text-gray-400">({key.user.email})</span></span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {key.user?.image ? (
                      <Image src={key.user.image} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === key.id ? (
                      <input
                        type="number"
                        className="w-20 px-1 py-0.5 border rounded text-xs"
                        value={editFields.transactionFee}
                        min={0}
                        max={100}
                        step={0.01}
                        onChange={e => handleField('transactionFee', Number(e.target.value))}
                      />
                    ) : (
                      key.transactionFee !== undefined ? Number(key.transactionFee).toFixed(2) : 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{key.createdAt ? new Date(key.createdAt).toLocaleString() : 'N/A'}</td>
                  <td className="px-4 py-3 text-xs">{key.updatedAt ? new Date(key.updatedAt).toLocaleString() : 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    {editingId === key.id ? (
                      <input
                        type="number"
                        className="w-20 px-1 py-0.5 border rounded text-xs"
                        value={editFields.totalUsage}
                        min={0}
                        onChange={e => handleField('totalUsage', Number(e.target.value))}
                      />
                    ) : (
                      key.totalUsage !== undefined ? key.totalUsage : 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === key.id ? (
                      <input
                        type="number"
                        className="w-20 px-1 py-0.5 border rounded text-xs"
                        value={editFields.monthlyUsage}
                        min={0}
                        onChange={e => handleField('monthlyUsage', Number(e.target.value))}
                      />
                    ) : (
                      key.monthlyUsage !== undefined ? key.monthlyUsage : 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === key.id ? (
                      <input
                        type="number"
                        className="w-20 px-1 py-0.5 border rounded text-xs"
                        value={editFields.usageLimit}
                        min={0}
                        onChange={e => handleField('usageLimit', Number(e.target.value))}
                      />
                    ) : (
                      key.usageLimit !== undefined ? key.usageLimit : 'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === key.id ? (
                      <select
                        className="w-20 px-1 py-0.5 border rounded text-xs"
                        value={editFields.isActive ? 'active' : 'disabled'}
                        onChange={e => handleField('isActive', e.target.value === 'active')}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    ) : (
                      key.isActive ? (
                        <span className="inline-flex items-center text-green-600"><CheckIcon className="h-4 w-4 mr-1" />Active</span>
                      ) : (
                        <span className="inline-flex items-center text-red-600"><XMarkIcon className="h-4 w-4 mr-1" />Disabled</span>
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === key.id ? (
                      <>
                        <button
                          className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 mr-1"
                          onClick={() => saveEdit(key.id)}
                          disabled={updateApiKey.status === 'pending'}
                        >
                          <CheckIcon className="h-4 w-4 inline" /> Save
                        </button>
                        <button
                          className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          onClick={cancelEdit}
                          disabled={updateApiKey.status === 'pending'}
                        >
                          <XMarkIcon className="h-4 w-4 inline" /> Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                        onClick={() => startEdit(key)}
                      >
                        <PencilIcon className="h-4 w-4 inline" /> Edit
                      </button>
                    )}
                    <button
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${key.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                      onClick={() => toggleStatus.mutate({ id: key.id })}
                      disabled={editingId === key.id}
                    >
                      {key.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="py-8 text-center text-gray-500">No API keys found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data?.pagination && (
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
} 