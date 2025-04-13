import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { data: sessionData } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAuth = () => {
    if (sessionData) {
      void signOut();
    } else {
      void router.push('/auth/login');
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-blue-950 text-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold">ZVault <span className="text-amber-200">ZPay</span></h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* <Link href="/#features" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Features
            </Link>
            <Link href="/#use-cases" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Use Cases
            </Link>
            <Link href="/pricing" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Pricing
            </Link> */}
            <Link href="/docs" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Docs
            </Link>

            {sessionData && (
              <Link href="/account" className="font-medium hover:text-amber-200 transition-colors duration-200">
                <span className="flex items-center">
                  <UserCircleIcon className="h-5 w-5 mr-1" />
                  Account
                </span>
              </Link>
            )}

            {/* Auth Button */}
            <button
              onClick={handleAuth}
              className="rounded-lg bg-amber-200 px-5 py-2 font-semibold text-blue-900 transition hover:bg-amber-300"
            >
              {sessionData ? "Sign Out" : "Sign In"}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
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
            className="md:hidden mt-4 py-4 border-t border-blue-900"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col space-y-4">
              {/* <Link 
                href="/#features" 
                className="px-2 py-1 font-medium hover:text-amber-200 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/#use-cases" 
                className="px-2 py-1 font-medium hover:text-amber-200 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Use Cases
              </Link>
              <Link 
                href="/pricing" 
                className="px-2 py-1 font-medium hover:text-amber-200 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link> */}
              <Link 
                href="/docs" 
                className="px-2 py-1 font-medium hover:text-amber-200 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>
              
              {sessionData && (
                <Link 
                  href="/account" 
                  className="px-2 py-1 font-medium hover:text-amber-200 transition-colors duration-200 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5 mr-1" />
                  Account
                </Link>
              )}
              
              <button
                onClick={handleAuth}
                className="w-full text-center rounded-lg bg-amber-200 px-5 py-2 font-semibold text-blue-950 transition hover:bg-amber-300"
              >
                {sessionData ? "Sign Out" : "Sign In"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 