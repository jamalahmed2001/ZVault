import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopeIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { api } from "@/utils/api";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Request password reset mutation
  const requestResetMutation = api.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await requestResetMutation.mutateAsync({ email });
    } catch (err) {
      // Error is handled in onError callback
      console.error(err);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | ZVault ZPay</title>
        <meta name="description" content="Reset your ZPay account password" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center p-4" style={{ 
        backgroundColor: "var(--color-background-alt)", 
        color: "var(--color-foreground-dark)" 
      }}>
        <motion.div 
          className="w-full max-w-md"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div 
            className="text-center mb-8"
            variants={fadeInUp}
          >
            <Link href="/" className="inline-block">
              <div className="mb-6 flex justify-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-2xl font-bold" style={{ 
                  backgroundColor: "var(--color-primary)", 
                  color: "var(--color-accent)" 
                }}>Z</div>
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-primary)" }}>
              Reset Your Password
            </h1>
            <p style={{ color: "var(--color-foreground-dark-alt)" }}>
              {!isSubmitted 
                ? "Enter your email and we'll send you a link to reset your password." 
                : "Check your email for instructions to reset your password."}
            </p>
          </motion.div>

          <motion.div 
            className="shadow-xl rounded-xl overflow-hidden"
            style={{ 
              backgroundColor: "var(--color-surface-light)", 
              borderColor: "var(--color-border-light)",
              borderWidth: "1px" 
            }}
            variants={fadeInUp}
          >
            <div className="p-8">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  {error}
                </div>
              )}

              {!isSubmitted ? (
                /* Request Reset Form */
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: "var(--color-border-light)", 
                          borderWidth: "1px",
                          backgroundColor: "var(--color-surface-light)",
                          color: "var(--color-foreground-dark)",
                          "--tw-ring-color": "var(--color-accent)" 
                        } as React.CSSProperties}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={requestResetMutation.isPending}
                    className="w-full py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    {requestResetMutation.isPending ? "Sending..." : "Reset Password"}
                  </button>
                </form>
              ) : (
                /* Success Message */
                <div className="text-center py-4">
                  <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
                  <p className="mb-4" style={{ color: "var(--color-foreground-dark)" }}>
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm mb-4" style={{ color: "var(--color-foreground-dark-alt)" }}>
                    Please check your email and follow the instructions to reset your password. 
                    The link will expire in 1 hour.
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-foreground-dark-alt)" }}>
                    If you don't see the email, check your spam folder.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-6 flex justify-center"
            variants={fadeInUp}
          >
            <Link 
              href="/auth/login" 
              className="flex items-center text-sm font-medium hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Sign In
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
} 