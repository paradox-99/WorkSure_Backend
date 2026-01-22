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

module.exports = router;
