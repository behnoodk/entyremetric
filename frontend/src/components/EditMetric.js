// src/components/EditMetric.js
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Checkbox, // Imported Checkbox
} from '@mui/material';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditMetric = () => {
  const { metricId } = useParams();
  const [metric, setMetric] = useState({
    name: '',
    description: '',
    team: '',
    country: '',
    is_above_good: true, // Initialize with default value
  });
  const [countries, setCountries] = useState([]);
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  // State to handle delete confirmation dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    // Fetch existing metric data
    const fetchMetric = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_ROOT_URL}/api/metrics/${metricId}`,
        );
        setMetric({
          name: response.data.name || '',
          description: response.data.description || '',
          team: response.data.team || '',
          country: response.data.country || '',
          is_above_good: response.data.is_above_good === 1 ? true : false, // Convert to boolean
        });
      } catch (error) {
        console.error('Error fetching metric:', error);
        alert('Failed to fetch metric data.');
      }
    };

    // Fetch unique countries and teams for select options
    const fetchCountriesAndTeams = async () => {
      try {
        const metricsResponse = await axios.get(`${process.env.REACT_APP_ROOT_URL}/api/metrics`);
        const allMetrics = metricsResponse.data;

        const uniqueCountries = [...new Set(allMetrics.map((m) => m.country))].filter(Boolean);
        setCountries(uniqueCountries);

        const uniqueTeams = [...new Set(allMetrics.map((m) => m.team))].filter(Boolean);
        setTeams(uniqueTeams);
      } catch (error) {
        console.error('Error fetching countries and teams:', error);
      }
    };

    fetchMetric();
    fetchCountriesAndTeams();
  }, [metricId]);

  // Handle changes to input fields
  const handleMetricChange = (event) => {
    const { name, value } = event.target;
    setMetric({ ...metric, [name]: value });
  };

  // Handle changes to is_above_good checkbox
  const handleIsAboveGoodChange = (event) => {
    setMetric({ ...metric, is_above_good: event.target.checked });
  };

  // Handle form submission to update the metric
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Update the metric
      const response = await axios.put(
        `${process.env.REACT_APP_ROOT_URL}/api/metrics/${metricId}`,
        metric,
      );

      if (response.status === 200) {
        alert('Metric updated successfully!');
        // Navigate back to the Metrics Overview page
        navigate('/');
      } else {
        alert('Failed to update metric.');
      }
    } catch (error) {
      console.error('Error updating metric:', error);
      alert('Failed to update metric.');
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_ROOT_URL}/api/metrics/${metricId}`,
      );
      if (response.status === 200) {
        alert('Metric deleted successfully!');
        navigate('/');
      } else {
        alert('Failed to delete metric.');
      }
    } catch (error) {
      console.error('Error deleting metric:', error);
      alert('Failed to delete metric.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Edit Metric
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Metric Name */}
        <TextField
          label="Metric Name"
          name="name"
          value={metric.name}
          onChange={handleMetricChange}
          variant="outlined"
          style={{ marginBottom: '10px', width: '100%' }}
          required
        />

        {/* Description */}
        <TextField
          label="Description"
          name="description"
          value={metric.description}
          onChange={handleMetricChange}
          variant="outlined"
          style={{ marginBottom: '10px', width: '100%' }}
          multiline
          rows={3}
        />

        {/* Team */}
        <FormControl variant="outlined" style={{ marginBottom: '10px', width: '100%' }}>
          <InputLabel id="team-select-label">Team</InputLabel>
          <Select
            labelId="team-select-label"
            name="team"
            value={metric.team}
            onChange={handleMetricChange}
            label="Team"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {teams.map((team) => (
              <MenuItem key={team} value={team}>
                {team}
              </MenuItem>
            ))}
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        {/* Country */}
        <FormControl variant="outlined" style={{ marginBottom: '20px', width: '100%' }}>
          <InputLabel id="country-select-label">Country</InputLabel>
          <Select
            labelId="country-select-label"
            name="country"
            value={metric.country}
            onChange={handleMetricChange}
            label="Country"
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {countries.map((country) => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        {/* is_above_good Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={metric.is_above_good}
              onChange={handleIsAboveGoodChange}
              name="is_above_good"
              color="primary"
            />
          }
          label="Is it good for the metric to be above the goal?"
          style={{ marginBottom: '20px' }}
        />

        {/* Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            style={{ marginRight: '10px' }}
            disabled={!metric.name.trim()}
            aria-label="Save Changes"
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => navigate('/')}
            style={{ marginRight: '10px' }}
            aria-label="Back to Overview"
          >
            Back to Overview
          </Button>
          {/* Delete Button */}
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenDeleteDialog(true)}
            aria-label="Delete Metric"
          >
            Delete Metric
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Metric</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this metric? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus aria-label="Confirm Delete">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EditMetric;
