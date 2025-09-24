const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');          // For hashing and comparing passwords
const jwt = require('jsonwebtoken');         // For generating and verifying JWT tokens

// Define User schema (blueprint of how user documents will look in MongoDB)
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],      // Validation: must have a name
    trim: true,                                // Remove extra spaces
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                              // No two users can have the same email
    lowercase: true,                           // Always store emails in lowercase
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] // Email regex
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false                              // Do NOT return password when querying user
  },
  role: {
    type: String,
    enum: ['user', 'admin'],                   // Role can only be "user" or "admin"
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now                          // Auto-set when the user is created
  },
  tokens: [{                                   // Store multiple JWT tokens (for multi-device logins)
    token: {
      type: String,
      required: true
    }
  }]
});

// ===========================
// Mongoose Middleware
// ===========================

// Pre-save hook: Hash the password before saving it into the database
userSchema.pre('save', async function(next) {
  // Only hash password if it was modified (important when updating user info)
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);        // Generate a salt with cost factor 12
  this.password = await bcrypt.hash(this.password, salt); // Hash password with salt
  next();
});

// ===========================
// Instance Methods
// ===========================

// Generate JWT token for authentication
userSchema.methods.generateAuthToken = async function() {
  // Create token with user's id, email, and role
  const token = jwt.sign(
    { _id: this._id, email: this.email, role: this.role }, // payload
    process.env.JWT_SECRET,                                // secret key from .env
    { expiresIn: '7d' }                                    // valid for 7 days
  );
  
  // Save token in user document (so we can support multiple logins/devices)
  this.tokens = this.tokens.concat({ token });
  await this.save();

  return token; // Return token to client
};

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Customize JSON response: hide sensitive fields
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();          // Convert Mongoose doc to plain object
  delete userObject.password;                  // Remove password
  delete userObject.tokens;                    // Remove tokens
  return userObject;
};

// Export User model
module.exports = mongoose.model('User', userSchema);