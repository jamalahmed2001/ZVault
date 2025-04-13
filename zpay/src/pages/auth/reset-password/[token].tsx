import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { LockClosedIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from "next/router";
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

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verify token query
  const verifyTokenQuery = api.auth.verifyResetToken.useQuery(
    { token: token as string },
    { 
      enabled: !!token,
      retry: false
    }
  );

  // Handle token verification errors
  useEffect(() => {
    if (verifyTokenQuery.error) {
      console.error(verifyTokenQuery.error);
      setIsValidToken(false);
    }
  }, [verifyTokenQuery.error]);

  // Reset password mutation
  const resetPasswordMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      setError(null);
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    try {
      await resetPasswordMutation.mutateAsync({
        token: token as string,
        newPassword: password
      });
    } catch (err) {
      // Error is handled in onError callback
      console.error(err);
    }
  };

  // Loading state while verifying token
  if (verifyTokenQuery.isPending) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4" style={{ 
        backgroundColor: "var(--color-background-alt)", 
        color: "var(--color-foreground-dark)" 
      }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" 
            style={{ borderColor: "var(--color-accent) transparent var(--color-accent) transparent" }}
            role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4" style={{ color: "var(--color-foreground-dark)" }}>Verifying your reset link...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password | ZVault ZPay</title>
        <meta name="description" content="Create a new password for your ZPay account" />
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
              {isValidToken ? "Create New Password" : "Invalid or Expired Link"}
            </h1>
            <p style={{ color: "var(--color-foreground-dark-alt)" }}>
              {isValidToken ? (
                isSuccess ? "Password has been successfully reset." : "Create a new secure password for your ZPay account."
              ) : (
                "The password reset link is invalid or has expired."
              )}
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

              {!isValidToken ? (
                /* Invalid Token */
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--color-error)" }} />
                  <p className="mb-4" style={{ color: "var(--color-foreground-dark)" }}>
                    This password reset link is no longer valid.
                  </p>
                  <p className="text-sm mb-6" style={{ color: "var(--color-foreground-dark-alt)" }}>
                    It may have expired or already been used. Please request a new password reset link.
                  </p>
                  <Link
                    href="/auth/forgot-password"
                    className="inline-block py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    Request New Link
                  </Link>
                </div>
              ) : isSuccess ? (
                /* Success Message */
                <div className="text-center py-4">
                  <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" style={{ color: "var(--color-accent)" }} />
                  <p className="mb-4" style={{ color: "var(--color-foreground-dark)" }}>
                    Your password has been successfully reset!
                  </p>
                  <p className="text-sm mb-6" style={{ color: "var(--color-foreground-dark-alt)" }}>
                    You will be redirected to the login page in a few seconds.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block py-3 px-6 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    Sign In Now
                  </Link>
                </div>
              ) : (
                /* Reset Password Form */
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="password" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: "var(--color-border-light)", 
                          borderWidth: "1px",
                          backgroundColor: "var(--color-surface-light)",
                          color: "var(--color-foreground-dark)",
                          "--tw-ring-color": "var(--color-accent)" 
                        } as React.CSSProperties}
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-[var(--color-primary)]"
                        style={{ color: "var(--color-foreground-dark-alt)" }}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-foreground-dark-alt)" }}>
                      Password must be at least 8 characters
                    </p>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: "var(--color-border-light)", 
                          borderWidth: "1px",
                          backgroundColor: "var(--color-surface-light)",
                          color: "var(--color-foreground-dark)",
                          "--tw-ring-color": "var(--color-accent)" 
                        } as React.CSSProperties}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    {resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}
                  </button>
                </form>
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