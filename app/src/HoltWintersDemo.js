import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Slider, Typography, Paper } from '@mui/material';

// Holt-Winters Triple Exponential Smoothing implementation
const holtWinters = (data, alpha = 0.5, beta = 0.4, gamma = 0.6, seasonalPeriod = 12, forecastSize = 12) => {
  const series = data.map(d => d.value);
  const n = series.length;
  
  // Initialize seasonal components
  const seasonals = Array(seasonalPeriod).fill(0);
  for (let i = 0; i < seasonalPeriod; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i; j < n; j += seasonalPeriod) {
      sum += series[j];
      count++;
    }
    seasonals[i] = sum / count;
  }
  
  // Normalize seasonals
  const seasonalAverage = seasonals.reduce((a, b) => a + b) / seasonalPeriod;
  seasonals.forEach((val, i) => seasonals[i] = val / seasonalAverage);
  
  let level = series[0];
  let trend = (series[seasonalPeriod] - series[0]) / seasonalPeriod;
  
  const results = [];
  
  // Calculate initial values
  for (let i = 0; i < n; i++) {
    const value = series[i];
    const lastLevel = level;
    
    level = alpha * (value / seasonals[i % seasonalPeriod]) + 
            (1 - alpha) * (lastLevel + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
    seasonals[i % seasonalPeriod] = gamma * (value / level) + 
                                   (1 - gamma) * seasonals[i % seasonalPeriod];
    
    results.push({
      ...data[i],
      fitted: (level + trend) * seasonals[i % seasonalPeriod]
    });
  }
  
  // Generate forecasts
  for (let i = 0; i < forecastSize; i++) {
    const forecast = (level + trend * (i + 1)) * 
                    seasonals[(n + i) % seasonalPeriod];
    results.push({
      month: `Forecast ${i + 1}`,
      value: null,
      fitted: forecast
    });
  }
  
  return results;
};

// Sample data
const generateSampleData = () => {
  const data = [];
  for (let i = 0; i < 36; i++) {
    const trend = i * 2;
    const seasonal = Math.sin(i * Math.PI / 6) * 10;
    const random = (Math.random() - 0.5) * 10;
    data.push({
      month: `Month ${i + 1}`,
      value: trend + seasonal + random + 50
    });
  }
  return data;
};

const HoltWintersDemo = () => {
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.4);
  const [gamma, setGamma] = useState(0.6);
  const [data] = useState(generateSampleData());
  
  const processedData = useCallback(() => {
    return holtWinters(data, alpha, beta, gamma);
  }, [data, alpha, beta, gamma]);

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Holt-Winters Forecast Demo
      </Typography>
      
      <Box sx={{ my: 4 }}>
        <Typography gutterBottom>
          Alpha (Level): {alpha.toFixed(2)}
        </Typography>
        <Slider
          value={alpha}
          onChange={(_, value) => setAlpha(value)}
          min={0}
          max={1}
          step={0.01}
          sx={{ mb: 3 }}
        />
        
        <Typography gutterBottom>
          Beta (Trend): {beta.toFixed(2)}
        </Typography>
        <Slider
          value={beta}
          onChange={(_, value) => setBeta(value)}
          min={0}
          max={1}
          step={0.01}
          sx={{ mb: 3 }}
        />
        
        <Typography gutterBottom>
          Gamma (Seasonal): {gamma.toFixed(2)}
        </Typography>
        <Slider
          value={gamma}
          onChange={(_, value) => setGamma(value)}
          min={0}
          max={1}
          step={0.01}
          sx={{ mb: 3 }}
        />
      </Box>
      
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2196F3" 
              name="Actual" 
              dot={{ r: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="fitted" 
              stroke="#4CAF50" 
              name="Fitted/Forecast"
              strokeWidth={2}
              dot={{ r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default HoltWintersDemo;