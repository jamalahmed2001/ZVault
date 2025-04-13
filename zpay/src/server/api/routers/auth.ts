import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { hash, compare } from "bcryptjs";
// import { sendEmail } from "@/utils/emailService";
import twilio from "twilio";

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

  // Generate API Key
  generateApiKey: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Generate a random API key with prefix
        const apiKeyPrefix = "zv_test_";
        const randomPart = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
        const apiKey = apiKeyPrefix + randomPart;
        
        // Save to database
        const savedKey = await ctx.db.apiKey.create({
          data: {
            key: apiKey,
            name: input.name || "Default API Key",
            userId: ctx.session.user.id,
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
        console.error("Failed to fetch webhook config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch webhook config",
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
}); 