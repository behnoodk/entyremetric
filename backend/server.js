// server.js
const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const metricRoutes = require('./routes/metricRoutes');
const valueRoutes = require('./routes/valueRoutes');
const goalRoutes = require('./routes/goalRoutes');
const Metric = require('./models/metric');
const MetricValue = require('./models/metricValue');
const Goal = require('./models/goal');
const migrate = require('./database/migration'); // Import migration

// Middleware
app.use(express.json());

// Configure CORS to allow requests from localhost:3000 (or your frontend port)
app.use(
  cors({
    origin: '*', // Update this to the port of your frontend server
  }),
);

// Initialize database tables
Metric.createTable();
MetricValue.createTable();
Goal.createTable();

// Run migrations
migrate();

// Use routes
app.use('/api/metrics', metricRoutes);
app.use('/api/metric-values', valueRoutes);
app.use('/api/goals', goalRoutes);

// Start the server
const PORT = process.env.PORT || 5012;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
