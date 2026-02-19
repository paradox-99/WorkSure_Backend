# WorkSure - Integrated Service Provider All-in-One Platform (Backend)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Prisma](https://img.shields.io/badge/Prisma-7.1.0-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-316192?logo=postgresql)

**WorkSure** is a comprehensive on-demand service marketplace platform that connects service providers (workers) with clients seeking various professional services. The platform facilitates seamless service booking, payment processing, worker verification, and quality management.

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [API Documentation](#-api-documentation) • [Database Schema](#-database-schema)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Authentication & Authorization](#-authentication--authorization)
- [Payment Integration](#-payment-integration)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Security Considerations](#-security-considerations)
- [Contributing](#-contributing)

---

## 🌟 Overview

WorkSure Backend is a robust RESTful API service built with Node.js and Express.js, designed to power a multi-sided marketplace connecting service providers with customers. The platform handles complex workflows including user management, service booking, real-time notifications, payment processing, worker verification, and dispute resolution.

### Platform Capabilities

- **Multi-Role System**: Supports clients, workers, and administrators with role-based access control
- **Service Marketplace**: Dynamic service categories and sections with flexible pricing models
- **Booking Management**: Complete order lifecycle from creation to completion with status tracking
- **Payment Processing**: Integrated SSLCommerz payment gateway with refund management
- **Verification System**: Multi-stage worker verification with document management
- **Review & Rating**: Comprehensive feedback system for quality assurance
- **Complaint Management**: Structured dispute resolution workflow
- **Geolocation Support**: Address management with latitude/longitude coordinates
- **Email Notifications**: Mailjet integration for transactional emails

---

## 🎯 Key Features

### User Management
- ✅ Multi-role authentication (Client, Worker, Admin)
- ✅ JWT-based secure authentication with HTTP-only cookies
- ✅ Profile management with document verification
- ✅ User status management (Active, Inactive, Suspended)
- ✅ Address management with geolocation support

### Worker Features
- ✅ Worker profile creation with bio and experience
- ✅ Service category and section selection
- ✅ Flexible pricing models (hourly, fixed, etc.)
- ✅ Availability scheduling with weekend management
- ✅ Document verification workflow
- ✅ Rating and review aggregation
- ✅ Worker dashboard with earnings and statistics

### Service Management
- ✅ Multi-level service organization (Categories → Sections)
- ✅ Dynamic service catalog with status management
- ✅ Custom pricing per service
- ✅ Skills and expertise tagging
- ✅ Service search and filtering

### Booking System
- ✅ Multi-status order workflow (Pending → Accepted → In Progress → Completed)
- ✅ Order items with verification support
- ✅ Scheduled service appointments
- ✅ Cancellation with reason tracking
- ✅ Order timeline tracking
- ✅ Review and complaint association

### Payment Processing
- ✅ SSLCommerz payment gateway integration
- ✅ Multiple payment methods (Online, Cash on delivery)
- ✅ Payment status tracking
- ✅ Refund management with status tracking
- ✅ Transaction history and receipts
- ✅ Secure payment verification

### Review & Rating System
- ✅ Post-service reviews and ratings (1-5 stars)
- ✅ Review association with orders
- ✅ Worker rating aggregation
- ✅ Review moderation capabilities

### Complaint Management
- ✅ Multi-category complaint system
- ✅ Priority-based complaint handling
- ✅ Admin review and resolution workflow
- ✅ Attachment support for evidence
- ✅ Status tracking (Open → Under Review → Resolved/Rejected)

### Admin Dashboard
- ✅ User management and suspension
- ✅ Worker verification approval
- ✅ Booking overview and statistics
- ✅ Payment and refund management
- ✅ Complaint resolution
- ✅ Service category management

### Notifications
- ✅ Real-time notification system
- ✅ Email notifications via Mailjet
- ✅ Notification read/unread status
- ✅ User-specific notification feed

---

## 🛠 Technology Stack

### Core Technologies
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 5.2.1 | Web application framework |
| **PostgreSQL** | 14+ | Primary relational database |
| **Prisma ORM** | 7.1.0 | Database ORM and migrations |

### Key Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| **jsonwebtoken** | 9.0.2 | JWT authentication |
| **cookie-parser** | 1.4.7 | Cookie handling |
| **cors** | 2.8.5 | Cross-origin resource sharing |
| **dotenv** | 17.2.3 | Environment configuration |
| **node-mailjet** | 3.3.1 | Email service integration |
| **sslcommerz-lts** | 1.2.0 | Payment gateway |
| **pg** | 8.16.3 | PostgreSQL client |

### Development Tools
- **Nodemon**: Auto-restart during development
- **Prisma Studio**: Database GUI management
- **Vercel**: Serverless deployment platform

---

## 🏗 System Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web App: https://worksure-bd.web.app, Mobile Apps)        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS/REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Express.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CORS Middleware  │  Cookie Parser  │  Body Parser  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Middleware                   │
│     ┌──────────────┬──────────────┬──────────────┐          │
│     │ verifyToken  │ verifyWorker │ verifyAdmin  │          │
│     └──────────────┴──────────────┴──────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Route Layer                             │
│  ┌────────┬─────────┬────────┬──────────┬───────────────┐   │
│  │ Users  │ Workers │ Orders │ Payments │ Complaints ..│   │
│  └────────┴─────────┴────────┴──────────┴───────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Business Logic  │  Validation  │  Error Handling   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────┬──────────────┬─────────────────────────┐   │
│  │   Prisma    │   Payment    │   Email Notifications   │   │
│  │   Queries   │   Gateway    │      (Mailjet)          │   │
│  └─────────────┴──────────────┴─────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database (Prisma ORM)           │   │
│  │  • Users  • Orders  • Payments  • Services           │   │
│  │  • Reviews  • Notifications  • Complaints            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┬────────────────┬──────────────────────┐   │
│  │ SSLCommerz   │    Mailjet     │   File Storage       │   │
│  │  (Payment)   │    (Email)     │   (Future: AWS S3)   │   │
│  └──────────────┴────────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request** → API endpoint with credentials
2. **CORS Validation** → Origin verification
3. **Authentication** → JWT token validation from cookies
4. **Authorization** → Role-based access control (Client/Worker/Admin)
5. **Controller** → Business logic execution
6. **Service Layer** → Database operations via Prisma
7. **Response** → JSON response with appropriate status code

### Database Design Principles

- **Row-Level Security (RLS)**: Enhanced data protection at database level
- **Cascading Deletes**: Automatic cleanup of related records
- **Indexing Strategy**: Optimized queries on frequently accessed columns
- **Timestamp Tracking**: Created/updated timestamps on all major entities
- **UUID Primary Keys**: Distributed system-ready unique identifiers
- **Enum Types**: Type-safe status and role management

---

## 💾 Database Schema

### Entity Relationship Overview

```
users ──┬── addresses
        ├── availabilities
        ├── notifications
        ├── worker_profiles
        ├── worker_services
        ├── verification_documents
        ├── orders (as client)
        ├── orders (as worker)
        ├── payments
        └── reviews

orders ──┬── order_items
         ├── payments
         └── reviews

service_categories ──┬── service_sections
                     └── worker_services

payments ── refunds

complaints (standalone with references)
```

### Core Entities

#### **users** 👤
Primary entity for all platform users (clients, workers, admins)
- **Fields**: email, phone, full_name, gender, date_of_birth, nid, role, status
- **Relations**: 1:N with addresses, orders, payments, reviews, notifications
- **Indexes**: email, id
- **Unique Constraints**: email, phone, nid

#### **worker_profiles** 👷
Extended profile for service providers
- **Fields**: display_name, bio, years_experience, avg_rating, total_reviews, verification
- **Relation**: 1:1 with users
- **Auto-calculated**: avg_rating, total_reviews

#### **service_categories** 📂
Top-level service classification
- **Fields**: slug, name, description, status
- **Relations**: 1:N with service_sections, worker_services
- **Example**: Plumbing, Electrical, Cleaning

#### **service_sections** 📑
Sub-categories within each service category
- **Fields**: category_id, slug, name, description, status
- **Relation**: N:1 with service_categories
- **Example**: Emergency Plumbing, Drain Cleaning (under Plumbing)

#### **worker_services** 💼
Worker's offered services with pricing
- **Fields**: user_id, category_id, section_id, base_price, price_unit, skills
- **Relations**: N:1 with users, service_categories, service_sections
- **Unique**: (user_id, category_id) - one service per category per worker

#### **orders** 📋
Service booking and order management
- **Fields**: client_id, assigned_worker_id, status, work_start, work_end, total_amount
- **Status Flow**: cart → pending → accepted → in_progress → completed
- **Relations**: N:1 with users (client), users (worker), 1:N with order_items, payments
- **Special Fields**: cancel_reason, canceled_by, items_approval, is_reviewed, is_complained

#### **order_items** 📦
Detailed items/services within an order
- **Fields**: order_id, items (JSON), additional_notes, verified
- **Supports**: Flexible item structure with JSON storage

#### **payments** 💳
Payment transactions and records
- **Fields**: order_id, payer_id, payment_method, trx_id, amount, status
- **Status**: pending, paid, failed, refunded, cancelled
- **Relations**: N:1 with orders, users, 1:N with refunds
- **Indexes**: trx_id (gateway transaction ID)

#### **refunds** 💰
Payment refund management
- **Fields**: payment_id, trx_id, refund_amount, refund_reason, refund_status
- **Status**: pending → processing → success/failed
- **Relation**: N:1 with payments

#### **reviews** ⭐
Service quality feedback
- **Fields**: order_id, user_id, worker_id, rating (1-5), comment
- **Relations**: N:1 with orders, users (reviewer), users (worker)
- **Constraints**: Rating between 1-5

#### **complaints** 🚨
Dispute and issue management
- **Fields**: raised_by_user_id, against_user_id, booking_id, category, priority, status
- **Priority**: low, medium, high
- **Status**: open → under_review → resolved/rejected/closed
- **Supports**: Attachments (JSON), admin_notes, resolution

#### **notifications** 🔔
User notification system
- **Fields**: user_id, title, body, is_read, created_at
- **Relation**: N:1 with users

#### **addresses** 📍
User location management with geolocation
- **Fields**: user_id, street, city, district, postal_code, lat, lon
- **Relation**: N:1 with users
- **Supports**: Multiple addresses per user

#### **availabilities** 📅
Worker availability scheduling
- **Fields**: user_id, available_from, available_to, weekend (array)
- **Relation**: N:1 with users

#### **verification_documents** 📄
Worker verification documents
- **Fields**: user_id, document_type, file_url, status, review_comment
- **Status**: pending → verified/rejected
- **Relation**: N:1 with users

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **PostgreSQL** >= 14
- **Git**

### Step-by-Step Installation

1. **Clone the repository**
```bash
git clone https://github.com/paradox-99/WorkSure_Backend.git
cd WorkSure_Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Create .env file in root directory
cp .env.example .env

# Edit .env with your configuration
nano .env
```

4. **Setup PostgreSQL database**
```bash
# Create database
createdb worksure

# Or via psql
psql -U postgres
CREATE DATABASE worksure;
\q
```

5. **Run Prisma migrations**
```bash
# Generate Prisma Client
npm run build

# Apply database migrations (if migration files exist)
npx prisma migrate deploy

# Or push schema directly (development)
npx prisma db push
```

6. **Seed database (optional)**
```bash
# Add seed script if available
npm run seed
```

7. **Start development server**
```bash
npm start

# Or with nodemon for auto-reload
npx nodemon index.js
```

8. **Verify installation**
```bash
curl http://localhost:3000
# Should return: "server is running"
```

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```
Access at `http://localhost:5555` to manage database visually.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
APP_TIMEZONE=Asia/Dhaka

# Database Configuration
WORKSURE_DATABASE_URL="postgresql://username:password@localhost:5432/worksure?schema=public"

# JWT Configuration
ACCESS_TOKEN_SECRET=your_super_secret_jwt_key_here_min_32_chars

# SSLCommerz Payment Gateway
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
SSLCOMMERZ_SUCCESS_URL=https://your-domain.com/api/paymentRoutes/ssl/success
SSLCOMMERZ_FAIL_URL=https://your-domain.com/api/paymentRoutes/ssl/fail
SSLCOMMERZ_CANCEL_URL=https://your-domain.com/api/paymentRoutes/ssl/cancel
SSLCOMMERZ_IPN_URL=https://your-domain.com/api/paymentRoutes/ssl/ipn

# Mailjet Email Service
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key
MAILJET_SENDER_EMAIL=noreply@worksure.com
MAILJET_SENDER_NAME=WorkSure Platform

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,https://worksure-bd.web.app

# File Upload (if configured)
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Security Notes

⚠️ **Never commit `.env` file to version control**
⚠️ **Use strong secrets for production (minimum 32 characters)**
⚠️ **Rotate JWT secrets periodically**
⚠️ **Use environment-specific configuration for staging/production**

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

### API Endpoints Overview

#### 🔹 User Management (`/api/userRoutes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users | ✅ Admin |
| GET | `/adminGetUserData/:id` | Get user by ID | ✅ Admin |
| POST | `/createUser` | Register new user | ❌ Public |
| PATCH | `/updateAddress` | Update user address | ✅ User |
| PATCH | `/updateUser` | Update user profile | ✅ User |
| PATCH | `/suspendUser/:id` | Suspend user account | ✅ Admin |
| PATCH | `/activateUser/:id` | Activate user account | ✅ Admin |

**Sample Request: Create User**
```bash
curl -X POST http://localhost:3000/api/userRoutes/createUser \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "+8801234567890",
    "full_name": "John Doe",
    "gender": "male",
    "date_of_birth": "1990-01-01",
    "role": "client"
  }'
```

#### 🔹 Worker Management (`/api/workerRoutes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/workers` | Get all workers | ❌ Public |
| GET | `/worker/:id` | Get worker details | ❌ Public |
| POST | `/createWorkerProfile` | Create worker profile | ✅ Worker |
| PATCH | `/updateWorkerProfile` | Update worker profile | ✅ Worker |
| POST | `/addService` | Add worker service | ✅ Worker |
| GET | `/services/:workerId` | Get worker services | ❌ Public |
| GET | `/dashboard/stats` | Worker dashboard stats | ✅ Worker |

#### 🔹 Order Management (`/api/orderRoutes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | Get all orders | ✅ Admin |
| GET | `/myOrders` | Get user's orders | ✅ User |
| POST | `/createOrder` | Create new order | ✅ Client |
| PATCH | `/updateOrder/:id` | Update order | ✅ User |
| PATCH | `/acceptOrder/:id` | Accept order | ✅ Worker |
| PATCH | `/completeOrder/:id` | Complete order | ✅ Worker |
| PATCH | `/cancelOrder/:id` | Cancel order | ✅ User |
| POST | `/addReview/:orderId` | Add order review | ✅ Client |

**Sample Request: Create Order**
```bash
curl -X POST http://localhost:3000/api/orderRoutes/createOrder \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your_jwt_token" \
  -d '{
    "assigned_worker_id": "worker-uuid-here",
    "selected_time": "2026-01-30T10:00:00Z",
    "description": "Need plumbing service",
    "address": "123 Main St, Dhaka",
    "items": [
      {
        "service": "Pipe Installation",
        "quantity": 1,
        "price": 500
      }
    ]
  }'
```

#### 🔹 Payment Management (`/api/paymentRoutes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/cash` | Cash payment | ✅ User |
| PATCH | `/verify/:orderId` | Verify payment | ✅ Admin |
| POST | `/ssl/initiate` | Initiate SSL payment | ✅ User |
| POST | `/ssl/success/:tran_id` | Payment success callback | ❌ SSLCommerz |
| POST | `/ssl/fail/:tran_id` | Payment fail callback | ❌ SSLCommerz |
| POST | `/ssl/cancel/:tran_id` | Payment cancel callback | ❌ SSLCommerz |
| POST | `/ssl/ipn/:tran_id` | IPN notification | ❌ SSLCommerz |
| POST | `/refund/:id` | Process refund | ✅ Admin |
| GET | `/refund-status/:refundId` | Check refund status | ✅ User |
| GET | `/admin/refunds` | Get all refunds | ✅ Admin |

#### 🔹 Service Categories (`/api/categoryRoutes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | ❌ Public |
| GET | `/category/:id` | Get category details | ❌ Public |
| POST | `/createCategory` | Create category | ✅ Admin |
| PATCH | `/updateCategory/:id` | Update category | ✅ Admin |
| GET | `/sections/:categoryId` | Get category sections | ❌ Public |

#### 🔹 Complaint Management (`/api/complaints`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/getAllcomplaints` | Get all complaints | ✅ Admin |
| GET | `/getComplaintDetailsById/:id` | Get complaint details | ✅ User |
| POST | `/createComplaint` | Create complaint | ✅ User |
| PATCH | `/updatecomplaintStatus/:id` | Update complaint status | ✅ Admin |

#### 🔹 Admin Dashboard (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/statistics` | Platform statistics | ✅ Admin |
| GET | `/bookings` | All bookings overview | ✅ Admin |
| GET | `/revenue` | Revenue analytics | ✅ Admin |

#### 🔹 Email Service (`/api/mail`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/send` | Send email | ✅ System |
| POST | `/sendOrderConfirmation` | Order confirmation email | ✅ System |
| POST | `/sendPaymentReceipt` | Payment receipt email | ✅ System |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

---

## 🔒 Authentication & Authorization

### Authentication Flow

1. **User Registration** → Creates user account
2. **Token Generation** → JWT token created with user payload
3. **Cookie Storage** → Token stored in HTTP-only cookie
4. **Request Authentication** → Token validated on each request
5. **User Context** → User info attached to request object

### JWT Token Structure

```javascript
{
  id: "user-uuid",
  email: "user@example.com",
  role: "client|worker|admin",
  exp: 1234567890  // Expires in 15 days
}
```

### Middleware Chain

```
Request → verifyToken → verifyRole (Worker/Admin) → Controller
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Client** | • Create orders<br>• Manage own profile<br>• Submit reviews<br>• Make payments<br>• File complaints |
| **Worker** | • Accept/complete orders<br>• Manage services<br>• Update availability<br>• View earnings<br>• Respond to reviews |
| **Admin** | • All client/worker permissions<br>• User management<br>• Worker verification<br>• Complaint resolution<br>• System configuration |

### Protected Route Example

```javascript
// Only workers can access
router.get('/dashboard', verifyToken, verifyWorker, getWorkerDashboard);

// Only admins can access
router.patch('/suspendUser/:id', verifyToken, verifyAdmin, suspendUser);
```

---

## 💳 Payment Integration

### SSLCommerz Integration

WorkSure uses SSLCommerz, Bangladesh's leading payment gateway, for secure online transactions.

#### Payment Flow

```
1. Client initiates payment → /api/paymentRoutes/ssl/initiate
2. Backend validates order → Creates payment record
3. SSLCommerz gateway → User redirected to payment page
4. User completes payment → SSLCommerz processes
5. Callback handling → Success/Fail/Cancel endpoints
6. Payment verification → IPN (Instant Payment Notification)
7. Order status update → Payment marked as paid
8. Email notification → Receipt sent to user
```

#### Supported Payment Methods
- 💳 Credit/Debit Cards (Visa, MasterCard, Amex)
- 🏦 Mobile Banking (bKash, Rocket, Nagad)
- 🏛️ Internet Banking
- 💵 Cash on Delivery (COD)

#### Payment States

```
pending → paid → completed
        → failed
        → cancelled → refunded
```

#### Refund Management

- Admin-initiated refunds
- Automatic refund status tracking
- SSLCommerz refund API integration
- Refund confirmation emails

---

## 📁 Project Structure

```
WorkSure_Backend/
│
├── 📂 config/                  # Configuration files
│   ├── prisma.js              # Prisma client configuration
│   ├── middlewares.js         # Authentication & authorization middleware
│   └── mailjet.js             # Email service configuration
│
├── 📂 controllers/            # Request handlers & business logic
│   ├── userController.js
│   ├── workerController.js
│   ├── orderController.js
│   ├── paymentController.js
│   ├── servicesController.js
│   ├── categoryController.js
│   ├── complaintController.js
│   ├── adminDashboardController.js
│   └── mailController.js
│
├── 📂 routes/                 # API route definitions
│   ├── userRoutes.js
│   ├── workerRoutes.js
│   ├── orderRoutes.js
│   ├── paymentRoutes.js
│   ├── servicesRoutes.js
│   ├── categoryRoutes.js
│   ├── complaintRoutes.js
│   ├── adminBookingRoutes.js
│   └── mailRoutes.js
│
├── 📂 services/              # Business logic services
│   └── workerDashboardService.js
│
├── 📂 utils/                 # Utility functions
│   └── timezone.js           # Timezone handling
│
├── 📂 prisma/                # Prisma ORM
│   └── schema.prisma         # Database schema definition
│
├── 📂 generated/             # Auto-generated Prisma client
│   └── prisma/               # (Created after npm run build)
│
├── 📄 app.js                 # Express app configuration
├── 📄 index.js               # Server entry point
├── 📄 package.json           # Dependencies and scripts
├── 📄 vercel.json            # Vercel deployment config
├── 📄 prisma.config.ts       # Prisma configuration
├── 📄 .env                   # Environment variables (create this)
└── 📄 README.md              # This file
```

### Key Files Explained

- **index.js**: HTTP server initialization and port binding
- **app.js**: Express middleware setup, CORS, routes mounting
- **schema.prisma**: Complete database schema with relations
- **middlewares.js**: JWT verification and role-based guards
- **controllers/**: Business logic for each feature domain
- **routes/**: API endpoint definitions with middleware chaining

---

## 🌐 Deployment

### Vercel Deployment (Serverless)

WorkSure Backend is optimized for deployment on Vercel's serverless platform.

#### Prerequisites
- Vercel account
- Vercel CLI installed: `npm i -g vercel`
- PostgreSQL database (Vercel Postgres or external)

#### Deployment Steps

1. **Login to Vercel**
```bash
vercel login
```

2. **Link project**
```bash
vercel link
```

3. **Configure environment variables**
```bash
# Via Vercel CLI
vercel env add WORKSURE_DATABASE_URL
vercel env add ACCESS_TOKEN_SECRET
vercel env add SSLCOMMERZ_STORE_ID
# ... add all environment variables
```

Or via Vercel Dashboard: Project Settings → Environment Variables

4. **Deploy**
```bash
# Development deployment
vercel

# Production deployment
vercel --prod
```

#### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "./index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

### Alternative Deployment Options

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "index.js"]
```

#### Traditional VPS/Server
```bash
# Install Node.js 18+
# Clone repository
git clone https://github.com/paradox-99/WorkSure_Backend.git
cd WorkSure_Backend

# Install dependencies
npm ci --only=production

# Setup environment
cp .env.example .env
nano .env

# Generate Prisma Client
npm run build

# Run with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name worksure-api
pm2 save
pm2 startup
```

### Database Migration in Production

```bash
# Apply migrations
npx prisma migrate deploy

# Or push schema changes
npx prisma db push --accept-data-loss
```

---

## 🔐 Security Considerations

### Implemented Security Measures

✅ **Authentication & Authorization**
- JWT-based authentication with HTTP-only cookies
- Role-based access control (RBAC)
- Token expiration (15 days)

✅ **Data Protection**
- PostgreSQL row-level security (RLS)
- Password hashing (implement bcrypt)
- SQL injection protection via Prisma ORM

✅ **API Security**
- CORS configuration with whitelisted origins
- Input validation and sanitization
- Rate limiting (recommended: express-rate-limit)

✅ **Payment Security**
- SSLCommerz secure payment gateway
- Transaction verification
- IPN validation

### Security Best Practices

⚠️ **Recommendations for Production**

1. **Environment Variables**
   - Never commit `.env` to version control
   - Use secrets manager (Vercel Secrets, AWS Secrets Manager)
   - Rotate secrets regularly

2. **HTTPS Only**
   - Enforce HTTPS in production
   - Use secure cookies: `sameSite: 'strict', secure: true`

3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

4. **Input Validation**
   - Implement Joi or Zod for request validation
   - Sanitize all user inputs
   - Validate file uploads

5. **Error Handling**
   - Don't expose stack traces in production
   - Log errors securely
   - Use centralized error handler

6. **Database Security**
   - Use connection pooling
   - Implement prepared statements (Prisma handles this)
   - Regular backups
   - Database user with minimal privileges

7. **Dependency Security**
```bash
# Regular security audits
npm audit
npm audit fix

# Update dependencies
npm update
```

---

## 🤝 Contributing

We welcome contributions from the community! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Ensure no breaking changes
   - Test all affected endpoints

5. **Commit with meaningful messages**
   ```bash
   git commit -m "feat: add worker availability filtering"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use consistent indentation (2 spaces)
- Follow JavaScript naming conventions
- Add JSDoc comments for functions
- Use async/await over callbacks
- Handle errors properly

### Pull Request Process

1. Update README.md with any new features
2. Ensure all endpoints are documented
3. Update Prisma schema if database changes
4. Request review from maintainers

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/paradox-99/WorkSure_Backend/issues)
- **Email**: support@worksure.com
- **Website**: https://worksure-bd.web.app

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Powerful open-source database
- **SSLCommerz** - Secure payment gateway
- **Mailjet** - Email delivery service
- **Vercel** - Deployment platform

---

## 📊 Project Status

- ✅ Core API implementation
- ✅ Database schema design
- ✅ Authentication system
- ✅ Payment integration
- ✅ Complaint management
- 🚧 Real-time notifications (WebSocket)
- 🚧 Advanced analytics dashboard
- 🚧 Mobile app support
- 📋 Automated testing suite
- 📋 API documentation with Swagger

---

<div align="center">

**Built with ❤️ by the WorkSure Team**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/paradox-99/WorkSure_Backend/issues) · [Request Feature](https://github.com/paradox-99/WorkSure_Backend/issues)

</div>
