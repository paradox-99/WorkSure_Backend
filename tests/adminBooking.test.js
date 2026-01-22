// Example test file for Admin Booking APIs
// You can use this with Jest, Mocha, or any testing framework

const request = require('supertest');
const app = require('../app');

describe('Admin Booking Management APIs', () => {
     let authToken;
     let testBookingId;

     beforeAll(async () => {
          // Setup: Login as admin and get auth token
          // authToken = await loginAsAdmin();
     });

     describe('GET /api/admin/bookings - Get All Bookings', () => {
          it('should return paginated bookings list', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toBeInstanceOf(Array);
               expect(response.body.pagination).toHaveProperty('totalCount');
               expect(response.body.pagination).toHaveProperty('totalPages');
          });

          it('should filter bookings by status', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ status: 'pending', page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               response.body.data.forEach(booking => {
                    expect(booking.status).toBe('pending');
               });
          });

          it('should filter bookings by payment status', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ paymentStatus: 'paid', page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               response.body.data.forEach(booking => {
                    expect(booking.paymentStatus).toBe('paid');
               });
          });

          it('should search bookings by user name', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ search: 'John', page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.length).toBeGreaterThan(0);
          });

          it('should filter bookings by date range', async () => {
               const startDate = '2026-01-01T00:00:00Z';
               const endDate = '2026-01-31T23:59:59Z';

               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ startDate, endDate, page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               response.body.data.forEach(booking => {
                    const createdAt = new Date(booking.createdAt);
                    expect(createdAt >= new Date(startDate)).toBe(true);
                    expect(createdAt <= new Date(endDate)).toBe(true);
               });
          });

          it('should sort bookings correctly', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .query({ sortBy: 'total_amount', sortOrder: 'desc', page: 1, limit: 10 })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               // Verify descending order by amount
               for (let i = 1; i < response.body.data.length; i++) {
                    expect(response.body.data[i - 1].amount >= response.body.data[i].amount).toBe(true);
               }
          });
     });

     describe('GET /api/admin/bookings/stats - Get Statistics', () => {
          it('should return booking statistics', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/stats')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('totalBookings');
               expect(response.body.data).toHaveProperty('totalRevenue');
               expect(response.body.data).toHaveProperty('statusCounts');
               expect(response.body.data).toHaveProperty('paymentStats');
          });

          it('should filter stats by date range', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/stats')
                    .query({ startDate: '2026-01-01', endDate: '2026-01-31' })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.totalBookings).toBeGreaterThanOrEqual(0);
          });
     });

     describe('GET /api/admin/bookings/:id - Get Booking Details', () => {
          it('should return detailed booking information', async () => {
               const response = await request(app)
                    .get(`/api/admin/bookings/${testBookingId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data).toHaveProperty('id');
               expect(response.body.data).toHaveProperty('users_orders_client_idTousers');
               expect(response.body.data).toHaveProperty('users_orders_assigned_worker_idTousers');
               expect(response.body.data).toHaveProperty('payments');
               expect(response.body.data).toHaveProperty('order_items');
          });

          it('should return 404 for non-existent booking', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/non-existent-id')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Booking not found');
          });
     });

     describe('PATCH /api/admin/bookings/:id/status - Update Status', () => {
          it('should update booking status successfully', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/status`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ status: 'accepted' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('accepted');
          });

          it('should reject invalid status', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/status`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ status: 'invalid_status' })
                    .expect(400);

               expect(response.body.success).toBe(false);
          });

          it('should require status field', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/status`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Status is required');
          });

          it('should add cancel reason when status is cancelled', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/status`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ status: 'cancelled', reason: 'Test cancellation' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('cancelled');
               expect(response.body.data.cancel_reason).toBe('Test cancellation');
          });
     });

     describe('PATCH /api/admin/bookings/:id/assign-worker - Assign Worker', () => {
          let testWorkerId;

          it('should assign worker to booking', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/assign-worker`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ workerId: testWorkerId })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.assigned_worker_id).toBe(testWorkerId);
          });

          it('should require workerId field', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/assign-worker`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Worker ID is required');
          });

          it('should reject non-existent worker', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/assign-worker`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ workerId: 'non-existent-worker-id' })
                    .expect(404);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Worker not found');
          });

          it('should reject user who is not a worker', async () => {
               const clientUserId = 'some-client-user-id';
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/assign-worker`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ workerId: clientUserId })
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('User is not a worker');
          });
     });

     describe('PATCH /api/admin/bookings/:id/cancel - Cancel Booking', () => {
          it('should cancel booking with reason', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/cancel`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ reason: 'Admin cancellation test' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.status).toBe('cancelled');
               expect(response.body.data.cancel_reason).toBe('Admin cancellation test');
               expect(response.body.data.canceled_by).toBe('admin');
          });

          it('should require reason field', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/cancel`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Cancellation reason is required');
          });

          it('should not cancel completed booking', async () => {
               // First complete a booking, then try to cancel
               await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/status`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ status: 'completed' });

               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/cancel`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ reason: 'Try to cancel' })
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Cannot cancel a completed booking');
          });
     });

     describe('POST /api/admin/bookings/:id/refund - Process Refund', () => {
          it('should process full refund', async () => {
               const response = await request(app)
                    .post(`/api/admin/bookings/${testBookingId}/refund`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ refundReason: 'Service quality issue' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.payment.status).toBe('refunded');
          });

          it('should process partial refund', async () => {
               const response = await request(app)
                    .post(`/api/admin/bookings/${testBookingId}/refund`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ 
                         refundAmount: 50.00,
                         refundReason: 'Partial refund for delay' 
                    })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.refundAmount).toBe(50.00);
          });

          it('should reject refund if no payment found', async () => {
               const unpaidBookingId = 'unpaid-booking-id';
               const response = await request(app)
                    .post(`/api/admin/bookings/${unpaidBookingId}/refund`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ refundReason: 'Test' })
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('No paid payment found for this booking');
          });

          it('should reject refund amount exceeding payment', async () => {
               const response = await request(app)
                    .post(`/api/admin/bookings/${testBookingId}/refund`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ 
                         refundAmount: 99999.00,
                         refundReason: 'Test' 
                    })
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Refund amount cannot exceed payment amount');
          });
     });

     describe('PATCH /api/admin/bookings/:id/notes - Update Notes', () => {
          it('should update admin notes', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/notes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ notes: 'Important admin note for this booking' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.description).toBe('Important admin note for this booking');
          });

          it('should allow empty notes', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/notes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ notes: '' })
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body.data.description).toBe('');
          });

          it('should require notes field', async () => {
               const response = await request(app)
                    .patch(`/api/admin/bookings/${testBookingId}/notes`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({})
                    .expect(400);

               expect(response.body.success).toBe(false);
               expect(response.body.error).toBe('Notes field is required');
          });
     });

     describe('GET /api/admin/bookings/export - Export Bookings', () => {
          it('should export bookings as JSON', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/export')
                    .query({ format: 'json' })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               expect(response.body).toHaveProperty('count');
               expect(response.body).toHaveProperty('exportedAt');
               expect(response.body.data).toBeInstanceOf(Array);
          });

          it('should export bookings as CSV', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/export')
                    .query({ format: 'csv' })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.headers['content-type']).toBe('text/csv');
               expect(response.headers['content-disposition']).toContain('attachment');
               expect(response.text).toContain('Booking ID');
          });

          it('should export filtered bookings', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings/export')
                    .query({ 
                         status: 'completed',
                         paymentStatus: 'paid',
                         format: 'json'
                    })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

               expect(response.body.success).toBe(true);
               response.body.data.forEach(booking => {
                    expect(booking.status).toBe('completed');
                    expect(booking.payment_completed).toBe(true);
               });
          });
     });

     describe('Authorization Tests', () => {
          it('should reject requests without auth token', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .expect(401);

               expect(response.body.success).toBe(false);
          });

          it('should reject requests with invalid token', async () => {
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .set('Authorization', 'Bearer invalid_token')
                    .expect(401);

               expect(response.body.success).toBe(false);
          });

          it('should reject requests from non-admin users', async () => {
               // Login as non-admin user
               const clientToken = 'client_user_token';
               
               const response = await request(app)
                    .get('/api/admin/bookings')
                    .set('Authorization', `Bearer ${clientToken}`)
                    .expect(403);

               expect(response.body.success).toBe(false);
          });
     });
});

// Helper functions
async function loginAsAdmin() {
     // Implement admin login logic
     // Return auth token
     return 'admin_auth_token';
}
