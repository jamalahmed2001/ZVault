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
            zcashAddress: true,
            webhookConfig: true
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedUser = await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            zcashAddress: input.zcashAddress,
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
    
  // Update webhook configuration
  updateWebhookConfig: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        secret: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate a webhook secret if not provided
        const secret = input.secret || 
          `whsec_${Math.random().toString(36).substring(2, 15)}`;
        
        // Upsert webhook config (update if exists, create if not)
        const webhookConfig = await ctx.db.webhookConfig.upsert({
          where: {
            userId: ctx.session.user.id,
          },
          update: {
            url: input.url,
            secret: input.secret ? input.secret : undefined, // Only update if provided
          },
          create: {
            url: input.url,
            secret,
            userId: ctx.session.user.id,
          },
        });
        
        return { 
          success: true,
          webhookConfig: {
            url: webhookConfig.url,
            secret: webhookConfig.secret,
          }
        };
      } catch (error) {
        console.error("Failed to update webhook config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update webhook config",
        });
      }
    }),
    
  // Get webhook configuration
  getWebhookConfig: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const webhookConfig = await ctx.db.webhookConfig.findUnique({
          where: {
            userId: ctx.session.user.id,
          },
        });
        
        return webhookConfig;
      } catch (error) {
        console.error("Failed to fetch webhook configuration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch webhook configuration",
        });
      }
    }),
    
  // Test webhook
  testWebhook: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const webhookConfig = await ctx.db.webhookConfig.findUnique({
          where: {
            userId: ctx.session.user.id,
          },
        });
        
        if (!webhookConfig) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No webhook configuration found",
          });
        }
        
        // In a real implementation, you would actually send a test call
        // to the webhook URL and validate the response
        // This is a simplified example
        
        // Simulate webhook test
        const testSuccessful = true; // In reality, you would check the response
        
        return { 
          success: testSuccessful,
          message: testSuccessful 
            ? "Webhook test successful! Your endpoint responded with a 200 OK status." 
            : "Webhook test failed. Your endpoint returned an error or timed out."
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Failed to test webhook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to test webhook",
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

  // Generate Webhook Secret
  generateWebhookSecret: protectedProcedure
    .mutation(async () => {
      try {
        // Generate a highly secure webhook secret with prefix
        // Using 32 bytes (256 bits) of entropy for strong security
        const secretPrefix = "whsec_";
        
        // Generate cryptographically secure random bytes
        const randomBytes = crypto.randomBytes(32);
        
        // Convert to URL-safe base64 string (removing padding)
        const randomPart = randomBytes.toString('base64url');
        
        // Create the final webhook secret
        const secret = secretPrefix + randomPart;
        
        // Validate the generated secret meets minimum security requirements
        if (secret.length < 45) { // prefix (6) + at least 39 chars from base64url encoding
          throw new Error("Generated webhook secret does not meet minimum security requirements");
        }
        
        return { 
          success: true,
          secret: secret
        };
      } catch (error) {
        console.error("Failed to generate webhook secret:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate webhook secret",
        });
      }
    }),

  // Save Webhook Configuration
  saveWebhookConfig: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        secret: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the user already has a webhook configuration
        const existingConfig = await ctx.db.webhookConfig.findUnique({
          where: {
            userId: ctx.session.user.id,
          },
        });
        
        let webhookConfig;
        
        if (existingConfig) {
          // Update existing configuration
          webhookConfig = await ctx.db.webhookConfig.update({
            where: {
              id: existingConfig.id,
            },
            data: {
              url: input.url,
              secret: input.secret,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new configuration
          webhookConfig = await ctx.db.webhookConfig.create({
            data: {
              url: input.url,
              secret: input.secret,
              userId: ctx.session.user.id,
            },
          });
        }
        
        return { 
          success: true,
          webhookConfig: webhookConfig
        };
      } catch (error) {
        console.error("Failed to save webhook configuration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to save webhook configuration",
        });
      }
    }),

  // Get user transactions with filtering options
  getTransactions: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        clientUserId: z.string().optional(),
        invoiceId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(), // For pagination
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      try {
        const filters: any = {
          userId: ctx.session.user.id,
        };

        // Apply filters if provided
        if (input?.status) {
          filters.status = input.status;
        }

        if (input?.clientUserId) {
          filters.clientUserId = input.clientUserId;
        }

        if (input?.invoiceId) {
          filters.invoiceId = input.invoiceId;
        }

        // Date range filter
        if (input?.startDate || input?.endDate) {
          filters.createdAt = {};
          
          if (input?.startDate) {
            filters.createdAt.gte = input.startDate;
          }
          
          if (input?.endDate) {
            filters.createdAt.lte = input.endDate;
          }
        }

        // Setup for cursor-based pagination
        const take = input?.limit ?? 20;
        const cursor = input?.cursor ? { id: input.cursor } : undefined;

        // Fetch transactions with filters and pagination
        const transactions = await ctx.db.transaction.findMany({
          where: filters,
          take: take + 1, // Get one extra to know if there are more
          cursor,
          orderBy: {
            createdAt: input?.sortDirection ?? "desc",
          },
        });

        // Check if there are more results
        let nextCursor: string | undefined = undefined;
        if (transactions.length > take) {
          const nextItem = transactions.pop();
          nextCursor = nextItem?.id;
        }

        return { 
          transactions,
          nextCursor,
          totalCount: await ctx.db.transaction.count({ where: filters }),
        };
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transactions",
        });
      }
    }),

}); 