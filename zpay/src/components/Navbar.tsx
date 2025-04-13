import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/router";

const Navbar = () => {
  const { data: sessionData } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAuth = () => {
    if (sessionData) {
      void signOut();
    } else {
      void router.push("/auth/login");
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-[var(--dark-navy-blue)] text-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold">
              ZVault <span className="text-[var(--light-pale-gold)]">ZPay</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            {/* <Link href="/#features" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Features
            </Link>
            <Link href="/#use-cases" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Use Cases
            </Link>
            <Link href="/pricing" className="font-medium hover:text-amber-200 transition-colors duration-200">
              Pricing
            </Link> */}

            <Link
              href="/"
              className="font-medium transition-colors duration-200 hover:text-[var(--light-pale-gold)]"
            >
              Home
            </Link>
            <Link
              href="/docs"
              className="font-medium transition-colors duration-200 hover:text-[var(--light-pale-gold)]"
            >
              Docs
            </Link>

            {sessionData && (
              <Link
                href="/account"
                className="font-medium transition-colors duration-200 hover:text-[var(--light-pale-gold)]"
              >
                <span className="flex items-center">
                  <UserCircleIcon className="mr-1 h-5 w-5" />
                  Account
                </span>
              </Link>
            )}

            {/* Auth Button */}
            <button
              onClick={handleAuth}
              className="rounded-lg bg-[var(--light-pale-gold)] px-5 py-2 font-semibold text-[var(--dark-navy-blue)] transition hover:bg-amber-300"
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
            className="mt-4 border-t border-blue-900 py-4 md:hidden"
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
                className="px-2 py-1 font-medium transition-colors duration-200 hover:text-[var(--light-pale-gold)]"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>

              {sessionData && (
                <Link
                  href="/account"
                  className="flex items-center px-2 py-1 font-medium transition-colors duration-200 hover:text-[var(--light-pale-gold)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserCircleIcon className="mr-1 h-5 w-5" />
                  Account
                </Link>
              )}

              <button
                onClick={handleAuth}
                className="w-full rounded-lg bg-[var(--light-pale-gold)] px-5 py-2 text-center font-semibold text-[var(--dark-navy-blue)] transition hover:bg-amber-300"
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
