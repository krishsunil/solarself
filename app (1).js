const express = require('express');
const path = require('path');
const { sunTimes, sunPosition, formatHM, dayOfYear } = require('./solar');

const ROOT = path.join(__dirname, '..');

// Parse a number query parameter and check it lies in [min, max].
function numberParam(value, name, min, max) {
  const n = Number(value);
  if (value === undefined || value === '' || !Number.isFinite(n) || n < min || n > max) {
    return { error: `${name} must be a number between ${min} and ${max}` };
  }
  return { value: n };
}

// Today's date in UTC as YYYY-MM-DD (used when no date is supplied).
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function createApp() {
  const app = express();

  // Serve only the front-end folders. Server source and config are not exposed.
  app.use('/css', express.static(path.join(ROOT, 'css')));
  app.use('/js', express.static(path.join(ROOT, 'js')));
  app.use('/data', express.static(path.join(ROOT, 'data')));
  app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'solarself', time: new Date().toISOString() });
  });

  // GET /api/solar?lat=12.97&lng=77.59&tz=5.5&date=2026-10-22[&time=14:30]
  app.get('/api/solar', (req, res) => {
    const lat = numberParam(req.query.lat, 'lat', -89.9, 89.9);
    const lng = numberParam(req.query.lng, 'lng', -180, 180);
    const tz = numberParam(req.query.tz, 'tz', -12, 14);
    if (lat.error || lng.error || tz.error) {
      return res.status(400).json({ error: lat.error || lng.error || tz.error });
    }

    const date = req.query.date || todayUTC();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    const times = sunTimes(lat.value, lng.value, tz.value, date);
    const body = {
      date,
      latitude: lat.value,
      longitude: lng.value,
      timeZoneHours: tz.value,
      dayOfYear: times.dayOfYear,
      declinationDeg: times.declinationDeg,
      equationOfTimeMin: times.equationOfTimeMin,
      solarNoon: formatHM(times.solarNoonHours),
      sunrise: formatHM(times.sunriseHours),
      sunset: formatHM(times.sunsetHours),
      dayLengthHours: times.dayLengthHours,
      polar: times.polar,
    };

    if (req.query.time !== undefined) {
      const m = /^(\d{1,2}):(\d{2})$/.exec(req.query.time);
      const h = m ? Number(m[1]) + Number(m[2]) / 60 : NaN;
      if (!m || h < 0 || h >= 24) {
        return res.status(400).json({ error: 'time must be HH:MM (24-hour)' });
      }
      body.atTime = req.query.time;
      body.sun = sunPosition(lat.value, lng.value, tz.value, date, h);
    }

    res.json(body);
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API route' }));

  return app;
}

module.exports = { createApp };
