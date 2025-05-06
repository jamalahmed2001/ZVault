import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { hash, compare } from "bcryptjs";
// import { sendEmail } from "@/utils/emailService";
import twilio from "twilio";
import crypto from "crypto";
import { sendEmail } from "@/utils/email"; // You'll need to implement this utility

// Initialize Twilio client with proper error handling
let twilioClient: twilio.Twilio | null = null;
let twilioPhoneNumber: string | null = null;

try {
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
    twilioPhoneNumber = process.env.TWILIO_NUMBER || null;
  } else {
    console.warn("Twilio credentials not found in environment variables");
  }
} catch (error) {
  console.error("Failed to initialize Twilio client:", error);
}

export const authRouter = createTRPCRouter({
  // Send OTP via SMS
  sendPhoneOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Check if Twilio is properly configured
        if (!twilioClient || !twilioPhoneNumber) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "SMS service is not configured",
          });
        }
        
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Send SMS via Twilio
        await twilioClient.messages.create({
          body: `Your UShop.bid verification code is: ${otp}`,
          from: twilioPhoneNumber,
          to: input.phoneNumber,
        });
        
        // In a real app, you would store this OTP in a database with an expiration
        // For this example, we'll return the OTP (in production, never return the actual OTP)
        return { 
          success: true, 
          message: "OTP sent successfully",
          // Only for development - remove in production:
          otp: process.env.NODE_ENV === "development" ? otp : undefined
        };
      } catch (error) {
        console.error("Failed to send OTP:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to send verification code",
        });
      }
    }),

  // Verify phone OTP
  verifyPhoneOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(10),
        otp: z.string().length(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // In a real app, you would verify against a stored OTP in your database
      // For this example, we'll simulate verification
      // This is where you would check if the OTP is valid and not expired
      
      // Simulating OTP verification
      const isValidOTP = true; // Replace with actual verification logic
      
      if (!isValidOTP) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }
      
      return { 
        success: true, 
        message: "Phone number verified successfully" 
      };
    }),

  // Registration
  registerUser: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        mobileNumber: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists.",
        });
      }

      // Hash password
      const hashedPassword = await hash(input.password, 10);

      // Generate a unique username (first name + random numbers)
      const usernameBase = input.firstName.toLowerCase().replace(/\s+/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${usernameBase}${randomSuffix}`;

      // Create user
      const user = await ctx.db.user.create({
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          password: hashedPassword, 
          phone: input.mobileNumber,
          username: username,
        },
      });

      // Create associated account
      await ctx.db.account.create({
        data: {
          id: user.id.toString(),
          userId: user.id,
          type: "credentials",
          provider: "credentials",
          access_token: null,
          expires_at: null,
          token_type: null,
          scope: null,
          id_token: null,
          session_state: null,
          refresh_token_expires_in: null,
          providerAccountId: user.id.toString(),
        },
      });

      // Store business information if applicable
      // Note: You might need to create a separate table for business info
      // This is a placeholder for where you would store business details

      try {
        // await sendEmail(input.email, 'WELCOME', {
        //   name: `${input.firstName} ${input.lastName}`,
        // });
      } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Continue with registration even if email fails
      }

      return { success: true, message: "User registered successfully" };
    }),

  // Get user profile
  getUserProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true,
            stripeCustomerId: true,
          }
        });
        
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        
        return user;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Failed to fetch user profile:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch user profile",
        });
      }
    }),

  // Update user settings
  updateUserSettings: protectedProcedure
    .input(
      z.object({
        zcashAddress: z.string().optional(),
        notificationsEnabled: z.boolean().optional(),
        stripeCustomerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedUser = await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            zcashAddress: input.zcashAddress,
            ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
            // In a real app, you might store notificationsEnabled in a separate table or column
          },
        });
        
        return { 
          success: true,
          message: "User settings updated successfully"
        };
      } catch (error) {
        console.error("Failed to update user settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update user settings",
        });
      }
    }),

  // Generate API Key
  generateApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        transactionFee: z.number().min(0).max(100).default(2.5),
        isLiveKey: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Determine key prefix based on whether it's a live or test key
        const apiKeyPrefix = input.isLiveKey ? "zv_live_" : "zv_test_";
        
        // Generate a cryptographically secure random API key using high entropy
        // Using 24 bytes (192 bits) of entropy for strong security
        const randomBytes = crypto.randomBytes(24);
        
        // Convert to URL-safe base64 string (removing padding)
        const randomPart = randomBytes.toString('base64url');
        
        // Create the final API key with prefix
        const apiKey = apiKeyPrefix + randomPart;
        
        // Validate the generated key meets minimum security requirements
        if (apiKey.length < 38) { // prefix (8) + at least 30 chars from base64url encoding
          throw new Error("Generated API key does not meet minimum security requirements");
        }
        
        // Save to database with transaction fee
        const savedKey = await ctx.db.apiKey.create({
          data: {
            key: apiKey,
            name: input.name || "Default API Key",
            userId: ctx.session.user.id,
            transactionFee: input.transactionFee,
          },
        });
        
        return { 
          success: true,
          apiKey: savedKey.key,
          id: savedKey.id
        };
      } catch (error) {
        console.error("Failed to generate API key:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate API key",
        });
      }
    }),

  // Delete API Key
  deleteApiKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure the API key belongs to the user
        const apiKey = await ctx.db.apiKey.findFirst({
          where: {
            id: input.id,
            userId: ctx.session.user.id,
          },
        });
        
        if (!apiKey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "API key not found",
          });
        }
        
        // Delete the API key
        await ctx.db.apiKey.delete({
          where: { id: input.id },
        });
        
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Failed to delete API key:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete API key",
        });
      }
    }),
    
  // Get user's API keys
  getApiKeys: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const apiKeys = await ctx.db.apiKey.findMany({
          where: {
            userId: ctx.session.user.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        return apiKeys;
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch API keys",
        });
      }
    }),
    

  // Request password reset
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { email } = input;
      
      // Find user by email
      const user = await ctx.db.user.findUnique({
        where: { email },
      });
      
      // Don't reveal if user exists or not for security
      if (!user) {
        // Still return success to avoid leaking user existence
        return { success: true };
      }
      
      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      
      // Set token expiry (1 hour)
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
      
      // Save token to database
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry,
        },
      });
      
      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;
      
      // Send email with reset link
      await sendEmail({
        to: user.email || "",
        subject: "ZPay Password Reset",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0a1930;">Reset Your ZPay Password</h2>
            <p>You requested a password reset for your ZPay account. Click the button below to create a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #0a1930; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Thanks,<br>The ZPay Team</p>
          </div>
        `,
      });
      
      return { success: true };
    }),

  // Verify reset token
  verifyResetToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { token } = input;
      
      // Hash the token
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      
      // Find user with this token
      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: tokenHash,
          resetTokenExpiry: { gt: new Date() },
        },
      });
      
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired password reset token",
        });
      }
      
      return { valid: true };
    }),

  // Reset password
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const { token, newPassword } = input;
      
      // Hash the token
      const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      
      // Find user with this token
      const user = await ctx.db.user.findFirst({
        where: {
          resetToken: tokenHash,
          resetTokenExpiry: { gt: new Date() },
        },
      });
      
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired password reset token",
        });
      }
      
      // Hash the new password
      const hashedPassword = await hash(newPassword, 10);
      
      // Update user with new password and clear reset token
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      
      return { success: true };
    }),

  // Check if user has an active Stripe subscription
  checkStripeSubscriptionActive: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeCustomerId: true },
    });
    if (!user?.stripeCustomerId) return { active: false };
    
    // Import Stripe and initialize
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });
    
    // List subscriptions for the customer
    const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: 'all', limit: 10 });
    // Check if any subscription is active or trialing
    const active = subs.data.some(sub => ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status));
    return { active };
  }),

}); 