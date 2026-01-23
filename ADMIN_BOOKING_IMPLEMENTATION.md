# Admin Booking Management APIs - Quick Reference

## 🎯 Implementation Summary

All admin booking management APIs have been successfully created and integrated into the WorkSure Backend system.

## 📁 Files Modified/Created

1. **controllers/orderController.js** - Added 9 new admin controller functions
2. **routes/adminBookingRoutes.js** - New route file with all admin booking endpoints
3. **app.js** - Registered admin routes under `/api/admin`
4. **ADMIN_BOOKING_API_DOCS.md** - Complete API documentation

## 🚀 Available Endpoints

### Base URL: `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bookings` | Get all bookings with filters & pagination |
| GET | `/bookings/stats` | Get booking statistics |
| GET | `/bookings/export` | Export bookings data (JSON/CSV) |
| GET | `/bookings/:id` | Get single booking details |
| PATCH | `/bookings/:id/status` | Update booking status |
| PATCH | `/bookings/:id/assign-worker` | Assign/reassign worker |
| PATCH | `/bookings/:id/cancel` | Cancel booking |
| POST | `/bookings/:id/refund` | Process refund |
| PATCH | `/bookings/:id/notes` | Update admin notes |

## 📊 Table View Fields (GET /api/admin/bookings)

The main endpoint returns these fields for table display:

1. **Booking ID** - Unique identifier
2. **User** - Client name, email, phone, profile picture
3. **Worker** - Worker name, email, phone, profile picture, display name, rating
4. **Service** - Service details from order items
5. **Scheduled** - Scheduled service time
6. **Status** - Current booking status (pending, accepted, in_progress, completed, cancelled, etc.)
7. **Payment Status** - paid/unpaid
8. **Payment Details** - Method, transaction ID, amount
9. **Amount** - Total booking amount
10. **Created At** - Booking creation timestamp
11. **Updated At** - Last update timestamp
12. **Address** - Service location
13. **Description** - Booking description/notes
14. **Cancel Reason** - If cancelled
15. **Cancelled By** - admin/client/worker

## ✨ Key Features Implemented

### 1. Advanced Filtering & Search
- Filter by status (pending, accepted, in_progress, completed, cancelled, disputed, awaiting)
- Filter by payment status (paid/unpaid)
- Search by booking ID, user name, or worker name (case-insensitive)
- Date range filtering (startDate, endDate)
- Custom sorting (by any field, asc/desc)

### 2. Pagination
- Configurable page size (default: 10, max recommended: 100)
- Total count and total pages in response
- Efficient skip/take pattern

### 3. Comprehensive Data
- User details with profile and addresses
- Worker details with profiles and ratings
- Payment history with transaction details
- Order items and services
- Review information
- Complete audit trail

### 4. Admin Actions
- Update booking status with reasons
- Assign/reassign workers (with validation)
- Cancel bookings with mandatory reasons
- Process refunds (full or partial)
- Add admin notes for internal tracking

### 5. Data Export
- JSON format for API consumption
- CSV format for spreadsheet analysis
- Filtered exports (same filters as main endpoint)
- Proper CSV escaping and formatting

### 6. Statistics Dashboard
- Total bookings count
- Total revenue calculation
- Status breakdown (counts per status)
- Payment statistics (paid vs unpaid)
- Date range filtering for stats

## 🔒 Security Considerations

**IMPORTANT:** These endpoints need to be protected with admin authentication middleware!

Add authentication middleware before deploying to production:

```javascript
// In routes/adminBookingRoutes.js
const { verifyAdmin } = require('../middleware/auth');

// Apply to all routes
router.use(verifyAdmin);

// Or apply to individual routes
router.get('/bookings', verifyAdmin, adminGetAllBookings);
```

## 🧪 Testing Examples

### 1. Get all pending bookings (page 1, 20 items)
```bash
GET /api/admin/bookings?page=1&limit=20&status=pending
```

### 2. Search for bookings by user name
```bash
GET /api/admin/bookings?search=John&page=1&limit=10
```

### 3. Get today's bookings
```bash
GET /api/admin/bookings?startDate=2026-01-22T00:00:00Z&endDate=2026-01-22T23:59:59Z
```

### 4. Update booking status
```bash
PATCH /api/admin/bookings/{id}/status
Content-Type: application/json

{
  "status": "accepted"
}
```

### 5. Assign worker to booking
```bash
PATCH /api/admin/bookings/{id}/assign-worker
Content-Type: application/json

{
  "workerId": "worker-uuid-here"
}
```

### 6. Cancel booking with reason
```bash
PATCH /api/admin/bookings/{id}/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

### 7. Process refund
```bash
POST /api/admin/bookings/{id}/refund
Content-Type: application/json

{
  "refundAmount": 150.00,
  "refundReason": "Service quality issue"
}
```

### 8. Export as CSV
```bash
GET /api/admin/bookings/export?format=csv&status=completed
```

### 9. Get statistics
```bash
GET /api/admin/bookings/stats?startDate=2026-01-01&endDate=2026-01-31
```

## 📝 Response Format

All endpoints return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description"
}
```

## 🎨 Frontend Integration Tips

### Table Display
Use the GET `/api/admin/bookings` endpoint with these fields:
- `bookingId` - Display as clickable link to details
- `user.name` and `user.email` - User column
- `worker.name` and `worker.rating` - Worker column with rating stars
- `service` - Service type/name
- `scheduled` - Format as date/time
- `status` - Display with colored badges
- `paymentStatus` - Show as badge (paid/unpaid)
- `amount` - Format as currency
- `createdAt` - Relative time or formatted date

### Filters & Search
- Add status dropdown (all statuses from enum)
- Add payment status radio/dropdown
- Date range pickers for filtering
- Search input with debouncing
- Sort controls for each column

### Action Buttons
Each row can have:
- View details button → GET `/api/admin/bookings/:id`
- Status change dropdown → PATCH `/api/admin/bookings/:id/status`
- Assign worker button → PATCH `/api/admin/bookings/:id/assign-worker`
- Cancel button → PATCH `/api/admin/bookings/:id/cancel`
- Refund button → POST `/api/admin/bookings/:id/refund`
- Notes button → PATCH `/api/admin/bookings/:id/notes`

### Export Feature
- Add "Export" button with format selection (JSON/CSV)
- Apply current filters to export
- Download file automatically

## ⚡ Performance Notes

1. **Pagination**: Default limit is 10, recommended max is 100 items per page
2. **Indexing**: Database has indexes on `client_id`, `assigned_worker_id`, `status`, and `created_at`
3. **Search**: Uses case-insensitive contains search with OR conditions
4. **Export**: For large datasets, consider limiting to filtered results only
5. **Stats**: Aggregation queries are optimized with groupBy

## 🔄 Next Steps

1. **Add Authentication Middleware**: Protect all routes with admin role check
2. **Add Rate Limiting**: Prevent abuse of export endpoints
3. **Add Logging**: Track admin actions for audit trail
4. **Add Validation Middleware**: Validate request bodies and query params
5. **Add Tests**: Unit and integration tests for all endpoints
6. **Add Notifications**: Notify users/workers of admin actions (status changes, assignments, etc.)

## 📞 Support

For questions or issues, refer to the complete documentation in `ADMIN_BOOKING_API_DOCS.md`.

---

**Status**: ✅ Ready for Testing and Integration
**Version**: 1.0.0
**Last Updated**: January 22, 2026
