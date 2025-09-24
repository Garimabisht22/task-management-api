const mongoose = require('mongoose');

// Define Task schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],  // Task must have a title
    trim: true,                                  // Remove extra spaces
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'] // Optional long description
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'], // Only allowed values
    default: 'pending'                             // Default status
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],  // Task priority levels
    default: 'medium'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date(); // Must be in the future if provided
      },
      message: 'Due date must be in the future'
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Reference to a User document
    required: true,
    ref: 'User'                           // Establish relationship with User model
  },
  createdAt: {
    type: Date,
    default: Date.now                     // Timestamp when task is created
  },
  updatedAt: {
    type: Date,
    default: Date.now                     // Timestamp when task is last updated
  }
});

// ============================
// Mongoose Middleware
// ============================

// Update updatedAt automatically before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================
// Indexes
// ============================

// Improves query performance for finding tasks by owner and status
taskSchema.index({ owner: 1, status: 1 });

// Export the Task model
module.exports = mongoose.model('Task', taskSchema);