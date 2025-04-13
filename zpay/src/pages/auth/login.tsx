import { useState } from "react";
import { signIn } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
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

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { callbackUrl } = router.query;
  const redirectUrl = typeof callbackUrl === 'string' ? callbackUrl : '/account';

  // Sign In form state
  const [signInCredentials, setSignInCredentials] = useState({
    email: "",
    password: ""
  });

  // Registration form state
  const [registrationData, setRegistrationData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobileNumber: ""
  });

  // Register user mutation
  const registerUserMutation = api.auth.registerUser.useMutation({
    onSuccess: async () => {
      // On successful registration, sign in the user
      const result = await signIn("credentials", {
        redirect: false,
        email: registrationData.email,
        password: registrationData.password,
      });
      
      if (!result?.error) {
        router.push(redirectUrl);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    }
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: signInCredentials.email,
        password: signInCredentials.password,
      });
      
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Redirect to account page on successful login
        router.push(redirectUrl);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the tRPC registerUser mutation
      await registerUserMutation.mutateAsync({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email,
        password: registrationData.password,
        mobileNumber: registrationData.mobileNumber
      });
      
      // No need to handle success here as it's handled in onSuccess callback
    } catch (err) {
      // Error handling is done in onError callback
      console.error(err);
    }
  };

  return (
    <>
      <Head>
        <title>{mode === "signin" ? "Sign In" : "Register"} | ZVault ZPay</title>
        <meta name="description" content="Sign in or create an account to use ZPay secure payment processing" />
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
              {mode === "signin" ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p style={{ color: "var(--color-foreground-dark-alt)" }}>
              {mode === "signin" 
                ? "Sign in to access your ZPay dashboard" 
                : "Join ZPay and start accepting private payments"}
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
            {/* Tab Navigation */}
            <div className="flex" style={{ borderBottom: "1px solid var(--color-border-light)" }}>
              <button 
                onClick={() => setMode("signin")}
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  mode === "signin" 
                    ? "border-b-2" 
                    : "hover:text-[var(--color-primary)]"
                }`}
                style={{ 
                  color: mode === "signin" ? "var(--color-primary)" : "var(--color-foreground-dark-alt)",
                  borderColor: mode === "signin" ? "var(--color-accent)" : "transparent"
                }}
              >
                Sign In
              </button>
              <button 
                onClick={() => setMode("register")}
                className={`w-1/2 py-4 text-center font-medium transition-colors ${
                  mode === "register" 
                    ? "border-b-2" 
                    : "hover:text-[var(--color-primary)]"
                }`}
                style={{ 
                  color: mode === "register" ? "var(--color-primary)" : "var(--color-foreground-dark-alt)",
                  borderColor: mode === "register" ? "var(--color-accent)" : "transparent"
                }}
              >
                Register
              </button>
            </div>

            <div className="p-8">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                  {error}
                </div>
              )}

              {mode === "signin" ? (
                /* Sign In Form */
                <form onSubmit={handleSignIn}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={signInCredentials.email}
                        onChange={(e) => setSignInCredentials({...signInCredentials, email: e.target.value})}
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

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block font-medium" style={{ color: "var(--color-foreground-dark)" }}>
                        Password
                      </label>
                      <Link href="/auth/forgot-password" className="text-sm hover:underline" style={{ color: "var(--color-accent)" }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={signInCredentials.password}
                        onChange={(e) => setSignInCredentials({...signInCredentials, password: e.target.value})}
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
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                  
                  <div className="mt-6 flex items-center">
                    <div className="flex-grow border-t" style={{ borderColor: "var(--color-border-light)" }}></div>
                    <span className="mx-4 text-sm" style={{ color: "var(--color-foreground-dark-alt)" }}>OR</span>
                    <div className="flex-grow border-t" style={{ borderColor: "var(--color-border-light)" }}></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: redirectUrl })}
                    className="w-full mt-6 border py-3 rounded-lg font-medium hover:bg-[rgba(10,25,48,0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
                    style={{ 
                      backgroundColor: "var(--color-surface-light)",
                      borderColor: "var(--color-border-light)", 
                      color: "var(--color-foreground-dark)",
                      "--tw-ring-color": "var(--color-foreground-dark-alt)"
                    } as React.CSSProperties}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegister}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="firstName" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                        First Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                        </div>
                        <input
                          id="firstName"
                          type="text"
                          value={registrationData.firstName}
                          onChange={(e) => setRegistrationData({...registrationData, firstName: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: "var(--color-border-light)", 
                            borderWidth: "1px",
                            backgroundColor: "var(--color-surface-light)",
                            color: "var(--color-foreground-dark)",
                            "--tw-ring-color": "var(--color-accent)" 
                          } as React.CSSProperties}
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                        Last Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                        </div>
                        <input
                          id="lastName"
                          type="text"
                          value={registrationData.lastName}
                          onChange={(e) => setRegistrationData({...registrationData, lastName: e.target.value})}
                          className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: "var(--color-border-light)", 
                            borderWidth: "1px",
                            backgroundColor: "var(--color-surface-light)",
                            color: "var(--color-foreground-dark)",
                            "--tw-ring-color": "var(--color-accent)" 
                          } as React.CSSProperties}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="regEmail" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="regEmail"
                        type="email"
                        value={registrationData.email}
                        onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
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
                  
                  <div className="mb-6">
                    <label htmlFor="mobileNumber" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PhoneIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="mobileNumber"
                        type="tel"
                        value={registrationData.mobileNumber}
                        onChange={(e) => setRegistrationData({...registrationData, mobileNumber: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: "var(--color-border-light)", 
                          borderWidth: "1px",
                          backgroundColor: "var(--color-surface-light)",
                          color: "var(--color-foreground-dark)",
                          "--tw-ring-color": "var(--color-accent)" 
                        } as React.CSSProperties}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="regPassword" className="block font-medium mb-2" style={{ color: "var(--color-foreground-dark)" }}>
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5" style={{ color: "var(--color-foreground-dark-alt)" }} />
                      </div>
                      <input
                        id="regPassword"
                        type={showPassword ? "text" : "password"}
                        value={registrationData.password}
                        onChange={(e) => setRegistrationData({...registrationData, password: e.target.value})}
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
                        minLength={6}
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
                      Password must be at least 6 characters
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center">
                      <input
                        id="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded"
                        style={{
                          borderColor: "var(--color-border-light)",
                          color: "var(--color-accent)",
                          "--tw-ring-color": "var(--color-accent)"
                        } as React.CSSProperties}
                      />
                      <label htmlFor="terms" className="ml-3 text-sm" style={{ color: "var(--color-foreground-dark)" }}>
                        I agree to the <Link href="/terms" className="hover:underline" style={{ color: "var(--color-accent)" }}>Terms of Service</Link> and <Link href="/privacy" className="hover:underline" style={{ color: "var(--color-accent)" }}>Privacy Policy</Link>
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading || registerUserMutation.isPending}
                    className="w-full py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-primary-foreground)",
                      "--tw-ring-color": "var(--color-primary)"
                    } as React.CSSProperties}
                  >
                    {isLoading || registerUserMutation.isPending ? "Creating Account..." : "Create Account"}
                  </button>
                  
                  <div className="mt-6 flex items-center">
                    <div className="flex-grow border-t" style={{ borderColor: "var(--color-border-light)" }}></div>
                    <span className="mx-4 text-sm" style={{ color: "var(--color-foreground-dark-alt)" }}>OR</span>
                    <div className="flex-grow border-t" style={{ borderColor: "var(--color-border-light)" }}></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: redirectUrl })}
                    className="w-full mt-6 border py-3 rounded-lg font-medium hover:bg-[rgba(10,25,48,0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
                    style={{ 
                      backgroundColor: "var(--color-surface-light)",
                      borderColor: "var(--color-border-light)", 
                      color: "var(--color-foreground-dark)",
                      "--tw-ring-color": "var(--color-foreground-dark-alt)"
                    } as React.CSSProperties}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </form>
              )}
            </div>
          </motion.div>
          
          <motion.p 
            className="text-center mt-8 text-sm"
            variants={fadeInUp}
            style={{ color: "var(--color-foreground-dark-alt)" }}
          >
            By using ZPay, you agree to our {" "}
            <Link href="/terms" className="hover:underline" style={{ color: "var(--color-accent)" }}>Terms of Service</Link> and {" "}
            <Link href="/privacy" className="hover:underline" style={{ color: "var(--color-accent)" }}>Privacy Policy</Link>.
          </motion.p>
        </motion.div>
      </main>
    </>
  );
}