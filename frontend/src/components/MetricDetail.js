// src/components/MetricDetail.js
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Snackbar, // Imported for notifications
  Alert, // Imported for notifications
  Tooltip, // Imported for tooltips
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { addWeeks, startOfWeek, format } from 'date-fns';
import { ArrowBack, ArrowForward, Warning as WarningIcon } from '@mui/icons-material';

const MetricDetail = () => {
  const { metricId } = useParams();
  const [metric, setMetric] = useState(null);
  const [values, setValues] = useState([]);
  const [goals, setGoals] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0); // New state for week offset
  const navigate = useNavigate();

  // New state to store IDs of existing values and goals
  const [valueIds, setValueIds] = useState([]);
  const [goalIds, setGoalIds] = useState([]);

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Fetch metric data
    axios
      .get(`${process.env.REACT_APP_ROOT_URL}/api/metrics/${metricId}`)
      .then((response) => {
        setMetric(response.data);
      })
      .catch((error) => {
        console.error('Error fetching metric:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch metric data.',
          severity: 'error',
        });
      });
  }, [metricId]);

  useEffect(() => {
    // Calculate weeks based on weekOffset
    const currentWeekStart = startOfWeek(new Date());
    const adjustedWeekStart = addWeeks(currentWeekStart, weekOffset);
    const weeksArray = [];
    let currentIndex = null;
    for (let i = -4; i <= 4; i++) {
      const weekStart = addWeeks(adjustedWeekStart, i);
      weeksArray.push(format(weekStart, 'yyyy-MM-dd'));
      if (i === 0) {
        currentIndex = weeksArray.length - 1;
      }
    }
    setWeeks(weeksArray);
    setCurrentWeekIndex(currentIndex);
  }, [weekOffset]);

  useEffect(() => {
    // Fetch values and goals for the metric over the calculated weeks
    if (weeks.length > 0) {
      // Fetch values
      axios
        .get(`${process.env.REACT_APP_ROOT_URL}/api/metric-values/${metricId}`)
        .then((response) => {
          const valuesArray = [];
          const idsArray = [];
          weeks.forEach((week) => {
            const dataForWeek = response.data.find((d) => d.week_start === week);
            if (dataForWeek) {
              valuesArray.push(dataForWeek.value);
              idsArray.push(dataForWeek.id);
            } else {
              valuesArray.push('');
              idsArray.push(null);
            }
          });
          setValues(valuesArray);
          setValueIds(idsArray);
        })
        .catch((error) => {
          console.error('Error fetching metric values:', error);
          setSnackbar({
            open: true,
            message: 'Failed to fetch metric values.',
            severity: 'error',
          });
        });

      // Fetch goals
      axios
        .get(`${process.env.REACT_APP_ROOT_URL}/api/goals/${metricId}`)
        .then((response) => {
          const goalsArray = [];
          const idsArray = [];
          weeks.forEach((week) => {
            const dataForWeek = response.data.find((d) => d.week_start === week);
            if (dataForWeek) {
              goalsArray.push(dataForWeek.target_value);
              idsArray.push(dataForWeek.id);
            } else {
              goalsArray.push('');
              idsArray.push(null);
            }
          });
          setGoals(goalsArray);
          setGoalIds(idsArray);
        })
        .catch((error) => {
          console.error('Error fetching goals:', error);
          setSnackbar({
            open: true,
            message: 'Failed to fetch goals.',
            severity: 'error',
          });
        });
    }
  }, [metricId, weeks]);

  const handleValueChange = (weekIndex, newValue) => {
    const updatedValues = [...values];
    updatedValues[weekIndex] = newValue;
    setValues(updatedValues);
  };

  const handleGoalChange = (weekIndex, newGoal) => {
    const updatedGoals = [...goals];
    updatedGoals[weekIndex] = newGoal;
    setGoals(updatedGoals);
  };

  const handleSave = async () => {
    try {
      // Save values
      const valuePromises = values.map((value, index) => {
        const week = weeks[index];
        const id = valueIds[index];
        if (value !== '') {
          if (id) {
            // Update existing value
            return axios.put(`${process.env.REACT_APP_ROOT_URL}/api/metric-values/${id}`, {
              value: parseFloat(value),
              week_start: week,
            });
          } else {
            // Create new value
            return axios.post(`${process.env.REACT_APP_ROOT_URL}/api/metric-values/${metricId}`, {
              value: parseFloat(value),
              week_start: week,
            });
          }
        } else if (id) {
          // Delete the value if input is empty
          return axios.delete(`${process.env.REACT_APP_ROOT_URL}/api/metric-values/${id}`);
        }
        return Promise.resolve(); // Return a resolved promise for null actions
      });

      // Save goals
      const goalPromises = goals.map((goal, index) => {
        const week = weeks[index];
        const id = goalIds[index];
        if (goal !== '') {
          if (id) {
            // Update existing goal
            return axios.put(`${process.env.REACT_APP_ROOT_URL}/api/goals/${id}`, {
              target_value: parseFloat(goal),
              week_start: week,
            });
          } else {
            // Create new goal
            return axios.post(`${process.env.REACT_APP_ROOT_URL}/api/goals/${metricId}`, {
              target_value: parseFloat(goal),
              week_start: week,
            });
          }
        } else if (id) {
          // Delete the goal if input is empty
          return axios.delete(`${process.env.REACT_APP_ROOT_URL}/api/goals/${id}`);
        }
        return Promise.resolve(); // Return a resolved promise for null actions
      });

      await Promise.all([...valuePromises, ...goalPromises]);

      setSnackbar({
        open: true,
        message: 'Data saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save data.',
        severity: 'error',
      });
    }
  };

  const determineStatus = (value, goal) => {
    if (value === '' || goal === '') return 'No Data';
    if (metric.is_above_good) {
      return value >= goal ? 'Good' : 'Bad';
    } else {
      return value <= goal ? 'Good' : 'Bad';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good':
        return 'green';
      case 'Bad':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (!metric || weeks.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <CircularProgress />
        <Typography>Loading...</Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        {metric.name}
      </Typography>

      {/* Week Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <IconButton onClick={() => setWeekOffset((prev) => prev - 1)} aria-label="Previous Weeks">
          <ArrowBack />
        </IconButton>
        <Typography variant="h6" style={{ flexGrow: 1, textAlign: 'center' }}>
          Weeks {format(new Date(weeks[0]), 'MMM dd, yyyy')} -{' '}
          {format(new Date(weeks[weeks.length - 1]), 'MMM dd, yyyy')}
        </Typography>
        <IconButton onClick={() => setWeekOffset((prev) => prev + 1)} aria-label="Next Weeks">
          <ArrowForward />
        </IconButton>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            {/* Display Metric Status */}
            <TableRow>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              {weeks.map((week, index) => {
                const status = determineStatus(values[index], goals[index]);
                return (
                  <TableCell key={index}>
                    <Typography style={{ color: getStatusColor(status), fontWeight: 'bold' }}>
                      {status}
                    </Typography>
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Weeks Header */}
            <TableRow>
              <TableCell>
                <strong>Week</strong>
              </TableCell>
              {weeks.map((week, index) => (
                <TableCell
                  key={index}
                  style={index === currentWeekIndex ? { backgroundColor: '#e0f7fa' } : {}}
                >
                  {format(new Date(week), 'MMM dd')}
                </TableCell>
              ))}
            </TableRow>

            {/* Values Row */}
            <TableRow>
              <TableCell>
                <strong>Value</strong>
              </TableCell>
              {values.map((value, index) => (
                <TableCell key={index}>
                  <TextField
                    type="number"
                    value={value || ''}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      readOnly: false,
                    }}
                    aria-label={`Value for week ${format(new Date(weeks[index]), 'MMM dd')}`}
                  />
                </TableCell>
              ))}
            </TableRow>

            {/* Goals Row */}
            <TableRow>
              <TableCell>
                <strong>Goal</strong>
              </TableCell>
              {goals.map((goal, index) => (
                <TableCell key={index}>
                  <TextField
                    type="number"
                    value={goal || ''}
                    onChange={(e) => handleGoalChange(index, e.target.value)}
                    variant="outlined"
                    fullWidth
                    aria-label={`Goal for week ${format(new Date(weeks[index]), 'MMM dd')}`}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Save and Back to Overview Buttons */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          aria-label="Save Changes"
          style={{ marginRight: '10px' }}
        >
          Save Changes
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate('/')}
          aria-label="Back to Overview"
        >
          Back to Overview
        </Button>
      </div>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MetricDetail;
