const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const workerRoutes = require('./routes/workerRoutes');
// const agencyRoutes = require('./routes/agencyRoutes');
// const driverRoutes = require('./routes/driverRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const authorizationRoutes = require('./routes/authorization');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/api/userRoutes', userRoutes);
app.use('/api/workerRoutes', workerRoutes);
// app.use('/api/agencyRoutes', agencyRoutes);
// app.use('/api/driverRoutes', driverRoutes);
// app.use('/api/paymentRoutes', paymentRoutes);
// app.use('/api/authorization', authorizationRoutes);

module.exports = app;
