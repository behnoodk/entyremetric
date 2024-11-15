// routes/goalRoutes.js
const express = require('express');
const router = express.Router();
const Goal = require('../models/goal');

// Get goals for specified metric IDs and weeks
router.get('/', (req, res) => {
  const { metric_ids, weeks } = req.query;

  if (!metric_ids || !weeks) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }

  const metricIdsArray = metric_ids.split(',').map(Number);
  const weeksArray = weeks.split(',');

  Goal.getByMetricsAndWeeks(metricIdsArray, weeksArray, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Get all goals for a specific metric
router.get('/:metricId', (req, res) => {
  Goal.getAllByMetric(req.params.metricId, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Create a new goal for a specific metric
router.post('/:metricId', (req, res) => {
  const { target_value, week_start } = req.body;
  Goal.create(req.params.metricId, target_value, week_start, (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.status(201).json(result); // Return the created record with its ID
  });
});

// Update a goal by ID
router.put('/:id', (req, res) => {
  const { target_value, week_start } = req.body;
  Goal.update(req.params.id, target_value, week_start, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Goal updated');
  });
});

// Delete a goal by ID
router.delete('/:id', (req, res) => {
  Goal.delete(req.params.id, (err) => {
    if (err) return res.status(500).send(err.message);
    res.send('Goal deleted');
  });
});

module.exports = router;
