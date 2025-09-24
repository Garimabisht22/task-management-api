const express = require('express');
const Joi = require('joi');                  // For input validation
const Task = require('../models/task');      // Task Mongoose model
const router = express.Router();

// ============================
// Validation schema for tasks
// ============================
const taskSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),                       // Required title
  description: Joi.string().max(500).optional(),                        // Optional description
  status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().greater('now').optional()                        // Must be in the future if provided
});

// ============================
// GET all tasks (with filtering, sorting, pagination)
// ============================
router.get('/', async (req, res, next) => {
  try {
    // Extract query parameters for filtering and pagination
    const {
      status,
      priority,
      sortBy = 'createdAt',    // Default sort field
      sortOrder = 'desc',      // Default sort order
      page = 1,
      limit = 10
    } = req.query;

    // Build query object, always filter by logged-in user
    const query = { owner: req.user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with sorting and pagination
    const tasks = await Task.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total task count for pagination
    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error); // Forward errors to global error handler
  }
});

// ============================
// GET single task by ID
// ============================
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id // Ensure user can only access their own tasks
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// ============================
// POST create new task
// ============================
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Create task with current user as owner
    const task = new Task({ ...value, owner: req.user._id });
    await task.save();

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    next(error);
  }
});

// ============================
// PUT update task
// ============================
router.put('/:id', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = taskSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Find task and update it
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // Only allow owner to update
      value,
      { new: true, runValidators: true }           // Return updated doc & validate fields
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    next(error);
  }
});

// ============================
// DELETE task
// ============================
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id // Ensure only owner can delete
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================
// GET task statistics overview
// ============================
router.get('/stats/overview', async (req, res, next) => {
  try {
    // Aggregate tasks by status for the logged-in user
    const stats = await Task.aggregate([
      { $match: { owner: req.user._id } },          // Only current user's tasks
      { $group: { _id: '$status', count: { $sum: 1 } } } // Count tasks per status
    ]);

    // Build overview object with all statuses
    const overview = { total: 0, pending: 0, 'in-progress': 0, completed: 0 };
    stats.forEach(stat => {
      overview[stat._id] = stat.count;
      overview.total += stat.count;
    });

    res.json({ stats: overview });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
