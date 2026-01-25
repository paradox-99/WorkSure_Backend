const express = require('express');
const router = express.Router();
const {
     adminGetAllBookings,
     adminGetBookingById,
     adminUpdateBookingStatus,
     adminAssignWorker,
     adminCancelBooking,
     adminProcessRefund,
     adminUpdateNotes,
     adminExportBookings,
     adminGetBookingStats,
     adminGetAllReviews,
     adminDeleteReview,
     adminGetReviewsSummary
} = require('../controllers/orderController');
const {
     adminGetAllPayments,
     adminGetPaymentDetails,
     adminGetPaymentsSummary,
     adminRefundPayment
} = require('../controllers/paymentController');
const {
     getDashboardSummary,
     getBookingStats,
     getRevenueStats,
     getComplaintStats,
     getReviewStats,
     getRecentActivities
} = require('../controllers/adminDashboardController');

/**
 * Dashboard Overview APIs
 */

/**
 * @route   GET /api/admin/dashboard/summary
 * @desc    Get overall dashboard summary statistics
 * @access  Admin
 */
router.get('/dashboard/summary', getDashboardSummary);

/**
 * @route   GET /api/admin/dashboard/bookings
 * @desc    Get booking statistics over time
 * @access  Admin
 * @query   range (e.g., 7d, 30d, 90d)
 */
router.get('/dashboard/bookings', getBookingStats);

/**
 * @route   GET /api/admin/dashboard/revenue
 * @desc    Get revenue statistics over time
 * @access  Admin
 * @query   range (e.g., 7d, 30d, 90d)
 */
router.get('/dashboard/revenue', getRevenueStats);

/**
 * @route   GET /api/admin/dashboard/complaints
 * @desc    Get complaint statistics
 * @access  Admin
 */
router.get('/dashboard/complaints', getComplaintStats);

/**
 * @route   GET /api/admin/dashboard/reviews
 * @desc    Get review statistics
 * @access  Admin
 */
router.get('/dashboard/reviews', getReviewStats);

/**
 * @route   GET /api/admin/dashboard/recent-activities
 * @desc    Get recent activities across the platform
 * @access  Admin
 * @query   limit (default: 10)
 */
router.get('/dashboard/recent-activities', getRecentActivities);

/**
 * Booking Management APIs
 */

/**
 * @route   GET /api/admin/bookings
 * @desc    Get all bookings with filters & pagination
 * @access  Admin
 * @query   page, limit, status, paymentStatus, search, startDate, endDate, sortBy, sortOrder
 */
router.get('/bookings', adminGetAllBookings);

/**
 * @route   GET /api/admin/reviews
 * @desc    Get all reviews with filters & pagination
 * @access  Admin
 * @query   page, limit, status, sortBy, sortOrder
 */
router.get('/reviews', adminGetAllReviews);

/**
 * @route   GET /api/admin/bookings/stats
 * @desc    Get booking statistics
 * @access  Admin
 * @query   startDate, endDate
 */
router.get('/bookings/stats', adminGetBookingStats);

/**
 * @route   GET /api/admin/bookings/export
 * @desc    Export bookings data (JSON or CSV)
 * @access  Admin
 * @query   status, paymentStatus, startDate, endDate, format (json/csv)
 */
router.get('/bookings/export', adminExportBookings);

/**
 * @route   GET /api/admin/bookings/:id
 * @desc    Get single booking details
 * @access  Admin
 */
router.get('/bookings/:id', adminGetBookingById);

/**
 * @route   PATCH /api/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin
 * @body    { status: string, reason?: string }
 */
router.patch('/bookings/:id/status', adminUpdateBookingStatus);

/**
 * @route   PATCH /api/admin/bookings/:id/assign-worker
 * @desc    Assign/reassign worker to booking
 * @access  Admin
 * @body    { workerId: string }
 */
router.patch('/bookings/:id/assign-worker', adminAssignWorker);

/**
 * @route   PATCH /api/admin/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Admin
 * @body    { reason: string }
 */
router.patch('/bookings/:id/cancel', adminCancelBooking);

/**
 * @route   POST /api/admin/bookings/:id/refund
 * @desc    Process refund for booking
 * @access  Admin
 * @body    { refundAmount?: number, refundReason?: string }
 */
router.post('/bookings/:id/refund', adminProcessRefund);

/**
 * @route   PATCH /api/admin/bookings/:id/notes
 * @desc    Update admin notes for booking
 * @access  Admin
 * @body    { notes: string }
 */
router.patch('/bookings/:id/notes', adminUpdateNotes);

/**
 * @route   GET /api/admin/reviews/summary
 * @desc    Get reviews summary (total, average rating, breakdown by rating)
 * @access  Admin
 */
router.get('/reviews/summary', adminGetReviewsSummary);

/**
 * @route   DELETE /api/admin/reviews/:id
 * @desc    Delete a review
 * @access  Admin
 */
router.delete('/deleteReview/:id', adminDeleteReview);

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments with filters & pagination
 * @access  Admin
 * @query   page, limit, status, paymentMethod, dateFrom, dateTo, sortBy, sortOrder
 */
router.get('/payments', adminGetAllPayments);

/**
 * @route   GET /api/admin/payments/summary
 * @desc    Get payments summary (total, revenue, status breakdown, method breakdown)
 * @access  Admin
 * @query   dateFrom, dateTo
 */
router.get('/payments/summary', adminGetPaymentsSummary);

/**
 * @route   GET /api/admin/payments/:id
 * @desc    Get payment details
 * @access  Admin
 */
router.get('/payments/:id', adminGetPaymentDetails);

/**
 * @route   POST /api/admin/payments/:id/refund
 * @desc    Refund payment (admin action)
 * @access  Admin
 * @body    { refundAmount?: number, refundReason: string }
 */
router.post('/payments/:id/refund', adminRefundPayment);

module.exports = router;
