const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const userRoutes = require('./routes/userRoutes');
const workerRoutes = require('./routes/workerRoutes');

const app = express();

app.use(cors({
    origin: [
        'http://localhost:8080',
    ],
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/api/userRoutes', userRoutes);
app.use('/api/workerRoutes', workerRoutes);

module.exports = app;
