import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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
}); 