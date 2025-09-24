// Load environment variables from a .env file into process.env
require('dotenv').config();

// Import required packages
const express = require('express');   // Web framework for building APIs
const mongoose = require('mongoose'); // MongoDB object modeling tool
const cors = require('cors');         // Enables Cross-Origin Resource Sharing
const helmet = require('helmet');     // Adds extra security headers to HTTP responses

// Import routes
const authRoutes = require('./routes/auth');   // Authentication-related routes
const taskRoutes = require('./routes/tasks');  // Task management routes

// Import custom middleware
const errorHandler = require('./middleware/errorHandler'); // Global error handler
const auth = require('./middleware/auth');                 // Authentication middleware

// Initialize Express app
const app = express();

// Apply security middleware
app.use(helmet()); // Protects app from common security vulnerabilities
app.use(cors());   // Allows requests from different origins (frontend apps, etc.)

// Apply body parsing middleware
app.use(express.json());                       // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)  // Connection string stored in .env file
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define routes
app.use('/api/auth', authRoutes);                 // Public auth routes (register/login)
app.use('/api/tasks', auth, taskRoutes);          // Task routes (protected by auth middleware)

// Root route (helpful for testing and documentation)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Task Management API is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      // Auth endpoints
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout',
      
      // Task endpoints (require authentication)
      getTasks: 'GET /api/tasks',
      createTask: 'POST /api/tasks',
      getTask: 'GET /api/tasks/:id',
      updateTask: 'PUT /api/tasks/:id',
      deleteTask: 'DELETE /api/tasks/:id',
      getStats: 'GET /api/tasks/stats/overview'
    }
  });
});

// Health check endpoint (useful for monitoring and load balancers)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Global error handling middleware (must be defined last)
app.use(errorHandler);

// Catch-all for undefined routes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server on given port (from env or default to 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 Visit: http://localhost:${PORT}`);
});
