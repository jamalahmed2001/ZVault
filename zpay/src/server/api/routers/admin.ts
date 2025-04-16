import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";

// Create an admin middleware
const isAdmin = (userId: string) => {
  // In a real application, you would check the database to see if the user is an admin
  // For now, we'll implement a simple check
  return async ({ ctx }: { ctx: { db: any } }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Only admins can access this resource",
      });
    }
  };
};

// Admin procedure - only accessible to admin users
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only admins can access this resource",
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Add admin-specific context here if needed
    },
  });
});

export const adminRouter = createTRPCRouter({
  // Get all users
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    try {
      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          phone: true,
          zcashAddress: true,
          isAdmin: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          apiKeys: {
            select: {
              id: true,
              key: true,
              name: true,
              isActive: true,
              createdAt: true,
            },
          },
          webhookConfig: {
            select: {
              url: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return users;
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch users",
      });
    }
  }),

  // Get user by ID
  getUserById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true,
            zcashAddress: true,
            isAdmin: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            apiKeys: {
              select: {
                id: true,
                key: true,
                name: true,
                isActive: true,
                createdAt: true,
                transactionFee: true,
              },
            },
            webhookConfig: {
              select: {
                id: true,
                url: true,
                secret: true,
                isActive: true,
              },
            },
          },
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
        console.error("Failed to fetch user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch user",
        });
      }
    }),

  // Update user
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        data: z.object({
          email: z.string().email().optional(),
          username: z.string().min(3).optional(),
          first_name: z.string().min(1).optional(),
          last_name: z.string().min(1).optional(),
          phone: z.string().optional(),
          zcashAddress: z.string().optional(),
          isAdmin: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user exists
        const userExists = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Check for unique email and username if updating those fields
        if (input.data.email) {
          const emailExists = await ctx.db.user.findFirst({
            where: {
              email: input.data.email,
              id: { not: input.userId },
            },
          });

          if (emailExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Email already in use",
            });
          }
        }

        if (input.data.username) {
          const usernameExists = await ctx.db.user.findFirst({
            where: {
              username: input.data.username,
              id: { not: input.userId },
            },
          });

          if (usernameExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Username already in use",
            });
          }
        }

        // Update user
        const updatedUser = await ctx.db.user.update({
          where: { id: input.userId },
          data: input.data,
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            phone: true,
            zcashAddress: true,
            isAdmin: true,
          },
        });

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update user",
        });
      }
    }),

  // Delete user
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user exists
        const userExists = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Prevent deleting yourself
        if (input.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot delete your own account",
          });
        }

        // Delete user
        await ctx.db.user.delete({
          where: { id: input.userId },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to delete user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to delete user",
        });
      }
    }),

  // Get system statistics
  getSystemStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // Count total users
      const totalUsers = await ctx.db.user.count();
      
      // Count active API keys
      const activeApiKeys = await ctx.db.apiKey.count({
        where: { isActive: true },
      });

      // Count webhook configurations
      const webhookConfigs = await ctx.db.webhookConfig.count();

      // Get users registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsers = await ctx.db.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      return {
        totalUsers,
        activeApiKeys,
        webhookConfigs,
        newUsers,
      };
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch system stats",
      });
    }
  }),

  // Set/update zcash address for a user
  updateZcashAddress: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        zcashAddress: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user exists
        const userExists = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!userExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Validate zcash address format
        // Example: t1a7w3qM23QBroyJuG8w9a3SEtpQrcDfmbE or z-address
        // This is a simplified check - in production, use a proper ZCash address validator
        const isValidZcashAddress = 
          input.zcashAddress.startsWith('t1') || 
          input.zcashAddress.startsWith('t3') || 
          input.zcashAddress.startsWith('zs') || 
          input.zcashAddress.startsWith('zc');

        if (!isValidZcashAddress) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid Zcash address format",
          });
        }

        // Update user's zcash address
        const updatedUser = await ctx.db.user.update({
          where: { id: input.userId },
          data: { zcashAddress: input.zcashAddress },
          select: {
            id: true,
            email: true,
            username: true,
            zcashAddress: true,
          },
        });

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update zcash address:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update zcash address",
        });
      }
    }),

  // Add a new user directly (admin-only)
  createUser: adminProcedure
    .input(
      z.object({
        first_name: z.string().min(1),
        last_name: z.string().min(1),
        email: z.string().email(),
        username: z.string().min(3).optional(),
        phone: z.string().optional(),
        zcashAddress: z.string().optional(),
        isAdmin: z.boolean().optional().default(false),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if email already exists
        const emailExists = await ctx.db.user.findUnique({
          where: { email: input.email },
        });

        if (emailExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }

        // Check if username exists if provided
        if (input.username) {
          const usernameExists = await ctx.db.user.findUnique({
            where: { username: input.username },
          });

          if (usernameExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Username already in use",
            });
          }
        }

        // Hash password
        const { hash } = await import("bcryptjs");
        const hashedPassword = await hash(input.password, 10);

        // Generate a unique username if not provided
        let username = input.username;
        if (!username) {
          const usernameBase = input.first_name.toLowerCase().replace(/\s+/g, '');
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          username = `${usernameBase}${randomSuffix}`;
        }

        // Create user
        const newUser = await ctx.db.user.create({
          data: {
            first_name: input.first_name,
            last_name: input.last_name,
            email: input.email,
            username,
            phone: input.phone,
            password: hashedPassword,
            zcashAddress: input.zcashAddress,
            isAdmin: input.isAdmin,
            accounts: {
              create: {
                type: "credentials",
                provider: "credentials",
                providerAccountId: "admin-created",
              },
            },
          },
          select: {
            id: true,
            email: true,
            username: true,
            first_name: true,
            last_name: true,
            zcashAddress: true,
            isAdmin: true,
          },
        });

        return newUser;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to create user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }),

  // Toggle user's admin status
  toggleAdminStatus: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            isAdmin: true,
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Prevent changing your own admin status
        if (input.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You cannot change your own admin status",
          });
        }

        // Toggle admin status
        const updatedUser = await ctx.db.user.update({
          where: { id: input.userId },
          data: { isAdmin: !user.isAdmin },
          select: {
            id: true,
            email: true,
            username: true,
            isAdmin: true,
          },
        });

        return updatedUser;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to toggle admin status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to toggle admin status",
        });
      }
    }),

  // Get API usage statistics
  getApiUsageStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).optional().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // In a real application, you would query API usage metrics
        // This is a placeholder implementation
        
        // This would typically come from a logs table or analytics service
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);
        
        // Simulate API usage data
        // In a real app, replace this with actual database queries
        const apiUsageData = {
          totalRequests: 12500,
          uniqueUsers: 120,
          avgRequestsPerDay: 416,
          topEndpoints: [
            { endpoint: "/api/payments", count: 5680 },
            { endpoint: "/api/wallets", count: 3210 },
            { endpoint: "/api/transactions", count: 2150 },
          ],
          dailyStats: Array.from({ length: input.days }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
              date: date.toISOString().split('T')[0],
              requests: Math.floor(Math.random() * 700) + 300,
            };
          }).reverse(),
        };
        
        return apiUsageData;
      } catch (error) {
        console.error("Failed to fetch API usage stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch API usage stats",
        });
      }
    }),

  // Reset a user's password
  resetUserPassword: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Find user
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Hash the new password
        const { hash } = await import("bcryptjs");
        const hashedPassword = await hash(input.newPassword, 10);

        // Update user's password
        await ctx.db.user.update({
          where: { id: input.userId },
          data: { 
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
          },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to reset user password:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to reset user password",
        });
      }
    }),

  // Get database schema stats
  getDbSchemaStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // Count entities in each table
      const [
        userCount,
        accountCount,
        sessionCount,
        postCount,
        apiKeyCount,
        webhookCount,
        verificationTokenCount,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.account.count(),
        ctx.db.session.count(),
        ctx.db.post.count(),
        ctx.db.apiKey.count(),
        ctx.db.webhookConfig.count(),
        ctx.db.verificationToken.count(),
      ]);
      
      // Compute storage usage estimation (this is a rough estimate)
      const storageEstimates = {
        users: userCount * 0.5, // ~0.5KB per user
        accounts: accountCount * 0.3, // ~0.3KB per account
        sessions: sessionCount * 0.2, // ~0.2KB per session
        posts: postCount * 0.4, // ~0.4KB per post
        apiKeys: apiKeyCount * 0.2, // ~0.2KB per API key
        webhooks: webhookCount * 0.3, // ~0.3KB per webhook
        verificationTokens: verificationTokenCount * 0.1, // ~0.1KB per token
      };
      
      // Total storage estimate in KB
      const totalStorageKB = Object.values(storageEstimates).reduce((a, b) => a + b, 0);
      
      return {
        counts: {
          users: userCount,
          accounts: accountCount,
          sessions: sessionCount,
          posts: postCount,
          apiKeys: apiKeyCount,
          webhooks: webhookCount,
          verificationTokens: verificationTokenCount,
        },
        storageEstimates: {
          ...storageEstimates,
          totalKB: totalStorageKB,
          totalMB: totalStorageKB / 1024,
          totalGB: totalStorageKB / (1024 * 1024),
        }
      };
    } catch (error) {
      console.error("Failed to fetch database schema stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch database schema stats",
      });
    }
  }),

  // Get user growth statistics
  getUserGrowthStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // Get current date
      const now = new Date();
      
      // Get dates for different periods
      const lastDay = new Date(now);
      lastDay.setDate(lastDay.getDate() - 1);
      
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const last3Months = new Date(now);
      last3Months.setMonth(last3Months.getMonth() - 3);
      
      const last6Months = new Date(now);
      last6Months.setMonth(last6Months.getMonth() - 6);
      
      const lastYear = new Date(now);
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      
      // Query user counts for each period
      const [
        total,
        last24h,
        last7d,
        last30d,
        last90d,
        last180d,
        last365d,
      ] = await Promise.all([
        ctx.db.user.count(),
        ctx.db.user.count({ where: { createdAt: { gte: lastDay } } }),
        ctx.db.user.count({ where: { createdAt: { gte: lastWeek } } }),
        ctx.db.user.count({ where: { createdAt: { gte: lastMonth } } }),
        ctx.db.user.count({ where: { createdAt: { gte: last3Months } } }),
        ctx.db.user.count({ where: { createdAt: { gte: last6Months } } }),
        ctx.db.user.count({ where: { createdAt: { gte: lastYear } } }),
      ]);
      
      // Get monthly growth data for the chart
      const monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now);
        month.setMonth(month.getMonth() - i);
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const monthCount = await ctx.db.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });
        
        monthlyData.push({
          month: `${month.toLocaleString('default', { month: 'short' })} ${month.getFullYear()}`,
          count: monthCount,
        });
      }
      
      return {
        total,
        last24h,
        last7d,
        last30d,
        last90d,
        last180d,
        last365d,
        monthlyData,
      };
    } catch (error) {
      console.error("Failed to fetch user growth stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch user growth stats",
      });
    }
  }),

  // Get entity relationship stats
  getEntityRelationStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // Get users with related entities counts
      const users = await ctx.db.user.findMany({
        select: {
          id: true,
          _count: {
            select: {
              accounts: true,
              sessions: true,
              posts: true,
              apiKeys: true,
            }
          }
        }
      });
      
      // Calculate averages
      const totalUsers = users.length;
      if (totalUsers === 0) {
        return {
          averages: {
            accountsPerUser: 0,
            sessionsPerUser: 0,
            postsPerUser: 0,
            apiKeysPerUser: 0,
          },
          distributions: {
            accounts: { min: 0, max: 0, median: 0 },
            sessions: { min: 0, max: 0, median: 0 },
            posts: { min: 0, max: 0, median: 0 },
            apiKeys: { min: 0, max: 0, median: 0 },
          }
        };
      }
      
      // Calculate totals with null safety
      const totalAccounts = users.reduce((sum, user) => sum + (user._count?.accounts ?? 0), 0);
      const totalSessions = users.reduce((sum, user) => sum + (user._count?.sessions ?? 0), 0);
      const totalPosts = users.reduce((sum, user) => sum + (user._count?.posts ?? 0), 0);
      const totalApiKeys = users.reduce((sum, user) => sum + (user._count?.apiKeys ?? 0), 0);
      
      // Sort counts for median calculation with null safety
      const accountCounts = [...users.map(u => u._count?.accounts ?? 0)].sort((a, b) => a - b);
      const sessionCounts = [...users.map(u => u._count?.sessions ?? 0)].sort((a, b) => a - b);
      const postCounts = [...users.map(u => u._count?.posts ?? 0)].sort((a, b) => a - b);
      const apiKeyCounts = [...users.map(u => u._count?.apiKeys ?? 0)].sort((a, b) => a - b);
      
      // Calculate median (middle value)
      const median = (arr: number[]) => {
        const mid = Math.floor(arr.length / 2);
        return arr.length % 2 === 0 ? (arr[mid - 1]! + arr[mid]!) / 2 : arr[mid]!;
      };
      
      return {
        averages: {
          accountsPerUser: totalAccounts / totalUsers,
          sessionsPerUser: totalSessions / totalUsers,
          postsPerUser: totalPosts / totalUsers,
          apiKeysPerUser: totalApiKeys / totalUsers,
        },
        distributions: {
          accounts: {
            min: accountCounts[0],
            max: accountCounts[accountCounts.length - 1],
            median: median(accountCounts),
          },
          sessions: {
            min: sessionCounts[0],
            max: sessionCounts[sessionCounts.length - 1],
            median: median(sessionCounts),
          },
          posts: {
            min: postCounts[0],
            max: postCounts[postCounts.length - 1],
            median: median(postCounts),
          },
          apiKeys: {
            min: apiKeyCounts[0],
            max: apiKeyCounts[apiKeyCounts.length - 1],
            median: median(apiKeyCounts),
          },
        }
      };
    } catch (error) {
      console.error("Failed to fetch entity relationship stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch entity relationship stats",
      });
    }
  }),

  // Get all transactions with pagination and filters
  getAllTransactions: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REVERSED"]).optional(),
        userId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        sortBy: z.enum(["createdAt", "amount", "status", "completedAt"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const {
          page,
          limit,
          status,
          userId,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        } = input;

        // Build filter conditions
        const where: any = {};
        
        if (status) {
          where.status = status;
        }
        
        if (userId) {
          where.userId = userId;
        }
        
        if (startDate || endDate) {
          where.createdAt = {};
          if (startDate) {
            where.createdAt.gte = startDate;
          }
          if (endDate) {
            where.createdAt.lte = endDate;
          }
        }

        // Count total transactions with these filters
        const totalCount = await ctx.db.transaction.count({ where });
        
        // Calculate pagination values
        const skip = (page - 1) * limit;
        const totalPages = Math.ceil(totalCount / limit);
        
        // Fetch transactions with user information
        const transactions = await ctx.db.transaction.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        return {
          transactions,
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages,
          },
        };
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transactions",
        });
      }
    }),

  // Get transaction by ID
  getTransactionById: adminProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const transaction = await ctx.db.transaction.findUnique({
          where: { id: input.transactionId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                first_name: true,
                last_name: true,
                zcashAddress: true,
              },
            },
          },
        });

        if (!transaction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }

        return transaction;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to fetch transaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transaction",
        });
      }
    }),

  // Update transaction status
  updateTransactionStatus: adminProcedure
    .input(
      z.object({
        transactionId: z.string(),
        status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REVERSED"]),
        completedAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if transaction exists
        const transactionExists = await ctx.db.transaction.findUnique({
          where: { id: input.transactionId },
        });

        if (!transactionExists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }

        // Prepare update data
        const updateData: any = {
          status: input.status,
        };

        // If status is COMPLETED and completedAt is not provided, set it to now
        if (input.status === "COMPLETED" && !input.completedAt) {
          updateData.completedAt = new Date();
        } else if (input.status !== "COMPLETED") {
          // If status is not COMPLETED, set completedAt to null
          updateData.completedAt = null;
        } else if (input.completedAt) {
          // If completedAt is provided, use it
          updateData.completedAt = input.completedAt;
        }

        // Update transaction
        const updatedTransaction = await ctx.db.transaction.update({
          where: { id: input.transactionId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        });

        return updatedTransaction;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update transaction status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update transaction status",
        });
      }
    }),

  // Get transaction statistics
  getTransactionStats: adminProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "year"]).default("month"),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const now = new Date();
        
        // Determine the start date based on the period
        let startDate: Date;
        switch (input.period) {
          case "day":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 1);
            break;
          case "week":
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "year":
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case "month":
          default:
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }
        
        // Get total count for each status
        const [
          pendingCount,
          processingCount,
          completedCount,
          failedCount,
          reversedCount,
          totalAmount,
          totalFees,
        ] = await Promise.all([
          ctx.db.transaction.count({ 
            where: { 
              status: "PENDING",
              createdAt: { gte: startDate }
            } 
          }),
          ctx.db.transaction.count({ 
            where: { 
              status: "PROCESSING",
              createdAt: { gte: startDate }
            } 
          }),
          ctx.db.transaction.count({ 
            where: { 
              status: "COMPLETED",
              createdAt: { gte: startDate }
            } 
          }),
          ctx.db.transaction.count({ 
            where: { 
              status: "FAILED",
              createdAt: { gte: startDate }
            } 
          }),
          ctx.db.transaction.count({ 
            where: { 
              status: "REVERSED",
              createdAt: { gte: startDate }
            } 
          }),
          ctx.db.transaction.aggregate({
            _sum: {
              amount: true,
            },
            where: {
              status: "COMPLETED",
              createdAt: { gte: startDate }
            }
          }),
          ctx.db.transaction.aggregate({
            _sum: {
              fee: true,
            },
            where: {
              status: "COMPLETED",
              createdAt: { gte: startDate }
            }
          }),
        ]);
        
        // Calculate total transactions
        const totalTransactions = pendingCount + processingCount + completedCount + failedCount + reversedCount;
        
        return {
          period: input.period,
          totalTransactions,
          statuses: {
            pending: pendingCount,
            processing: processingCount,
            completed: completedCount,
            failed: failedCount,
            reversed: reversedCount,
          },
          totalAmount: totalAmount._sum.amount || 0,
          totalFees: totalFees._sum.fee || 0,
          successRate: totalTransactions > 0 ? (completedCount / totalTransactions) * 100 : 0,
        };
      } catch (error) {
        console.error("Failed to fetch transaction stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transaction stats",
        });
      }
    }),

  // Update transaction with txHashes and addresses
  updateTransactionDetails: publicProcedure
    .input(
      z.object({
        // We need to identify the transaction - can be by id or combination of identifying fields
        transactionId: z.string().optional(),
        // Alternative identifiers used by bash script
        dbUserId: z.string().optional(),
        userId: z.string().optional(),
        clientUserId: z.string().optional(),
        invoiceId: z.string().optional(),
        // The data to update
        txHashes: z.array(z.string().min(1)),
        addressesUsed: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure we have at least one way to identify the transaction
        if (!input.transactionId && !input.invoiceId && !input.dbUserId && !(input.userId && input.clientUserId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must provide either transactionId, invoiceId, dbUserId, or both userId and clientUserId",
          });
        }

        // Filter out empty strings from arrays
        const txHashes = input.txHashes.filter(hash => hash && hash.trim() !== "");
        const addressesUsed = input.addressesUsed.filter(addr => addr && addr.trim() !== "");

        // Build query to find the transaction
        const where: any = {};
        
        if (input.transactionId) {
          where.id = input.transactionId;
        } else {
          // Build compound query based on available identifiers
          if (input.dbUserId) {
            where.userId = input.dbUserId;
          } else if (input.userId) {
            where.userId = input.userId;
          }
          
          if (input.clientUserId) {
            where.clientUserId = input.clientUserId;
          }
          
          if (input.invoiceId) {
            where.invoiceId = input.invoiceId;
          }
        }

        // Find the transaction
        const transaction = await ctx.db.transaction.findFirst({
          where,
          orderBy: {
            // If multiple transactions match the criteria, get the most recent one
            createdAt: "desc"
          }
        });

        if (!transaction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }

        // Update the transaction with the provided data
        const updatedTransaction = await ctx.db.transaction.update({
          where: { id: transaction.id },
          data: {
            txHashes: txHashes.length > 0 ? txHashes : undefined,
            addressesUsed: addressesUsed.length > 0 ? addressesUsed : undefined,
            // If we're adding transaction details, it's likely moving to COMPLETED state
            // Only update status if it's currently PENDING or PROCESSING
            ...(["PENDING", "PROCESSING"].includes(transaction.status) && (txHashes.length > 0 || addressesUsed.length > 0)
              ? { status: "COMPLETED", completedAt: new Date() } 
              : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        });

        return updatedTransaction;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Failed to update transaction details:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to update transaction details",
        });
      }
    }),

  // Update API Key Fee
  updateApiKeyFee: adminProcedure
  .input(
    z.object({
      id: z.string(),
      transactionFee: z.number().min(0).max(100),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      // Check if the API key exists
      const apiKey = await ctx.db.apiKey.findUnique({
        where: {
          id: input.id,
        },
      });
      
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }
      
      // Update the API key's transaction fee
      const updatedApiKey = await ctx.db.apiKey.update({
        where: { id: input.id },
        data: { transactionFee: input.transactionFee },
      });
      
      return { success: true, apiKey: updatedApiKey };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error("Failed to update API key fee:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to update API key fee",
      });
    }
  }),

  // Create API Key for User
  createApiKey: adminProcedure
  .input(
    z.object({
      userId: z.string(),
      name: z.string().optional(),
      transactionFee: z.number().min(0).max(100).default(2.5),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      
      // Generate a random API key with prefix
      const apiKeyPrefix = "zv_live_";
      const randomPart = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      const apiKey = apiKeyPrefix + randomPart;
      
      // Create API key for the user
      const createdApiKey = await ctx.db.apiKey.create({
        data: {
          key: apiKey,
          name: input.name || "Admin Generated API Key",
          userId: input.userId,
          transactionFee: input.transactionFee,
        },
      });
      
      return { 
        success: true, 
        apiKey: createdApiKey 
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error("Failed to create API key for user:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to create API key for user",
      });
    }
  }),

  // Get All API Keys
  getAllApiKeys: adminProcedure
  .input(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      userId: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    try {
      const where = input.userId ? { userId: input.userId } : {};
      
      // Count total API keys
      const totalCount = await ctx.db.apiKey.count({ where });
      
      // Calculate pagination
      const skip = (input.page - 1) * input.limit;
      const totalPages = Math.ceil(totalCount / input.limit);
      
      // Get API keys with user information
      const apiKeys = await ctx.db.apiKey.findMany({
        where,
        skip,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });
      
      return {
        apiKeys,
        pagination: {
          totalCount,
          page: input.page,
          limit: input.limit,
          totalPages,
        },
      };
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch API keys",
      });
    }
  }),

  // Get API Key Details
  getApiKeyDetails: adminProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    try {
      const apiKey = await ctx.db.apiKey.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              first_name: true,
              last_name: true,
            },
          },
          Transaction: {
            take: 10,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
              fee: true,
            },
          },
        },
      });
      
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }
      
      // Get transaction stats
      const stats = {
        totalTransactions: await ctx.db.transaction.count({
          where: { apiKeyId: input.id },
        }),
        successfulTransactions: await ctx.db.transaction.count({
          where: { apiKeyId: input.id, status: "COMPLETED" },
        }),
        totalProcessed: await ctx.db.transaction.aggregate({
          where: { apiKeyId: input.id, status: "COMPLETED" },
          _sum: { amount: true },
        }),
        totalFees: await ctx.db.transaction.aggregate({
          where: { apiKeyId: input.id, status: "COMPLETED" },
          _sum: { fee: true },
        }),
      };
      
      return {
        apiKey,
        stats,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error("Failed to fetch API key details:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch API key details",
      });
    }
  }),

  // Toggle API Key Status
  toggleApiKeyStatus: adminProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const apiKey = await ctx.db.apiKey.findUnique({
        where: { id: input.id },
        select: { isActive: true },
      });
      
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }
      
      // Toggle the active status
      const updatedApiKey = await ctx.db.apiKey.update({
        where: { id: input.id },
        data: { isActive: !apiKey.isActive },
      });
      
      return { 
        success: true, 
        isActive: updatedApiKey.isActive 
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error("Failed to toggle API key status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to toggle API key status",
      });
    }
  }),

  // Delete API Key
  deleteApiKey: adminProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      // Check if API key exists
      const apiKey = await ctx.db.apiKey.findUnique({
        where: { id: input.id },
      });
      
      if (!apiKey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "API key not found",
        });
      }
      
      // Delete API key
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
}); 