# Task Management API

A RESTful API for task management with user authentication built with Node.js, Express, and MongoDB.

## Features

- User authentication (register, login, logout)
- JWT token-based security
- CRUD operations for tasks
- Task filtering, sorting, and pagination
- Task statistics
- Password hashing
- Input validation

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### Tasks (Protected Routes)
- `GET /api/tasks` - Get all user's tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get single task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats/overview` - Get task statistics

## Local Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with:
    NODE_ENV=development
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
4. Run the server: `npm run dev`

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Joi for validation