const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(cors());
app.use(express.static('build'));

let sensorData = {
  temp: '--',
  humidity: '--',
  heart: '--',
  spo2: '--',
  bodytemp: '--',
  lastupdated: null
};

let buffer = '';

let port;
try {
  port = new SerialPort({ path: 'COM7', baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parser.on('data', (data) => {
    buffer += data;

    const expectedKeys = ['heart:', 'spo2:', 'temp:', 'humidity:', 'bodytemp:'];
    if (expectedKeys.every(k => buffer.includes(k))) {
      try {
        const newData = {};
        buffer.trim().split(',').forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            const normalizedKey = key.trim().toLowerCase();
            newData[normalizedKey] = value.trim();
          }
        });

        Object.keys(newData).forEach(key => {
          if (sensorData.hasOwnProperty(key)) {
            sensorData[key] = newData[key];
          }
        });

        sensorData.lastupdated = new Date().toISOString();
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

//fetching data
app.get('/api/data', (req, res) => {
  res.json({
    ...sensorData,
    status: port?.isOpen ? 'connected' : 'disconnected'
  });
});

process.on('SIGINT', () => {
  if (port?.isOpen) port.close();
  process.exit();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});










//old version with esp8266
// const express = require('express');
// const cors = require('cors');
// const { SerialPort } = require('serialport');
// const { ReadlineParser } = require('@serialport/parser-readline');

// const app = express();
// app.use(cors());
// app.use(express.static('build'));


// let sensorData = {
//   temp: '--',
//   humidity: '--',
//   heart: '--',
//   spo2: '--',
//   bodytemp: '--',  
//   lastupdated: null 
// };


// let buffer = '';


// let port;
// try {
//   port = new SerialPort({ path: 'COM7', baudRate: 115200 });
//   const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

//   parser.on('data', (data) => {
//     console.log('Raw data:', data); 

  
//     buffer += data;

   
//     const expectedKeys = ['heart:', 'spo2:', 'temp:', 'humidity:', 'bodytemp:'];
//     if (expectedKeys.every(k => buffer.includes(k))) {
//       try {
//         const newData = {};

        
//         buffer.trim().split(',').forEach(pair => {
//           const [key, value] = pair.split(':');
//           if (key && value) {
//             const normalizedKey = key.trim().toLowerCase();
//             newData[normalizedKey] = value.trim();
//           }
//         });

     
//         Object.keys(newData).forEach(key => {
//           if (sensorData.hasOwnProperty(key)) {
//             sensorData[key] = newData[key];
//           } else {
//             console.warn(`Unknown key received: "${key}"`); 
//           }
//         });

        
//         if (sensorData.temp === 'nan') {
//           sensorData.temp = getRandomTemp();
//         }
//         if (sensorData.humidity === 'nan') {
//           sensorData.humidity = getRandomHumidity();
//         }

//         sensorData.lastupdated = new Date().toISOString();
//         console.log('Updated sensor data:', sensorData);

//         console.log("Updated sensor data (with raw data):", JSON.stringify(sensorData));

        
//         buffer = '';

//       } catch (err) {
//         console.error('Parsing error:', err);
//       }
//     }
//   });

//   port.on('error', (err) => {
//     console.error('Serial port error:', err);
//   });

// } catch (err) {
//   console.error('Failed to open serial port:', err);
//   process.exit(1);
// }


// app.get('/api/data', (req, res) => {
//   res.json({
//     ...sensorData,
//     status: port?.isOpen ? 'connected' : 'disconnected'
//   });
// });


// process.on('SIGINT', () => {
//   if (port?.isOpen) port.close();
//   process.exit();
// });

// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


























// function getRandomTemp() {
//   return (Math.random() * 3 + 30).toFixed(2); 
// }


// function getRandomHumidity() {
//   return Math.floor((Math.random() * 2 + 40).toFixed(2)); 
// }
