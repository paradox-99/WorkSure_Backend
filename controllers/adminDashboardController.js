const prisma = require('../config/prisma');

/**
 * GET /admin/dashboard/summary
 * Get overall dashboard summary statistics
 */
const getDashboardSummary = async (req, res) => {
     try {
          // Get date 30 days ago for "new" counts
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          // Get all counts in parallel for efficiency using transaction
          const result = await prisma.$transaction(async (tx) => {
               const [
                    totalUsers,
                    newUsers,
                    totalWorkers,
                    pendingWorkers,
                    totalBookings,
                    activeBookings,
                    completedBookings,
                    cancelledBookings,
                    totalRevenue,
                    openComplaints,
                    underReviewComplaints
               ] = await Promise.all([
                    tx.users.count({ where: { role: 'client' } }),
                    tx.users.count({
                         where: {
                              role: 'client',
                              created_at: { gte: thirtyDaysAgo }
                         }
                    }),
                    tx.users.count({ where: { role: 'worker' } }),
                    tx.worker_profiles.count({ where: { verification: 'pending' } }),
                    tx.orders.count(),
                    tx.orders.count({
                         where: {
                              status: { in: ['pending', 'accepted', 'in_progress', 'awaiting'] }
                         }
                    }),
                    tx.orders.count({ where: { status: 'completed' } }),
                    tx.orders.count({ where: { status: 'cancelled' } }),
                    tx.payments.aggregate({
                         where: { status: 'paid' },
                         _sum: { amount: true }
                    }),
                    tx.complaints.count({ where: { status: 'open' } }),
                    tx.complaints.count({ where: { status: 'under_review' } })
               ]);

               // Calculate platform earnings (assuming 10% commission)
               const totalRevenueAmount = totalRevenue._sum.amount || 0;
               const platformEarnings = totalRevenueAmount * 0.10;

               return {
                    totalUsers,
                    newUsers,
                    totalWorkers,
                    pendingWorkers,
                    totalBookings,
                    activeBookings,
                    completedBookings,
                    cancelledBookings,
                    totalRevenueAmount,
                    platformEarnings,
                    openComplaints,
                    underReviewComplaints
               };
          });

          res.status(200).json({
               success: true,
               data: {
                    users: {
                         total: result.totalUsers,
                         new: result.newUsers
                    },
                    workers: {
                         total: result.totalWorkers,
                         pending_verification: result.pendingWorkers
                    },
                    bookings: {
                         total: result.totalBookings,
                         active: result.activeBookings,
                         completed: result.completedBookings,
                         cancelled: result.cancelledBookings
                    },
                    revenue: {
                         total: parseFloat(result.totalRevenueAmount),
                         platform_earnings: parseFloat(result.platformEarnings)
                    },
                    complaints: {
                         open: result.openComplaints,
                         under_review: result.underReviewComplaints
                    }
               }
          });
     } catch (error) {
          console.error('Error fetching dashboard summary:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

/**
 * GET /admin/dashboard/bookings?range=30d
 * Get booking statistics over time
 */
const getBookingStats = async (req, res) => {
     try {
          const { range = '30d' } = req.query;

          // Parse range (30d, 7d, 90d, etc.)
          const days = parseInt(range.replace('d', '')) || 30;
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          // Get bookings grouped by date
          const bookings = await prisma.orders.findMany({
               where: {
                    created_at: { gte: startDate }
               },
               select: {
                    created_at: true,
                    status: true
               }
          });

          // Group by date
          const dailyBookings = {};
          const statusBreakdown = {
               completed: 0,
               cancelled: 0,
               ongoing: 0
          };

          bookings.forEach(booking => {
               const date = booking.created_at.toISOString().split('T')[0];
               dailyBookings[date] = (dailyBookings[date] || 0) + 1;

               // Count status breakdown
               if (booking.status === 'completed') {
                    statusBreakdown.completed++;
               } else if (booking.status === 'cancelled') {
                    statusBreakdown.cancelled++;
               } else if (['pending', 'accepted', 'in_progress', 'awaiting'].includes(booking.status)) {
                    statusBreakdown.ongoing++;
               }
          });

          // Convert to arrays for chart
          const labels = Object.keys(dailyBookings).sort();
          const data = labels.map(date => dailyBookings[date]);

          res.status(200).json({
               success: true,
               data: {
                    labels,
                    data,
                    status_breakdown: statusBreakdown
               }
          });
     } catch (error) {
          console.error('Error fetching booking stats:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

/**
 * GET /admin/dashboard/revenue?range=30d
 * Get revenue statistics over time
 */
const getRevenueStats = async (req, res) => {
     try {
          const { range = '30d' } = req.query;

          const days = parseInt(range.replace('d', '')) || 30;
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

          // Get payments and refunds in parallel
          const [payments, refunds] = await Promise.all([
               prisma.payments.findMany({
                    where: {
                         status: 'paid',
                         paid_at: { gte: startDate }
                    },
                    select: {
                         paid_at: true,
                         amount: true
                    }
               }),
               prisma.refunds.aggregate({
                    where: {
                         refund_status: 'success',
                         completed_at: { gte: startDate }
                    },
                    _sum: { refund_amount: true }
               })
          ]);

          // Group payments by date
          const dailyRevenue = {};
          payments.forEach(payment => {
               const date = payment.paid_at.toISOString().split('T')[0];
               if (!dailyRevenue[date]) {
                    dailyRevenue[date] = 0;
               }
               dailyRevenue[date] += parseFloat(payment.amount);
          });

          // Convert to array format
          const daily_revenue = Object.keys(dailyRevenue)
               .sort()
               .map(date => ({
                    date,
                    amount: dailyRevenue[date]
               }));

          // Get pending payouts (payments in pending status)
          const pendingPayouts = await prisma.payments.aggregate({
               where: { status: 'pending' },
               _sum: { amount: true }
          });

          res.status(200).json({
               success: true,
               data: {
                    daily_revenue,
                    pending_payouts: parseFloat(pendingPayouts._sum.amount || 0),
                    refunds: parseFloat(refunds._sum.refund_amount || 0)
               }
          });
     } catch (error) {
          console.error('Error fetching revenue stats:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

/**
 * GET /admin/dashboard/complaints
 * Get complaint statistics
 */
const getComplaintStats = async (req, res) => {
     try {
          const [
               openCount,
               underReviewCount,
               resolvedCount,
               closedCount,
               awaitingResponseCount,
               urgentComplaints
          ] = await Promise.all([
               prisma.complaints.count({
                    where: { status: 'open' }
               }),
               prisma.complaints.count({
                    where: { status: 'under_review' }
               }),
               prisma.complaints.count({
                    where: { status: 'resolved' }
               }),
               prisma.complaints.count({
                    where: { status: 'closed' }
               }),
               // Awaiting response: complaints that are open and created more than 24 hours ago
               prisma.complaints.count({
                    where: {
                         status: 'open',
                         created_at: {
                              lte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                         }
                    }
               }),
               // Get urgent/high priority complaints
               prisma.complaints.findMany({
                    where: {
                         priority: 'high',
                         status: {
                              in: ['open', 'under_review']
                         }
                    },
                    select: {
                         id: true,
                         category: true,
                         status: true,
                         priority: true,
                         created_at: true
                    },
                    orderBy: {
                         created_at: 'desc'
                    },
                    take: 10
               })
          ]);

          res.status(200).json({
               success: true,
               data: {
                    open: openCount,
                    under_review: underReviewCount,
                    resolved: resolvedCount,
                    closed: closedCount,
                    awaiting_response: awaitingResponseCount,
                    urgent: urgentComplaints.map(complaint => ({
                         id: complaint.id,
                         category: complaint.category,
                         status: complaint.status,
                         priority: complaint.priority,
                         created_at: complaint.created_at
                    }))
               }
          });
     } catch (error) {
          console.error('Error fetching complaint stats:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

/**
 * GET /admin/dashboard/reviews
 * Get review statistics
 */
const getReviewStats = async (req, res) => {
     try {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const [
               avgRatingResult,
               newReviews,
               lowRatings,
               totalReviews,
               ratingDistribution
          ] = await Promise.all([
               // Average rating
               prisma.reviews.aggregate({
                    _avg: { rating: true }
               }),
               // New reviews in last 30 days
               prisma.reviews.count({
                    where: {
                         created_at: { gte: thirtyDaysAgo }
                    }
               }),
               // Low ratings (1-2 stars)
               prisma.reviews.count({
                    where: {
                         rating: { lte: 2 }
                    }
               }),
               // Total reviews
               prisma.reviews.count(),
               // Rating distribution
               prisma.$queryRaw`
                SELECT rating, COUNT(*) as count
                FROM reviews
                GROUP BY rating
                ORDER BY rating DESC
            `
          ]);

          // Convert rating distribution to object
          const distribution = {};
          ratingDistribution.forEach(item => {
               distribution[`${item.rating}_star`] = parseInt(item.count);
          });

          res.status(200).json({
               success: true,
               data: {
                    average_rating: parseFloat(avgRatingResult._avg.rating?.toFixed(1) || 0),
                    total_reviews: totalReviews,
                    new_reviews: newReviews,
                    low_ratings: lowRatings,
                    rating_distribution: distribution
               }
          });
     } catch (error) {
          console.error('Error fetching review stats:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

/**
 * GET /admin/dashboard/recent-activities
 * Get recent activities across the platform
 */
const getRecentActivities = async (req, res) => {
     try {
          const limit = parseInt(req.query.limit) || 5;

          const [recentBookings, recentUsers, recentComplaints] = await Promise.all([
               prisma.orders.findMany({
                    take: limit,
                    orderBy: { created_at: 'desc' },
                    select: {
                         id: true,
                         status: true,
                         created_at: true,
                         total_amount: true,
                         users_orders_client_idTousers: {
                              select: {
                                   full_name: true
                              }
                         }
                    }
               }),
               prisma.users.findMany({
                    take: limit,
                    orderBy: { created_at: 'desc' },
                    select: {
                         id: true,
                         full_name: true,
                         email: true,
                         role: true,
                         created_at: true
                    }
               }),
               prisma.complaints.findMany({
                    take: limit,
                    orderBy: { created_at: 'desc' },
                    select: {
                         id: true,
                         category: true,
                         status: true,
                         priority: true,
                         created_at: true
                    }
               })
          ]);

          res.status(200).json({
               success: true,
               data: {
                    recent_bookings: recentBookings,
                    recent_users: recentUsers,
                    recent_complaints: recentComplaints
               }
          });
     } catch (error) {
          console.error('Error fetching recent activities:', error);
          res.status(500).json({
               success: false,
               error: 'Internal Server Error'
          });
     }
};

module.exports = {
     getDashboardSummary,
     getBookingStats,
     getRevenueStats,
     getComplaintStats,
     getReviewStats,
     getRecentActivities
};
