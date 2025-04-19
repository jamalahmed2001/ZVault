import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const Navbar = () => {
  const { data: sessionData } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const [isAdminPage, setIsAdminPage] = useState(false);
  const [isHomePage, setIsHomePage] = useState(true);

  // Check if current page is admin page
  useEffect(() => {
    if (router.pathname.startsWith('/admin')) {
      setIsAdminPage(true);
    } else {
      setIsAdminPage(false);
    }
    
    // Check if we're on the homepage
    setIsHomePage(router.pathname === '/');
    
    // Initial check for scroll position
    setIsScrolled(window.scrollY > 10);
    
    // Add scroll listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [router.pathname]);

  // Don't render navbar on admin pages
  if (isAdminPage) {
    return null;
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAuth = () => {
    if (sessionData) {
      void signOut();
    } else {
      void router.push("/auth/login");
    }
  };

  // Determine navbar styling based on homepage and scroll state
  const navbarStyles = isHomePage && !isScrolled
    ? {
        background: 'transparent', 
        backdropFilter: 'blur(8px)',
        boxShadow: 'none',
        position: 'fixed' as const,
        width: '100%',
        zIndex: 50,
        transition: 'all 0.3s ease-in-out',
      } 
    : {
        background: 'var(--color-background)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px -1px rgba(0, 0, 0, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'fixed' as const,
        width: '100%',
        zIndex: 50,
        transition: 'all 0.3s ease-in-out',
      };

  return (
    <motion.nav 
      className="text-[var(--color-foreground)] transition-all duration-300"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={navbarStyles}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-7 w-7 mr-2 text-[var(--color-accent)]" />
              <h1 className="text-2xl font-bold">
                ZVault <span className="text-[var(--color-accent)]">ZPay</span>
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            <Link
              href="/"
              className="font-medium transition-colors duration-200 hover:text-[var(--color-accent)] flex items-center"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="font-medium transition-colors duration-200 hover:text-[var(--color-accent)] flex items-center"
            >
              <DocumentTextIcon className="h-5 w-5 mr-1" />
              Docs
            </Link>

            {sessionData && (
              <Link
                href="/account"
                className="font-medium transition-colors duration-200 hover:text-[var(--color-accent)] flex items-center"
              >
                <UserCircleIcon className="h-5 w-5 mr-1" />
                Account
              </Link>
            )}

            {/* Auth Button */}
            <button
              onClick={handleAuth}
              className="rounded-lg bg-[var(--color-accent)] px-5 py-2 font-semibold text-[var(--color-accent-foreground)] transition-all hover:shadow-lg hover:shadow-[var(--color-accent-transparent)] transform hover:-translate-y-0.5 duration-300"
            >
              {sessionData ? "Sign Out" : "Sign In"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            className="mt-4 bg-[var(--color-surface)] rounded-lg shadow-xl p-4 md:hidden absolute left-0 right-0 mx-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="px-2 py-1 rounded-md font-medium transition-all duration-200 hover:bg-[var(--color-accent-transparent)] hover:text-[var(--color-accent)] flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/docs"
                className="px-2 py-1 rounded-md font-medium transition-all duration-200 hover:bg-[var(--color-accent-transparent)] hover:text-[var(--color-accent)] flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <DocumentTextIcon className="h-5 w-5 mr-1" />
                Docs
              </Link>

              {sessionData && (
                <Link
                  href="/account"
                  className="px-2 py-1 rounded-md font-medium transition-all duration-200 hover:bg-[var(--color-accent-transparent)] hover:text-[var(--color-accent)] flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5 mr-1" />
                  Account
                </Link>
              )}

              <button
                onClick={handleAuth}
                className="w-full rounded-lg bg-[var(--color-accent)] px-5 py-2 text-center font-semibold text-[var(--color-accent-foreground)] transition-all hover:shadow-lg"
              >
                {sessionData ? "Sign Out" : "Sign In"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
