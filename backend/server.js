
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const savedSearchRoutes = require('./routes/savedSearchRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    process.env.CLIENT_URL,
    'https://rentproperties.vercel.app',
    'https://rentproperties-git-main-piuskariukinjirus-projects.vercel.app',
    'https://rentproperties-ate25uqg1-piuskariukinjirus-projects.vercel.app',
].filter(Boolean);

// Vercel preview deployment pattern
const vercelPreviewPattern = /^https:\/\/rentproperties-.*-piuskariukinjirus-projects\.vercel\.app$/;

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Check if origin matches Vercel preview pattern
        if (vercelPreviewPattern.test(origin)) {
            return callback(null, true);
        }
        
        // Allow if CLIENT_URL is set and matches
        if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true // If you need to handle cookies or authorization headers
}));
app.use(express.json({ limit: '10mb' })); // For parsing application/json, increased limit for base64 images
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // For parsing application/x-www-form-urlencoded

// API Routes
app.get('/', (req, res) => res.send('LocalRent API Running')); // Simple health check / root route
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved-searches', savedSearchRoutes);


// Basic Error Handling (can be expanded with a dedicated error handling middleware)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Something broke!', error: err.message }); // Send JSON error
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
