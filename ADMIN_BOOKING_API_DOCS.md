# Admin Booking Management API Documentation

## Base URL
```
/api/admin
```

## Endpoints

### 1. Get All Bookings (with filters & pagination)
**GET** `/api/admin/bookings`

Returns a paginated list of all bookings with comprehensive details including user, worker, service, payment, and scheduling information.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| status | string | No | - | Filter by booking status (pending, accepted, in_progress, completed, cancelled, disputed, awaiting) |
| paymentStatus | string | No | - | Filter by payment status (paid, unpaid) |
| search | string | No | - | Search by booking ID, user name, or worker name |
| startDate | string | No | - | Filter bookings created after this date (ISO 8601) |
| endDate | string | No | - | Filter bookings created before this date (ISO 8601) |
| sortBy | string | No | created_at | Sort field (created_at, total_amount, status) |
| sortOrder | string | No | desc | Sort order (asc, desc) |

#### Example Request
```bash
GET /api/admin/bookings?page=1&limit=20&status=pending&paymentStatus=paid&search=John&sortBy=created_at&sortOrder=desc
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "uuid-string",
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "profilePicture": "url"
      },
      "worker": {
        "id": "worker-uuid",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567891",
        "profilePicture": "url",
        "displayName": "Jane's Services",
        "rating": "4.5"
      },
      "service": {...},
      "scheduled": "2026-01-25T10:00:00Z",
      "status": "pending",
      "paymentStatus": "paid",
      "paymentDetails": {
        "id": "payment-uuid",
        "amount": "150.00",
        "status": "paid",
        "payment_method": "credit_card",
        "trx_id": "TXN123456",
        "paid_at": "2026-01-22T09:00:00Z"
      },
      "amount": 150.00,
      "createdAt": "2026-01-22T08:00:00Z",
      "updatedAt": "2026-01-22T09:00:00Z",
      "address": "123 Main St, City",
      "description": "Regular cleaning service",
      "cancelReason": null,
      "canceledBy": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

---

### 2. Get Booking Statistics
**GET** `/api/admin/bookings/stats`

Returns statistical overview of bookings including counts by status and revenue information.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Filter stats from this date |
| endDate | string | No | Filter stats until this date |

#### Example Response
```json
{
  "success": true,
  "data": {
    "totalBookings": 250,
    "totalRevenue": 45000.00,
    "statusCounts": [
      { "status": "pending", "count": 25 },
      { "status": "accepted", "count": 30 },
      { "status": "in_progress", "count": 15 },
      { "status": "completed", "count": 150 },
      { "status": "cancelled", "count": 30 }
    ],
    "paymentStats": [
      { "paymentCompleted": true, "count": 180, "totalAmount": 45000.00 },
      { "paymentCompleted": false, "count": 70, "totalAmount": 0 }
    ]
  }
}
```

---

### 3. Get Single Booking Details
**GET** `/api/admin/bookings/:id`

Returns comprehensive details of a specific booking.

#### Example Request
```bash
GET /api/admin/bookings/uuid-booking-id
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "accepted",
    "selected_time": "2026-01-25T10:00:00Z",
    "work_start": null,
    "work_end": null,
    "total_amount": "150.00",
    "payment_completed": true,
    "created_at": "2026-01-22T08:00:00Z",
    "updated_at": "2026-01-22T09:00:00Z",
    "address": "123 Main St, City",
    "description": "Regular cleaning service",
    "cancel_reason": null,
    "canceled_by": null,
    "items_approval": null,
    "users_orders_client_idTousers": {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "profile_picture": "url",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "addresses": [...]
    },
    "users_orders_assigned_worker_idTousers": {
      "id": "worker-uuid",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567891",
      "profile_picture": "url",
      "worker_profiles": {
        "display_name": "Jane's Services",
        "bio": "Professional cleaner with 5 years experience",
        "years_experience": 5,
        "avg_rating": "4.5",
        "total_reviews": 120,
        "verification": "verified"
      }
    },
    "payments": [...],
    "order_items": [...],
    "reviews": [...]
  }
}
```

---

### 4. Update Booking Status
**PATCH** `/api/admin/bookings/:id/status`

Updates the status of a booking. Admin can change to any valid status.

#### Request Body
```json
{
  "status": "accepted",
  "reason": "Optional reason for status change (required for cancellation)"
}
```

#### Valid Status Values
- `pending`
- `accepted`
- `in_progress`
- `completed`
- `cancelled`
- `disputed`
- `awaiting`

#### Example Response
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "id": "uuid-string",
    "status": "accepted",
    "cancel_reason": null,
    "updated_at": "2026-01-22T10:00:00Z"
  }
}
```

---

### 5. Assign/Reassign Worker
**PATCH** `/api/admin/bookings/:id/assign-worker`

Assigns or reassigns a worker to a booking.

#### Request Body
```json
{
  "workerId": "worker-uuid-string"
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Worker assigned successfully",
  "data": {
    "id": "booking-uuid",
    "assigned_worker_id": "worker-uuid",
    "users_orders_assigned_worker_idTousers": {
      "id": "worker-uuid",
      "full_name": "Jane Smith",
      "email": "jane@example.com"
    },
    "updated_at": "2026-01-22T10:00:00Z"
  }
}
```

