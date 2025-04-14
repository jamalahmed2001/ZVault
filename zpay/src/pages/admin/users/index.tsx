import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/utils/api";
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  KeyIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ClipboardIcon,
  ArrowPathIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

type User = {
  id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  zcashAddress: string | null;
  isAdmin: boolean;
  createdAt: Date;
  apiKeys?: ApiKey[];
  webhookConfig?: WebhookConfig | null;
};

type ApiKey = {
  id: string;
  key?: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
};

type WebhookConfig = {
  id: string;
  url: string;
  secret?: string;
  isActive: boolean;
};

type UserFormData = {
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  phone?: string;
  zcashAddress?: string;
  isAdmin: boolean;
  password?: string;
};

type EditTab = "profile" | "zcash" | "apikeys" | "webhooks";

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone: "",
    zcashAddress: "",
    isAdmin: false,
    password: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  const [activeTab, setActiveTab] = useState<EditTab>("profile");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyName, setApiKeyName] = useState("Default API Key");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookCopied, setWebhookCopied] = useState(false);

  const [userApiKeys, setUserApiKeys] = useState<ApiKey[]>([]);
  const [userWebhook, setUserWebhook] = useState<WebhookConfig | null>(null);

  // API hooks
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = 
    api.admin.getAllUsers.useQuery();

  const utils = api.useContext();
  const createUserMutation = api.admin.createUser.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      closeModal();
    },
  });

  const updateUserMutation = api.admin.updateUser.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      closeModal();
    },
  });

  const deleteUserMutation = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
    },
  });

  const resetPasswordMutation = api.admin.resetUserPassword.useMutation({
    onSuccess: () => {
      setIsPasswordModalOpen(false);
      setNewPassword("");
    },
  });

  const toggleAdminMutation = api.admin.toggleAdminStatus.useMutation({
    onSuccess: () => {
      void refetchUsers();
    },
  });

  // API key and webhook mutations
  const generateApiKeyMutation = api.auth.generateApiKey.useMutation({
    onSuccess: (data: { apiKey: string }) => {
      setApiKey(data.apiKey);
      utils.admin.getAllUsers.invalidate();
    },
  });

  const deleteApiKeyMutation = api.auth.deleteApiKey.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
    },
  });

  const saveWebhookMutation = api.auth.saveWebhookConfig.useMutation({
    onSuccess: () => {
      utils.admin.getAllUsers.invalidate();
      closeModal();
    },
  });

  const generateWebhookSecretMutation = api.auth.generateWebhookSecret.useMutation({
    onSuccess: (data: { secret: string }) => {
      setWebhookSecret(data.secret);
    },
  });

  // Update users when data changes
  useEffect(() => {
    if (usersData) {
      setUsers(usersData as User[]);
      setIsLoading(false);
    }
  }, [usersData]);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchableFields = [
      user.email,
      user.username,
      user.first_name,
      user.last_name,
      user.phone,
      user.zcashAddress,
    ];
    
    return searchableFields.some(
      (field) => field && field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Utility functions for API Keys and Webhooks
  const copyToClipboard = (text: string, setCopiedState: (copied: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };
  
  const generateApiKey = () => {
    if (selectedUser) {
      generateApiKeyMutation.mutate({ name: apiKeyName });
    }
  };
  
  const generateWebhookSecret = () => {
    if (selectedUser) {
      generateWebhookSecretMutation.mutate();
    }
  };
  
  const saveWebhook = () => {
    if (selectedUser && webhookUrl) {
      saveWebhookMutation.mutate({
        url: webhookUrl,
        secret: webhookSecret
      });
    }
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleAddUser = () => {
    setModalMode("create");
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      phone: "",
      zcashAddress: "",
      isAdmin: false,
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setActiveTab("profile");
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      username: user.username || "",
      phone: user.phone || "",
      zcashAddress: user.zcashAddress || "",
      isAdmin: user.isAdmin,
    });
    
    // Reset API key and webhook states
    setApiKey("");
    setApiKeyName("Default API Key");
    setWebhookUrl("");
    setWebhookSecret("");
    setUserApiKeys([]);
    setUserWebhook(null);
    
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleToggleAdmin = (userId: string) => {
    toggleAdminMutation.mutate({ userId });
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate({ userId: selectedUser.id });
    }
  };

  const confirmResetPassword = () => {
    if (selectedUser && newPassword) {
      resetPasswordMutation.mutate({
        userId: selectedUser.id,
        newPassword,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalMode === "create") {
      if (!formData.password) {
        alert("Password is required when creating a new user");
        return;
      }
      createUserMutation.mutate(formData as Required<UserFormData>);
    } else if (selectedUser) {
      // Remove password from update data
      const { password, ...updateData } = formData;
      updateUserMutation.mutate({
        userId: selectedUser.id,
        data: updateData,
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Add a query hook to fetch user details
  const { data: userDetails } = api.admin.getUserById.useQuery(
    { userId: selectedUser?.id || "" },
    { enabled: !!selectedUser && isModalOpen }
  );

  // Add a useEffect hook to update state when user details are loaded
  useEffect(() => {
    if (userDetails) {
      if (userDetails.apiKeys) {
        setUserApiKeys(userDetails.apiKeys);
      }
      
      if (userDetails.webhookConfig) {
        setUserWebhook(userDetails.webhookConfig);
        setWebhookUrl(userDetails.webhookConfig.url || "");
        setWebhookSecret(userDetails.webhookConfig.secret || "");
      }
    }
  }, [userDetails]);

  if (isLoading) {
    return (
      <AdminLayout title="User Management">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Management">
      {/* Header with search and add button */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="w-full sm:w-64 mb-4 sm:mb-0">
          <label htmlFor="search" className="sr-only">
            Search users
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              id="search"
              name="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search users"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddUser}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ZCash Address
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  API Key
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Webhook
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.username || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.zcashAddress ? (
                        <span className="text-sm text-gray-900 truncate block max-w-[150px]">
                          {user.zcashAddress}
                        </span>
                      ) : (
                        <span className="text-sm text-orange-500">Not Set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.apiKeys && user.apiKeys.length > 0 && user.apiKeys[0]?.key ? (
                        <div className="group relative">
                          <span className="text-sm text-gray-900 truncate block max-w-[120px] cursor-pointer" 
                                onClick={() => copyToClipboard(user.apiKeys![0]!.key!, setApiKeyCopied)}>
                            {user.apiKeys[0]!.key.substring(0, 10)}...
                          </span>
                          <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -mt-1 left-0">
                            {user.apiKeys[0]!.key}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-orange-500">Not Set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.webhookConfig && user.webhookConfig.url ? (
                        <div className="group relative">
                          <span className="text-sm text-gray-900 truncate block max-w-[120px] cursor-pointer"
                                title={user.webhookConfig.url}>
                            {user.webhookConfig.url.substring(0, 15)}...
                          </span>
                          <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-800 text-white text-xs rounded shadow-lg -mt-1 left-0">
                            {user.webhookConfig.url}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-orange-500">Not Set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAdmin(user.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isAdmin
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                        title={user.isAdmin ? "Remove admin rights" : "Make admin"}
                      >
                        {user.isAdmin ? (
                          <>
                            <ShieldCheckIcon className="mr-1 h-4 w-4" />
                            Admin
                          </>
                        ) : (
                          <>
                            <ShieldExclamationIcon className="mr-1 h-4 w-4" />
                            User
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            handleEditUser(user);
                            setActiveTab("zcash");
                          }}
                          title="Manage ZCash Address"
                          className="text-orange-500 hover:text-orange-700"
                        >
                          <CurrencyDollarIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            handleEditUser(user);
                            setActiveTab("apikeys");
                          }}
                          title="Manage API Keys"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            handleEditUser(user);
                            setActiveTab("webhooks");
                          }}
                          title="Manage Webhooks"
                          className="text-purple-500 hover:text-purple-700"
                        >
                          <BellIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          title="Reset Password"
                          className="text-gray-400 hover:text-indigo-700"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={closeModal}>
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
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {modalMode === "create" ? "Add New User" : "Edit User"}
                </Dialog.Title>
                
                {modalMode === "edit" && (
                  <div className="mt-3 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab("profile")}
                        className={`pb-3 px-1 ${
                          activeTab === "profile"
                            ? "border-b-2 border-indigo-500 text-indigo-600"
                            : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setActiveTab("zcash")}
                        className={`pb-3 px-1 ${
                          activeTab === "zcash"
                            ? "border-b-2 border-indigo-500 text-indigo-600"
                            : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        ZCash
                      </button>
                      <button
                        onClick={() => setActiveTab("apikeys")}
                        className={`pb-3 px-1 ${
                          activeTab === "apikeys"
                            ? "border-b-2 border-indigo-500 text-indigo-600"
                            : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        API Keys
                      </button>
                      <button
                        onClick={() => setActiveTab("webhooks")}
                        className={`pb-3 px-1 ${
                          activeTab === "webhooks"
                            ? "border-b-2 border-indigo-500 text-indigo-600"
                            : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        Webhooks
                      </button>
                    </nav>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                  {modalMode === "create" || activeTab === "profile" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          id="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          id="last_name"
                          required
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="zcashAddress" className="block text-sm font-medium text-gray-700">
                      ZCash Address
                    </label>
                    <input
                      type="text"
                      name="zcashAddress"
                      id="zcashAddress"
                      value={formData.zcashAddress}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  {modalMode === "create" && (
                    <div className="mt-4">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        required={modalMode === "create"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center">
                    <input
                      id="isAdmin"
                      name="isAdmin"
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                      Admin User
                    </label>
                  </div>

                  {modalMode === "create" || activeTab === "profile" ? (
                    <>
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {modalMode === "create" ? "Create" : "Save Changes"}
                        </button>
                      </div>
                    </>
                  ) : activeTab === "zcash" ? (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <CurrencyDollarIcon className="h-5 w-5 text-indigo-500" />
                        <h4 className="text-md font-medium text-gray-900">ZCash Address Management</h4>
                      </div>
                      
                      <div className="mt-4">
                        <label htmlFor="zcashAddress" className="block text-sm font-medium text-gray-700">
                          ZCash Address
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            name="zcashAddress"
                            id="zcashAddress"
                            value={formData.zcashAddress}
                            onChange={handleInputChange}
                            placeholder="zs1..."
                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          This address will be used for all payments to this user.
                        </p>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedUser) {
                              updateUserMutation.mutate({
                                userId: selectedUser.id,
                                data: { zcashAddress: formData.zcashAddress }
                              });
                            }
                          }}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save ZCash Address
                        </button>
                      </div>
                    </div>
                  ) : activeTab === "apikeys" ? (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <KeyIcon className="h-5 w-5 text-indigo-500" />
                        <h4 className="text-md font-medium text-gray-900">API Key Management</h4>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Generate New API Key</h5>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={apiKeyName}
                            onChange={(e) => setApiKeyName(e.target.value)}
                            placeholder="API Key Name"
                            className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={generateApiKey}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <KeyIcon className="h-4 w-4 mr-2" />
                            Generate
                          </button>
                        </div>
                        
                        {apiKey && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                New API Key
                              </label>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(apiKey, setApiKeyCopied)}
                                className="inline-flex items-center text-xs text-indigo-600"
                              >
                                {apiKeyCopied ? (
                                  <>
                                    <CheckIcon className="h-4 w-4 mr-1" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <ClipboardIcon className="h-4 w-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-md font-mono text-xs overflow-x-auto">
                              {apiKey}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Store this key securely. You won't be able to see it again.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {userApiKeys && userApiKeys.length > 0 && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Existing API Keys</h5>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {userApiKeys.map((key) => (
                              <div key={key.id} className="border border-gray-200 rounded-md p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-700">
                                    {key.name || "Unnamed Key"}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {new Date(key.createdAt).toLocaleDateString()}
                                    </span>
                                    {key.key && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(key.key!, setApiKeyCopied)}
                                        className="text-indigo-600 hover:text-indigo-800"
                                        title="Copy API Key"
                                      >
                                        <ClipboardIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => deleteApiKeyMutation.mutate({ id: key.id })}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete API Key"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                {key.key && (
                                  <div className="bg-gray-50 p-2 rounded-md font-mono text-xs overflow-x-auto mt-1">
                                    {key.key}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <BellIcon className="h-5 w-5 text-indigo-500" />
                        <h4 className="text-md font-medium text-gray-900">Webhook Configuration</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">
                            Webhook URL
                          </label>
                          <input
                            type="url"
                            id="webhookUrl"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="https://example.com/webhooks/zpay"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            URL where payment notifications will be sent.
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700">
                              Webhook Secret
                            </label>
                            <button
                              type="button"
                              onClick={generateWebhookSecret}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Generate New Secret
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              id="webhookSecret"
                              value={webhookSecret}
                              readOnly
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(webhookSecret, setWebhookCopied)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              title={webhookCopied ? "Copied!" : "Copy to clipboard"}
                            >
                              {webhookCopied ? (
                                <CheckIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <ClipboardIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            This secret is used to verify webhook authenticity.
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveWebhook}
                          disabled={!webhookUrl}
                          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                          Save Webhook
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setIsDeleteModalOpen(false)}>
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
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Delete User
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}? This action cannot be undone.
                  </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Reset Password Modal */}
      <Transition appear show={isPasswordModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => setIsPasswordModalOpen(false)}>
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
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Reset Password
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    Set a new password for {selectedUser?.first_name} {selectedUser?.last_name}.
                  </p>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    minLength={8}
                    required
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmResetPassword}
                    disabled={!newPassword || newPassword.length < 8}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </AdminLayout>
  );
} 