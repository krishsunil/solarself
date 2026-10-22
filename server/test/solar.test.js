const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { dayOfYear, sunTimes, sunPosition, formatHM } = require('../solar');

// Convert "HH:MM" to fractional hours for comparisons.
const toH = (s) => Number(s.slice(0, 2)) + Number(s.slice(3, 5)) / 60;

test('day of year is calculated correctly', () => {
  assert.equal(dayOfYear('2026-01-01'), 1);
  assert.equal(dayOfYear('2026-10-22'), 295);
  assert.equal(dayOfYear('2026-12-31'), 365);
});

test('Bengaluru solar noon matches the app (about 12:04)', () => {
  const t = sunTimes(12.97, 77.59, 5.5, '2026-10-22');
  assert.ok(Math.abs(t.solarNoonHours - 12.067) < 0.02, `noon was ${t.solarNoonHours}`);
});

test('Bengaluru sunrise and sunset match the app (about 06:12 and 17:56)', () => {
  const t = sunTimes(12.97, 77.59, 5.5, '2026-10-22');
  assert.ok(Math.abs(t.sunriseHours - 6.2) < 0.15, `sunrise ${formatHM(t.sunriseHours)}`);
  assert.ok(Math.abs(t.sunsetHours - 17.93) < 0.15, `sunset ${formatHM(t.sunsetHours)}`);
  assert.equal(t.polar, null);
});

test('Bengaluru noon elevation is about 65 degrees', () => {
  const sun = sunPosition(12.97, 77.59, 5.5, '2026-10-22', 12.067);
  assert.ok(sun.elevationDeg > 64 && sun.elevationDeg < 66.5, `elevation ${sun.elevationDeg}`);
  assert.ok(Math.abs(sun.azimuthDeg - 180) < 2, `azimuth ${sun.azimuthDeg}`);
});

test('polar night and midnight sun are detected', () => {
  assert.equal(sunTimes(78.2, 15.6, 1, '2026-12-21').polar, 'polar-night');
  assert.equal(sunTimes(78.2, 15.6, 1, '2026-06-21').polar, 'midnight-sun');
});

test('formatHM gives 24-hour HH:MM', () => {
  assert.equal(formatHM(6.2), '06:12');
  assert.equal(formatHM(17.93), '17:56');
  assert.equal(formatHM(23.999), '00:00');
});

// Start the real HTTP app on a random port for the API tests.
async function withServer(fn) {
  const server = createApp().listen(0);
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

test('GET /api/health reports ok', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/health`);
    assert.equal(r.status, 200);
    assert.equal((await r.json()).status, 'ok');
  });
});

test('GET /api/solar returns Bengaluru sun times', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/solar?lat=12.97&lng=77.59&tz=5.5&date=2026-10-22&time=12:00`);
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.solarNoon, '12:04');
    assert.ok(d.sunrise >= '06:05' && d.sunrise <= '06:20', d.sunrise);
    assert.ok(d.sunset >= '17:50' && d.sunset <= '18:00', d.sunset);
    assert.ok(d.sun.elevationDeg > 64 && d.sun.elevationDeg < 66.5);
  });
});

test('GET /api/solar rejects bad input', async () => {
  await withServer(async (base) => {
    const cases = [
      '/api/solar?lat=abc&lng=77&tz=5.5',
      '/api/solar?lat=95&lng=77&tz=5.5',
      '/api/solar?lat=12&lng=77&tz=5.5&date=22-10-2026',
      '/api/solar?lat=12&lng=77&tz=5.5&time=25:00',
    ];
    for (const path of cases) {
      const r = await fetch(base + path);
      assert.equal(r.status, 400, path);
      assert.ok((await r.json()).error, path);
    }
  });
});

test('unknown API routes return 404 JSON', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/nothing`);
    assert.equal(r.status, 404);
  });
});
