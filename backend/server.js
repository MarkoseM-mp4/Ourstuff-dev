const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');
const rentalRoutes = require('./routes/rentals');
const communityRoutes = require('./routes/community');
const reviewRoutes = require('./routes/reviews');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');

// Import error handler
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// ================================
// MIDDLEWARE
// ================================
app.use(helmet({ crossOriginResourcePolicy: false })); // Basic security headers, CORP false for Cloudinary 
app.use(compression()); // Gzip compress responses for speed
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://ourstuff-dev-frontend.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'null', // file:// requests appear as origin: null
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, mobile apps)
        // and requests from file:// (origin === undefined or 'null')
        if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// ================================
// ROUTES
// ================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'OurStuff API is running' });
});

// ================================
// ERROR HANDLER (must be last)
// ================================
app.use(errorHandler);

// ================================
// DATABASE + START SERVER
// ================================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
