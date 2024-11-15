// routes/valueRoutes.js
const express = require('express');
const router = express.Router();
const MetricValue = require('../models/metricValue');

// Get metric values for specified metric IDs and weeks
router.get('/', (req, res) => {
  const { metric_ids, weeks } = req.query;

  if (!metric_ids || !weeks) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }

  const metricIdsArray = metric_ids.split(',').map(Number);
  const weeksArray = weeks.split(',');

  MetricValue.getByMetricsAndWeeks(metricIdsArray, weeksArray, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Get all metric values for a specific metric
router.get('/:metricId', (req, res) => {
  MetricValue.getAllByMetric(req.params.metricId, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Create a new metric value for a specific metric
router.post('/:metricId', (req, res) => {
  const { value, week_start } = req.body;
  MetricValue.create(req.params.metricId, value, week_start, (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.status(201).json(result); // Return the created record with its ID
  });
});

// Update a metric value by ID
router.put('/:id', (req, res) => {
  const { value, week_start } = req.body;
  MetricValue.update(req.params.id, value, week_start, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Metric value updated');
  });
});

// Delete a metric value by ID
router.delete('/:id', (req, res) => {
  MetricValue.delete(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Metric value deleted');
  });
});

module.exports = router;
