require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Route modules — each is scoped to a specific domain entity.
const authRoutes = require('./src/routes/auth');
const teacherRoutes = require('./src/routes/teachers');
const subjectRoutes = require('./src/routes/subjects');
const programRoutes = require('./src/routes/programs');
const departmentRoutes = require('./src/routes/departments');
const routineRoutes = require('./src/routes/routines');
const approvalRoutes = require('./src/routes/approvals');

const app = express();

// Global middleware:
// cors() enables cross-origin requests so a frontend on a different port/domain
// can communicate with the API.
// express.json() parses incoming JSON request bodies into req.body.
app.use(cors());
app.use(express.json());

// Connect to MongoDB before handling any requests.
connectDB();

// Mount route groups under the /api prefix.
// Each router handles its own authentication and authorisation via middleware.
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/approvals', approvalRoutes);

// Simple health-check endpoint for load balancers and monitoring.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Listen on the port specified in the environment or default to 5000.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
