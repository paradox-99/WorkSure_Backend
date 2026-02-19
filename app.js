const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const workerRoutes = require('./routes/workerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const mailRoutes = require('./routes/mailRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const adminBookingRoutes = require('./routes/adminBookingRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:8080',
        'https://worksure-bd.web.app',
    ],
    credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/userRoutes', userRoutes);
app.use('/api/workerRoutes', workerRoutes);
app.use('/api/orderRoutes', orderRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/paymentRoutes', paymentRoutes);
app.use('/api/categoryRoutes', categoryRoutes);
app.use('/api/admin', adminBookingRoutes);
app.use('/api/complaints', complaintRoutes);

module.exports = app;
