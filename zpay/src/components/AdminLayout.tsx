import { useState, type ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  HomeIcon,
  UserIcon,
  KeyIcon,
  BellIcon,
  DocumentTextIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon as MenuIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { signOut, useSession } from "next-auth/react";
import { api } from "@/utils/api";
import Head from "next/head";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if the current user is an admin
  const { data: currentUser, isLoading: isUserLoading, isError } = api.admin.getUserById!.useQuery(
    { userId: session?.user?.id || "" },
    {
      enabled: !!session?.user?.id,
    }
  );

  // Handle user data and admin status
  useEffect(() => {
    if (currentUser) {
      if (currentUser.isAdmin) {
        setIsAdmin(true);
      } else {
        // Redirect non-admin users away from the admin area
        router.push('/');
      }
    } else if (isError && session?.user?.id) {
      // On error, assume user is not admin and redirect
      router.push('/');
    }
  }, [currentUser, isError, router, session?.user?.id]);

  // Enhanced navigation with ZCash section
  const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Users", href: "/admin/users", icon: UserIcon },
    { name: "API Keys", href: "/admin/api-keys", icon: KeyIcon },
    { name: "Transactions", href: "/admin/transactions", icon: CurrencyDollarIcon },
    { name: "Analytics", href: "/admin/analytics", icon: ChartBarIcon },
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/login?callbackUrl=/admin');
    }
  }, [status, router]);

  // Hide footer on admin pages
  useEffect(() => {
    const footer = document.querySelector('footer');
    
    // Hide footer when component mounts
    if (footer) footer.style.display = 'none';
    
    // Restore footer when component unmounts
    return () => {
      if (footer) footer.style.display = '';
    }
  }, []);

  // Show loading state while checking authentication and admin status
  if (status === "loading" || (session && !isAdmin && currentUser === undefined && !isError)) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title} | Admin Dashboard</title>
      </Head>
      
      {/* Admin Navigation Bar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-30 h-16 bg-[var(--dark-navy-blue)] text-white shadow-md">
        <div className="mx-auto px-6 py-3 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo and Navigation Elements */}
            <div className="flex items-center space-x-6">
              <Link href="/admin" className="flex items-center">
                <h1 className="text-2xl font-bold">
                  ZVault <span className="text-[var(--light-pale-gold)]">Admin</span>
                </h1>
              </Link>
              
              <Link href="/" className="flex items-center text-sm text-gray-300 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to Site
              </Link>
            </div>
            
            {/* Admin Badge and User Profile */}
            <div className="flex items-center space-x-4">
              {currentUser?.isAdmin && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Admin
                </span>
              )}
              
              <div className="flex items-center">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {session?.user?.name?.[0] || session?.user?.email?.[0] || "U"}
                  </div>
                )}
                <span className="ml-2 text-sm hidden md:inline-block">
                  {session?.user?.name || session?.user?.email || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main layout with fixed navbar height offset */}
      <div className="min-h-screen bg-gray-100 pt-16"> {/* Adjusted to match navbar height */}
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-4 border-b border-gray-200">
              <span className="text-lg font-medium text-gray-900">Admin Menu</span>
              <button
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto py-4">
              <nav className="flex-1 space-y-1 px-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium ${
                      router.pathname === item.href || 
                      (item.href !== '/admin' && router.pathname.startsWith(item.href))
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        router.pathname === item.href || 
                        (item.href !== '/admin' && router.pathname.startsWith(item.href))
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-indigo-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="group block w-full flex-shrink-0 text-left"
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Sign out</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop sidebar - Fixed position starting below navbar */}
        <div className="fixed top-16 bottom-0 left-0 hidden lg:flex lg:w-64 lg:flex-col">
          <div className="flex h-full flex-col border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 space-y-1 px-4 py-5">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      router.pathname === item.href || 
                      (item.href !== '/admin' && router.pathname.startsWith(item.href))
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        router.pathname === item.href || 
                        (item.href !== '/admin' && router.pathname.startsWith(item.href))
                          ? "text-indigo-600"
                          : "text-gray-400 group-hover:text-indigo-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="group flex w-full items-center text-left text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Main content area - Adjusted for fixed navbar and sidebar */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Title bar - Fixed below navbar */}
          <div className="sticky top-16 z-20 flex h-14 flex-shrink-0 bg-white shadow">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="flex flex-1 items-center justify-between px-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 p-6 pt-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
} 