// src/components/Dashboard.js
import React, { useEffect, useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Changed from useLocation to useParams
import { format } from 'date-fns'; // Ensure 'format' is imported

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const Dashboard = () => {
  // State variables for metrics and chart data
  const [metrics, setMetrics] = useState([]);
  const [selectedMetricId, setSelectedMetricId] = useState('');
  const [chartData, setChartData] = useState(null);

  // State variables for cascading dropdowns
  const [countries, setCountries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  // State variables for manual Y-axis configuration
  const [yAxisMax, setYAxisMax] = useState('');
  const [yAxisMin, setYAxisMin] = useState('');

  // State variables for error handling and notifications
  const [yAxisMaxError, setYAxisMaxError] = useState(false);
  const [yAxisMinError, setYAxisMinError] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error',
  });

  const { metricId } = useParams(); // Extract metricId from route params

  // Fetch the list of metrics on component mount
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const metricsResponse = await axios.get(`${process.env.REACT_APP_ROOT_URL}/api/metrics`);
        setMetrics(metricsResponse.data);

        // Extract unique countries from metrics data
        const uniqueCountries = [
          ...new Set(metricsResponse.data.map((metric) => metric.country)),
        ].filter(Boolean);
        setCountries(uniqueCountries);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch metrics.',
          severity: 'error',
        });
      }
    };

    fetchMetrics();
  }, []);

  // Handle pre-selection if metricId is present in route params
  useEffect(() => {
    if (metricId) {
      const preSelectMetric = async () => {
        try {
          const metricResponse = await axios.get(
            `${process.env.REACT_APP_ROOT_URL}/api/metrics/${metricId}`,
          );
          const metric = metricResponse.data;

          if (metric) {
            setSelectedCountry(metric.country || '');
            setSelectedTeam(metric.team || '');
            setSelectedMetricId(metric.id);
          } else {
            setSnackbar({
              open: true,
              message: 'Metric not found.',
              severity: 'warning',
            });
          }
        } catch (error) {
          console.error('Error fetching metric for pre-selection:', error);
          setSnackbar({
            open: true,
            message: 'Error fetching metric details.',
            severity: 'error',
          });
        }
      };

      preSelectMetric();
    }
  }, [metricId]);

  // Update teams when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const filteredMetrics = metrics.filter((metric) => metric.country === selectedCountry);
      const uniqueTeams = [...new Set(filteredMetrics.map((metric) => metric.team))].filter(
        Boolean,
      );
      setTeams(uniqueTeams);
    } else {
      setTeams([]);
      setSelectedTeam('');
    }
  }, [selectedCountry, metrics]);

  // Filter metrics based on selectedCountry and selectedTeam
  const filteredMetrics = useMemo(() => {
    return metrics.filter(
      (metric) =>
        (!selectedCountry || metric.country === selectedCountry) &&
        (!selectedTeam || metric.team === selectedTeam),
    );
  }, [metrics, selectedCountry, selectedTeam]);

  // Fetch chart data when selectedMetricId changes or Y-axis configuration changes
  useEffect(() => {
    if (selectedMetricId) {
      fetchChartData(selectedMetricId);
    } else {
      setChartData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetricId, yAxisMax, yAxisMin]);

  // Fetch chart data for the selected metric
  const fetchChartData = async (metricId) => {
    try {
      // Fetch values and goals for the selected metric
      const [valuesResponse, goalsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_ROOT_URL}/api/metric-values/${metricId}`),
        axios.get(`${process.env.REACT_APP_ROOT_URL}/api/goals/${metricId}`),
      ]);

      const values = valuesResponse.data;
      const goals = goalsResponse.data;

      // Get unique sorted weeks from values and goals
      const weeksSet = new Set([
        ...values.map((v) => v.week_start),
        ...goals.map((g) => g.week_start),
      ]);
      const weeks = Array.from(weeksSet).sort();

      // Prepare data arrays
      const metricValues = weeks.map((week) => {
        const valueEntry = values.find((v) => v.week_start === week);
        return valueEntry ? valueEntry.value : null;
      });

      const metricGoals = weeks.map((week) => {
        const goalEntry = goals.find((g) => g.week_start === week);
        return goalEntry ? goalEntry.target_value : null;
      });

      // Determine Y-axis minimum and maximum
      let yMin = undefined;
      let yMax = undefined;

      if (yAxisMin && !isNaN(yAxisMin)) {
        yMin = Number(yAxisMin);
      } else {
        // Optionally, set yMin to the minimum value in data - some padding
        const allValues = [...metricValues, ...metricGoals].filter((val) => val !== null);
        if (allValues.length > 0) {
          yMin = Math.min(...allValues) * 0.9; // 10% padding
          yMin = yMin < 0 ? 0 : yMin; // Ensure yMin is not negative
        }
      }

      if (yAxisMax && !isNaN(yAxisMax)) {
        yMax = Number(yAxisMax);
      } else {
        // Optionally, set yMax to the maximum value in data + some padding
        const allValues = [...metricValues, ...metricGoals].filter((val) => val !== null);
        if (allValues.length > 0) {
          yMax = Math.max(...allValues) * 1.1; // 10% padding
        }
      }

      // Validation: Ensure yMin is less than yMax
      if (yMin !== undefined && yMax !== undefined && yMin >= yMax) {
        setSnackbar({
          open: true,
          message: 'Minimum Y-axis value must be less than the maximum Y-axis value.',
          severity: 'warning',
        });
        return;
      }

      // Prepare chart data with updated colors
      const chartData = {
        labels: weeks.map((week) => format(new Date(week), 'MMM dd')), // Ensure 'format' is defined
        datasets: [
          {
            label: 'Value',
            data: metricValues,
            borderColor: '#386743', // Updated color
            backgroundColor: 'rgba(56, 103, 67, 0.2)', // Updated color with opacity
          },
          {
            label: 'Goal',
            data: metricGoals,
            borderColor: '#592846', // Updated color
            backgroundColor: 'rgba(89, 40, 70, 0.2)', // Updated color with opacity
          },
        ],
      };

      setChartData(chartData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch chart data.',
        severity: 'error',
      });
    }
  };

  // Handlers for dropdown changes
  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setSelectedTeam('');
    setSelectedMetricId('');
    setChartData(null);
    setYAxisMax('');
    setYAxisMin('');
  };

  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
    setSelectedMetricId('');
    setChartData(null);
    setYAxisMax('');
    setYAxisMin('');
  };

  // Handler for metric selection via card click
  const handleMetricSelect = (metricId) => {
    if (metricId === selectedMetricId) {
      // If the clicked metric is already selected, deselect it
      setSelectedMetricId('');
      setChartData(null);
      setYAxisMax('');
      setYAxisMin('');
    } else {
      setSelectedMetricId(metricId);
      setYAxisMax('');
      setYAxisMin('');
    }
  };

  // Handler for Y-axis max input change
  const handleYAxisMaxChange = (event) => {
    setYAxisMax(event.target.value);
    // Reset error state when user modifies input
    if (yAxisMaxError) {
      setYAxisMaxError(false);
    }
  };

  // Handler for Y-axis min input change
  const handleYAxisMinChange = (event) => {
    setYAxisMin(event.target.value);
    // Reset error state when user modifies input
    if (yAxisMinError) {
      setYAxisMinError(false);
    }
  };

  // Handler to apply manual Y-axis max and min
  const applyYAxisSettings = () => {
    // Validation
    const min = parseFloat(yAxisMin);
    const max = parseFloat(yAxisMax);
    const dataMax = chartData
      ? Math.max(
          ...chartData.datasets.flatMap((dataset) => dataset.data).filter((val) => val !== null),
        )
      : 0;
    const dataMin = chartData
      ? Math.min(
          ...chartData.datasets.flatMap((dataset) => dataset.data).filter((val) => val !== null),
        )
      : 0;

    let valid = true;

    if (yAxisMin) {
      if (isNaN(min)) {
        setYAxisMinError(true);
        valid = false;
      } else if (min > (max || dataMax)) {
        setYAxisMinError(true);
        setSnackbar({
          open: true,
          message: 'Minimum Y-axis value cannot exceed the maximum value.',
          severity: 'warning',
        });
        valid = false;
      }
    }

    if (yAxisMax) {
      if (isNaN(max)) {
        setYAxisMaxError(true);
        valid = false;
      } else if (min !== undefined && !isNaN(min) && min >= max) {
        setYAxisMaxError(true);
        setSnackbar({
          open: true,
          message: 'Maximum Y-axis value must be greater than the minimum value.',
          severity: 'warning',
        });
        valid = false;
      } else if (max < dataMax) {
        setSnackbar({
          open: true,
          message: 'Maximum Y-axis value is less than the maximum data value.',
          severity: 'warning',
        });
        valid = false;
      }
    }

    if (valid) {
      // Re-fetch chart data to apply new Y-axis settings
      fetchChartData(selectedMetricId);
      setSnackbar({
        open: true,
        message: 'Y-axis settings applied successfully!',
        severity: 'success',
      });
    }
  };

  // Handler to close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        width: '90%',
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '40px', // Add space at the top for header
        paddingBottom: '40px', // Add space at the bottom for footer
      }}
    >
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Country Selection Dropdown */}
      <FormControl fullWidth variant="outlined" sx={{ marginBottom: '20px' }}>
        <InputLabel id="country-select-label">Select Country</InputLabel>
        <Select
          labelId="country-select-label"
          id="country-select"
          value={selectedCountry}
          onChange={handleCountryChange}
          label="Select Country"
        >
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Team Selection Dropdown */}
      <FormControl
        fullWidth
        variant="outlined"
        sx={{ marginBottom: '20px' }}
        disabled={!selectedCountry}
      >
        <InputLabel id="team-select-label">Select Team</InputLabel>
        <Select
          labelId="team-select-label"
          id="team-select"
          value={selectedTeam}
          onChange={handleTeamChange}
          label="Select Team"
        >
          {teams.map((team) => (
            <MenuItem key={team} value={team}>
              {team}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Metrics Grid */}
      {selectedCountry && selectedTeam && (
        <>
          <Typography variant="h6" gutterBottom>
            Available Metrics
          </Typography>
          <Grid container spacing={2}>
            {filteredMetrics.map((metric) => (
              <Grid item xs={12} sm={6} md={3} key={metric.id}>
                {' '}
                {/* Changed md from 4 to 3 for 4 per row */}
                <Card
                  sx={{
                    backgroundColor: metric.id === selectedMetricId ? '#592846' : '#f5f5f5',
                    color: metric.id === selectedMetricId ? '#FFFFFF' : '#000000',
                    height: '100%',
                  }}
                >
                  <CardActionArea
                    onClick={() => handleMetricSelect(metric.id)}
                    sx={{ height: '100%' }}
                  >
                    <CardContent
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100px', // Reduced height for smaller squares
                      }}
                    >
                      <Typography variant="h6" align="center">
                        {metric.name}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Chart and Y-Axis Configuration */}
      {chartData && (
        <>
          <Typography variant="h6" gutterBottom sx={{ marginTop: '30px' }}>
            Performance Over Time: {metrics.find((m) => m.id === selectedMetricId)?.name}
          </Typography>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    // Use the dataset colors in the legend
                    usePointStyle: true,
                    pointStyle: 'line',
                  },
                },
                // Removed the title plugin as per requirement
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.parsed.y !== null) {
                        label += context.parsed.y;
                      }
                      return label;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true, // Ensures Y-axis starts at 0
                  // Set min and max if provided
                  ...(yAxisMin && !isNaN(yAxisMin) && { min: Number(yAxisMin) }),
                  ...(yAxisMax && !isNaN(yAxisMax) && { max: Number(yAxisMax) }),
                  ticks: {
                    // Optional: Customize tick formatting here
                  },
                },
              },
            }}
          />

          {/* Y-Axis Manual Configuration */}
          <Box
            sx={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' }, // Responsive layout
              gap: '10px',
            }}
          >
            {/* Y-Axis Minimum Configuration */}
            <TextField
              label="Set Y-Axis Minimum"
              variant="outlined"
              value={yAxisMin}
              onChange={handleYAxisMinChange}
              type="number"
              sx={{ flex: 1 }}
              placeholder="Enter minimum value (optional)"
              error={yAxisMinError}
              helperText={yAxisMinError ? 'Invalid minimum value.' : ''}
            />

            {/* Y-Axis Maximum Configuration */}
            <TextField
              label="Set Y-Axis Maximum"
              variant="outlined"
              value={yAxisMax}
              onChange={handleYAxisMaxChange}
              type="number"
              sx={{ flex: 1 }}
              placeholder="Enter maximum value (optional)"
              error={yAxisMaxError}
              helperText={yAxisMaxError ? 'Invalid maximum value.' : ''}
            />

            {/* Apply Button */}
            <Button
              variant="contained"
              onClick={applyYAxisSettings}
              sx={{
                backgroundColor: '#386743',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#2e5633', // Darker shade on hover
                },
                minWidth: '120px',
              }}
            >
              Apply
            </Button>
          </Box>
        </>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
