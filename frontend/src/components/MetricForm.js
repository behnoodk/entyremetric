// src/components/MetricForm.js

import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel, // Imported for Checkbox
  Checkbox, // Imported for Checkbox
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MetricForm = () => {
  const [metric, setMetric] = useState({
    name: '',
    description: '',
    team: '',
    country: '',
    is_above_good: true, // Initialize with default value
  });

  const [uniqueTeams, setUniqueTeams] = useState([]);
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState({
    teams: false,
    countries: false,
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const navigate = useNavigate();

  // Utility function to normalize strings while preserving uppercase acronyms and handling hyphenated words
  const normalizeString = (str) => {
    return str
      .trim()
      .split(' ') // Split by spaces
      .filter((word) => word !== '') // Remove extra spaces
      .map(
        (word) =>
          word
            .split('-') // Split hyphenated words
            .map(
              (part) =>
                part === part.toUpperCase()
                  ? part // Preserve all-uppercase parts
                  : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(), // Capitalize first letter
            )
            .join('-'), // Rejoin hyphenated parts
      )
      .join(' '); // Rejoin words
  };

  // Fetch existing metrics to derive unique teams and countries
  useEffect(() => {
    const fetchExistingData = async () => {
      setLoadingOptions({ teams: true, countries: true });
      try {
        const response = await axios.get(`${process.env.REACT_APP_ROOT_URL}/api/metrics`);
        const allMetrics = response.data;

        // Extract unique teams and countries with normalization
        const teams = [
          ...new Set(
            allMetrics
              .map((metric) => metric.team)
              .filter((team) => team && team.trim() !== '')
              .map((team) => normalizeString(team)),
          ),
        ];

        const countries = [
          ...new Set(
            allMetrics
              .map((metric) => metric.country)
              .filter((country) => country && country.trim() !== '')
              .map((country) => normalizeString(country)),
          ),
        ];

        setUniqueTeams(teams);
        setUniqueCountries(countries);
      } catch (error) {
        console.error('Error fetching existing metrics:', error);
        setSnackbarMessage('Failed to load existing teams and countries.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      } finally {
        setLoadingOptions({ teams: false, countries: false });
      }
    };

    fetchExistingData();
  }, []);

  // Handle changes to input fields
  const handleMetricChange = (event) => {
    const { name, value } = event.target;
    setMetric({ ...metric, [name]: value });
  };

  // Handle changes from Autocomplete components
  const handleAutocompleteChange = (event, newValue, field) => {
    setMetric({ ...metric, [field]: newValue || '' });
  };

  // Handle changes to is_above_good checkbox
  const handleIsAboveGoodChange = (event) => {
    setMetric({ ...metric, is_above_good: event.target.checked });
  };

  // Handle form submission to save the metric
  const handleSubmit = async () => {
    // Validate required fields
    if (!metric.name.trim()) {
      setSnackbarMessage('Metric Name is required.');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }

    try {
      // Normalize team and country names
      const normalizedMetric = {
        ...metric,
        team: metric.team ? normalizeString(metric.team) : '',
        country: metric.country ? normalizeString(metric.country) : '',
      };

      // Create the metric
      const response = await axios.post(
        `${process.env.REACT_APP_ROOT_URL}/api/metrics`,
        normalizedMetric,
      );

      if (response.status === 201) {
        setSnackbarMessage('Metric saved successfully!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        // Navigate back to the Metrics Overview page after a short delay
        setTimeout(() => navigate('/'), 1500);
      } else {
        setSnackbarMessage('Failed to save metric.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error saving metric:', error);
      // Extract error message if available
      const errorMsg = error.response?.data?.message || 'An unexpected error occurred.';
      setSnackbarMessage(`Failed to save metric: ${errorMsg}`);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Handle Snackbar Close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Add New Metric
      </Typography>

      {/* Metric Name */}
      <TextField
        label="Metric Name"
        name="name"
        value={metric.name}
        onChange={handleMetricChange}
        variant="outlined"
        style={{ marginBottom: '20px', width: '100%' }}
        required
      />

      {/* Description */}
      <TextField
        label="Description"
        name="description"
        value={metric.description}
        onChange={handleMetricChange}
        variant="outlined"
        style={{ marginBottom: '20px', width: '100%' }}
        multiline
        rows={3}
      />

      {/* Team Autocomplete */}
      <Autocomplete
        freeSolo
        options={uniqueTeams}
        value={metric.team}
        onChange={(event, newValue) => handleAutocompleteChange(event, newValue, 'team')}
        onInputChange={(event, newInputValue) =>
          handleAutocompleteChange(event, newInputValue, 'team')
        }
        loading={loadingOptions.teams}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Team"
            variant="outlined"
            name="team"
            required
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingOptions.teams ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        style={{ marginBottom: '20px', width: '100%' }}
      />

      {/* Country Autocomplete */}
      <Autocomplete
        freeSolo
        options={uniqueCountries}
        value={metric.country}
        onChange={(event, newValue) => handleAutocompleteChange(event, newValue, 'country')}
        onInputChange={(event, newInputValue) =>
          handleAutocompleteChange(event, newInputValue, 'country')
        }
        loading={loadingOptions.countries}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Country"
            variant="outlined"
            name="country"
            required
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loadingOptions.countries ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        style={{ marginBottom: '20px', width: '100%' }}
      />

      {/* is_above_good Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={metric.is_above_good}
            onChange={handleIsAboveGoodChange}
            name="is_above_good"
            color="primary"
            inputProps={{ 'aria-label': 'Is it good for the metric to be above the goal?' }}
          />
        }
        label="Is it good for the metric to be above the goal?"
        style={{ marginBottom: '20px' }}
      />

      {/* Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!metric.name.trim()}
        >
          Save Metric
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => navigate('/')}>
          Back to Overview
        </Button>
      </div>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MetricForm;
