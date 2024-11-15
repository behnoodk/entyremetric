// src/components/MetricsGrid.js

import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, CircularProgress, Snackbar, Alert, Tooltip } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Define color constants for status
const STATUS_COLORS = {
  GOOD: '#386743', // Green
  BAD: '#cf0000', // Red
  NO_DATA: 'gray', // Gray
};

const MetricsGrid = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        // Fetch all metrics
        const metricsResponse = await axios.get(`${process.env.REACT_APP_ROOT_URL}/api/metrics`);
        const allMetrics = metricsResponse.data;

        // For each metric, fetch the latest value and goal
        const metricsWithStatus = await Promise.all(
          allMetrics.map(async (metric) => {
            try {
              // Fetch latest metric value
              const valuesResponse = await axios.get(
                `${process.env.REACT_APP_ROOT_URL}/api/metric-values/${metric.id}`,
              );
              const latestValueData = valuesResponse.data.sort(
                (a, b) => new Date(b.week_start) - new Date(a.week_start),
              )[0]; // Get the latest entry

              // Fetch latest goal
              const goalsResponse = await axios.get(
                `${process.env.REACT_APP_ROOT_URL}/api/goals/${metric.id}`,
              );
              const latestGoalData = goalsResponse.data.sort(
                (a, b) => new Date(b.week_start) - new Date(a.week_start),
              )[0]; // Get the latest entry

              // Determine status
              let status = 'No Data';
              let statusColor = STATUS_COLORS.NO_DATA;

              if (latestValueData && latestGoalData) {
                const value = parseFloat(latestValueData.value);
                const goal = parseFloat(latestGoalData.target_value);

                if (metric.is_above_good) {
                  status = value >= goal ? 'Good' : 'Bad';
                } else {
                  status = value <= goal ? 'Good' : 'Bad';
                }

                statusColor = status === 'Good' ? STATUS_COLORS.GOOD : STATUS_COLORS.BAD;
              }

              return {
                ...metric,
                latestValue: latestValueData ? latestValueData.value : null,
                latestGoal: latestGoalData ? latestGoalData.target_value : null,
                status,
                statusColor,
              };
            } catch (innerError) {
              console.error(`Error fetching data for metric ID ${metric.id}:`, innerError);
              return {
                ...metric,
                latestValue: null,
                latestGoal: null,
                status: 'No Data',
                statusColor: STATUS_COLORS.NO_DATA,
              };
            }
          }),
        );

        setMetrics(metricsWithStatus);
      } catch (outerError) {
        console.error('Error fetching metrics:', outerError);
        setError('Failed to load metrics. Please try again later.');
        setSnackbar({
          open: true,
          message: 'Failed to load metrics.',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetricsData();
  }, []);

  const handleSquareClick = (metricId) => {
    // Navigate to the Dashboard page for the selected metric in a new tab
    window.open(`/dashboard/${metricId}`, '_blank', 'noopener,noreferrer');
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to format the latest goal date (optional)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <CircularProgress />
        <Typography>Loading Metrics...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography color="error">{error}</Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Metrics Overview
      </Typography>

      <Grid container spacing={3}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={metric.id}>
            <Tooltip
              title={
                <>
                  <Typography variant="subtitle2">{metric.name}</Typography>
                  <Typography variant="body2">
                    Latest Value: {metric.latestValue !== null ? metric.latestValue : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Latest Goal: {metric.latestGoal !== null ? metric.latestGoal : 'N/A'}
                  </Typography>
                  <Typography variant="body2">Status: {metric.status}</Typography>
                </>
              }
              arrow
            >
              <Paper
                elevation={3}
                onClick={() => handleSquareClick(metric.id)}
                style={{
                  height: '150px',
                  display: 'flex',
                  flexDirection: 'column', // Arrange content vertically
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: metric.statusColor,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  padding: '10px', // Add padding for better spacing
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0px 4px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label={`Metric: ${metric.name}, Status: ${metric.status}`}
                tabIndex={0} // Make the element focusable
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSquareClick(metric.id);
                  }
                }}
              >
                <Typography
                  variant="h6"
                  style={{ color: '#fff', textAlign: 'center', marginBottom: '5px' }}
                >
                  {metric.name}
                </Typography>
                <Typography variant="body2" style={{ color: '#fff', textAlign: 'center' }}>
                  {metric.country ? `Country: ${metric.country}` : 'Country: N/A'}
                </Typography>
                <Typography variant="body2" style={{ color: '#fff', textAlign: 'center' }}>
                  {metric.team ? `Team: ${metric.team}` : 'Team: N/A'}
                </Typography>
              </Paper>
            </Tooltip>
          </Grid>
        ))}
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MetricsGrid;
