const connectDB = require('./db');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const prisma = require('./prisma');

dotenv.config();

const jwtSecret = process.env.ACCESS_TOKEN_SECRET;

const generateToken = (user, res) => {
    const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.userRole }, jwtSecret, { expiresIn: '15d' });

    return accessToken;
};


const verifyToken = async (req, res, next) => {
    const token = req.cookies?.accessToken;
    console.log("token from verify: ", token);

    if (!token)
        return res.status(401).send({ message: "Unauthorized" })
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err)
            return res.status(403).send({ message: "Forbidden access" })

        req.user = decode
        next();
    })
}

const verifyWorker = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'worker') {
            return res.status(403).json({ message: 'Forbidden: Worker access required' });
        }

        next();
    } catch (error) {
        console.error('Error verifying worker:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const verifyUser = async (req, res, next) => {
    const email = req.user.email;
    const query = `SELECT userRole FROM users WHERE email = ?`;

    connectDB.query(query, [email], (err, results) => {
        if (err) {
            console.log('fetching error: ', err);
            return res.status(500).json({ error: 'Failed to retrieve users' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isUser = results[0].userRole === 'user';
        if (!isUser) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        next();
    })
}

const verifyAgency = async (req, res, next) => {
    const email = req.user.email;
    const query = `SELECT userRole FROM users WHERE email = ?`;

    connectDB.query(query, [email], (err, results) => {
        if (err) {
            console.log('fetching error: ', err);
            return res.status(500).json({ error: 'Failed to retrieve users' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isUser = results[0].userRole === 'agency';
        if (!isUser) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        next();
    })
}

const verifyAdmin = async (req, res, next) => {
    const email = req.user.email;
    const query = `SELECT userRole FROM users WHERE email = ?`;

    connectDB.query(query, [email], (err, results) => {
        if (err) {
            console.log('fetching error: ', err);
            return res.status(500).json({ error: 'Failed to retrieve users' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isUser = results[0].userRole === 'admin';
        if (!isUser) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        next();
    })
}

module.exports = { generateToken, verifyToken, verifyUser, verifyAgency, verifyAdmin, verifyWorker };