---

### 6. Cancel Booking
**PATCH** `/api/admin/bookings/:id/cancel`

Cancels a booking with a reason. Cannot cancel completed bookings.

#### Request Body
```json
{
  "reason": "Customer requested cancellation"
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "booking-uuid",
    "status": "cancelled",
    "cancel_reason": "Customer requested cancellation",
    "canceled_by": "admin",
    "updated_at": "2026-01-22T10:00:00Z"
  }
}
```

---

### 7. Process Refund
**POST** `/api/admin/bookings/:id/refund`

Processes a refund for a paid booking. Updates payment status to 'refunded'.

#### Request Body
```json
{
  "refundAmount": 150.00,
  "refundReason": "Service not completed as expected"
}
```

**Note:** If `refundAmount` is not provided, the full payment amount will be refunded.

#### Example Response
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "status": "cancelled",
      "cancel_reason": "Service not completed as expected",
      "canceled_by": "admin"
    },
    "payment": {
      "id": "payment-uuid",
      "status": "refunded"
    },
    "refundAmount": 150.00
  }
}
```

---

### 8. Update Admin Notes
**PATCH** `/api/admin/bookings/:id/notes`

Updates admin-only notes for a booking (stored in description field).

#### Request Body
```json
{
  "notes": "Customer called to reschedule. Follow up needed."
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Notes updated successfully",
  "data": {
    "id": "booking-uuid",
    "description": "Customer called to reschedule. Follow up needed.",
    "updated_at": "2026-01-22T10:00:00Z"
  }
}
```

---

### 9. Export Bookings Data
**GET** `/api/admin/bookings/export`

Exports booking data in JSON or CSV format based on filters.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| paymentStatus | string | No | Filter by payment status |
| startDate | string | No | Filter from date |
| endDate | string | No | Filter until date |
| format | string | No | Export format: `json` or `csv` (default: json) |

#### Example Requests
```bash
# Export as JSON
GET /api/admin/bookings/export?status=completed&format=json

# Export as CSV
GET /api/admin/bookings/export?startDate=2026-01-01&endDate=2026-01-31&format=csv
```

#### JSON Response Example
```json
{
  "success": true,
  "count": 150,
  "exportedAt": "2026-01-22T10:00:00Z",
  "data": [...]
}
```

#### CSV Response
Returns a CSV file with headers:
```
Booking ID,User Name,User Email,User Phone,Worker Name,Worker Email,Worker Phone,Status,Scheduled Time,Amount,Payment Status,Payment Method,Transaction ID,Address,Created At
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description (in development)"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Resource Not Found
- `500` - Internal Server Error

---

## Table View Fields

For displaying bookings in an admin dashboard table, the main endpoint returns these key fields:

1. **Booking ID** - Unique identifier (`bookingId`)
2. **User** - Client name, email, phone (`user.name`, `user.email`, `user.phone`)
3. **Worker** - Worker name, rating (`worker.name`, `worker.rating`)
4. **Service** - Service details from order items (`service`)
5. **Scheduled** - Scheduled time for service (`scheduled`)
6. **Status** - Current booking status (`status`)
7. **Payment** - Payment status and method (`paymentStatus`, `paymentDetails.payment_method`)
8. **Amount** - Total booking amount (`amount`)
9. **Created At** - Booking creation date (`createdAt`)

---

## Authentication & Authorization

**Note:** These endpoints should be protected with admin authentication middleware. Add the middleware to protect these routes:

```javascript
// Example middleware usage
const { verifyAdmin } = require('../middleware/auth');

router.get('/bookings', verifyAdmin, adminGetAllBookings);
```

---

## Usage Examples

### Fetch bookings for today with pending status
```bash
curl -X GET "http://localhost:3000/api/admin/bookings?status=pending&startDate=2026-01-22T00:00:00Z&endDate=2026-01-22T23:59:59Z"
```

### Search for a specific user's bookings
```bash
curl -X GET "http://localhost:3000/api/admin/bookings?search=john&page=1&limit=10"
```

### Update booking status to completed
```bash
curl -X PATCH "http://localhost:3000/api/admin/bookings/{id}/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Assign a worker to booking
```bash
curl -X PATCH "http://localhost:3000/api/admin/bookings/{id}/assign-worker" \
  -H "Content-Type: application/json" \
  -d '{"workerId": "worker-uuid"}'
```

### Export all completed bookings as CSV
```bash
curl -X GET "http://localhost:3000/api/admin/bookings/export?status=completed&format=csv" \
  --output bookings-export.csv
```

---

## Additional Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Amounts are in decimal format with 2 decimal places
3. The export endpoint supports large datasets - use filters for better performance
4. Pagination default is 10 items per page, max recommended is 100
5. Search is case-insensitive and searches across booking ID, user name, and worker name
6. When cancelling or refunding, the system automatically updates related records
7. Admin actions are tracked in the `canceled_by` field when applicable
