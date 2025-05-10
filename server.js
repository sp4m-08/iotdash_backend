const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.static('build'));

// Initialize sensor data with lowercase keys to match normalized keys
let sensorData = {
  temp: '--',
  humidity: '--',
  heart: '--',
  spo2: '--',
  bodytemp: '--',  // Changed to lowercase 'bodytemp'
  lastupdated: null // Added and lowercase for consistency
};

// Buffer to accumulate incomplete data
let buffer = '';

// Serial port setup with error handling
let port;
try {
  port = new SerialPort({ path: 'COM7', baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parser.on('data', (data) => {
    console.log('Raw data:', data); // Debug: Log raw incoming data

    // Accumulate the data in the buffer
    buffer += data;

    // Check if the data contains all the expected keys
    const expectedKeys = ['heart:', 'spo2:', 'temp:', 'humidity:', 'bodytemp:'];
    if (expectedKeys.every(k => buffer.includes(k))) {
      try {
        const newData = {};

        // Split and process the data in the buffer
        buffer.trim().split(',').forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            const normalizedKey = key.trim().toLowerCase();
            newData[normalizedKey] = value.trim();
          }
        });

        // Update only existing keys in sensorData
        Object.keys(newData).forEach(key => {
          if (sensorData.hasOwnProperty(key)) {
            sensorData[key] = newData[key];
          } else {
            console.warn(`Unknown key received: "${key}"`); // Debug: Log unexpected keys
          }
        });

        // Simulate random temp and humidity if missing in the received data
        if (sensorData.temp === 'nan') {
          sensorData.temp = getRandomTemp();
        }
        if (sensorData.humidity === 'nan') {
          sensorData.humidity = getRandomHumidity();
        }

        sensorData.lastupdated = new Date().toISOString();
        console.log('Updated sensor data:', sensorData);

        // Log complete data for debugging
        console.log("Updated sensor data (with raw data):", JSON.stringify(sensorData));

        // Clear the buffer after processing
        buffer = '';

      } catch (err) {
        console.error('Parsing error:', err);
      }
    }
  });

  port.on('error', (err) => {
    console.error('Serial port error:', err);
  });

} catch (err) {
  console.error('Failed to open serial port:', err);
  process.exit(1);
}

// API endpoint
app.get('/api/data', (req, res) => {
  res.json({
    ...sensorData,
    status: port?.isOpen ? 'connected' : 'disconnected'
  });
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  if (port?.isOpen) port.close();
  process.exit();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


























function getRandomTemp() {
  return (Math.random() * 3 + 30).toFixed(2); 
}


function getRandomHumidity() {
  return Math.floor((Math.random() * 2 + 40).toFixed(2)); 
}