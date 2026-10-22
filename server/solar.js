// Solar position and sun-time calculations used by the backend API.
// The formulas are the same analytical approximations used in js/app.js.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Day of year (1 = 1 January) for an ISO date string "YYYY-MM-DD".
function dayOfYear(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 1);
  return Math.floor((t - start) / 864e5) + 1;
}

// Solar declination in degrees.
function declination(doy) {
  return 23.45 * Math.sin(D2R * (360 / 365) * (doy - 81));
}

// Equation of time in minutes.
function equationOfTime(doy) {
  const B = (360 / 365) * (doy - 81) * D2R;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

// Local clock time of solar noon, in fractional hours (0-24).
function solarNoon(lng, tz, doy) {
  const raw = 12 - (4 * (lng - tz * 15) + equationOfTime(doy)) / 60;
  return ((raw % 24) + 24) % 24;
}

// Sunrise and sunset for a date. `depression` is the sun's altitude at
// rise/set in degrees (0.833 = top limb on the horizon, the standard value).
function sunTimes(lat, lng, tz, dateStr, depression = 0.833) {
  const doy = dayOfYear(dateStr);
  const dec = declination(doy);
  const noon = solarNoon(lng, tz, doy);
  const cosH = (Math.sin(-depression * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R))
             / (Math.cos(lat * D2R) * Math.cos(dec * D2R));
  const base = { date: dateStr, dayOfYear: doy, declinationDeg: round(dec, 2),
                 equationOfTimeMin: round(equationOfTime(doy), 1), solarNoonHours: noon };
  if (cosH > 1) {
    return { ...base, polar: 'polar-night', sunriseHours: null, sunsetHours: null, dayLengthHours: 0 };
  }
  if (cosH < -1) {
    return { ...base, polar: 'midnight-sun', sunriseHours: null, sunsetHours: null, dayLengthHours: 24 };
  }
  const halfDay = (Math.acos(cosH) * R2D) / 15;
  return {
    ...base,
    polar: null,
    sunriseHours: wrap24(noon - halfDay),
    sunsetHours: wrap24(noon + halfDay),
    dayLengthHours: round(2 * halfDay, 2),
  };
}

// Sun elevation and azimuth (degrees, azimuth measured clockwise from north)
// at a given local clock time in fractional hours.
function sunPosition(lat, lng, tz, dateStr, localHour) {
  const doy = dayOfYear(dateStr);
  const dec = declination(doy);
  const solarTime = localHour + (lng - tz * 15) / 15 + equationOfTime(doy) / 60;
  const H = 15 * (solarTime - 12) * D2R;
  const phi = lat * D2R;
  const delta = dec * D2R;
  const sinEl = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinEl))) * R2D;
  const az = Math.atan2(-Math.sin(H) * Math.cos(delta),
                        Math.cos(phi) * Math.sin(delta) - Math.sin(phi) * Math.cos(delta) * Math.cos(H)) * R2D;
  return { elevationDeg: round(elevation, 2), azimuthDeg: round((az + 360) % 360, 2) };
}

function wrap24(h) {
  return ((h % 24) + 24) % 24;
}

function round(v, digits) {
  const f = Math.pow(10, digits);
  return Math.round(v * f) / f;
}

// Format fractional hours as "HH:MM" (24-hour notation).
function formatHM(h) {
  if (h === null || h === undefined || Number.isNaN(h)) return null;
  const total = Math.round(((h % 24) + 24) % 24 * 60) % (24 * 60);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

module.exports = { dayOfYear, declination, equationOfTime, solarNoon, sunTimes, sunPosition, formatHM };
