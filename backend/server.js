
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const savedSearchRoutes = require('./routes/savedSearchRoutes');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Compression middleware - should be early in the middleware stack
app.use(compression());

// CORS configuration
const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    process.env.CLIENT_URL,
    'https://rentproperties.vercel.app',
    'https://rentproperty.vercel.app',
    'https://rentproperties-git-main-piuskariukinjirus-projects.vercel.app',
    'https://rentproperties-ate25uqg1-piuskariukinjirus-projects.vercel.app',
].filter(Boolean);

const vercelPreviewPattern = /^https:\/\/rentproperties-.*-piuskariukinjirus-projects\.vercel\.app$/;

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (vercelPreviewPattern.test(origin)) return callback(null, true);
        if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io setup
const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000,
});

// Store online users
const onlineUsers = new Map();

// Socket.io authentication middleware
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.user.id;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);
    
    // Join user's personal room
    socket.join(`user-${userId}`);
    onlineUsers.set(userId, socket.id);
    
    // Broadcast online status
    io.emit('userOnline', { userId });
    
    // Join conversation rooms
    socket.on('joinConversation', (conversationId) => {
        socket.join(`conversation-${conversationId}`);
        console.log(`User ${userId} joined conversation: ${conversationId}`);
    });
    
    socket.on('leaveConversation', (conversationId) => {
        socket.leave(`conversation-${conversationId}`);
        console.log(`User ${userId} left conversation: ${conversationId}`);
    });
    
    // Typing indicators
    socket.on('typing', ({ conversationId, receiverId }) => {
        socket.to(`user-${receiverId}`).emit('userTyping', { 
            conversationId, 
            userId 
        });
    });
    
    socket.on('stopTyping', ({ conversationId, receiverId }) => {
        socket.to(`user-${receiverId}`).emit('userStoppedTyping', { 
            conversationId, 
            userId 
        });
    });
    
    // Get online status
    socket.on('getOnlineUsers', () => {
        socket.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
    
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        onlineUsers.delete(userId);
        io.emit('userOffline', { userId });
    });
});

// Make io available to routes
app.set('io', io);

// API Routes
app.get('/', (req, res) => res.send('LocalRent API Running'));
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/saved-searches', savedSearchRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ msg: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
