# SolarSelf: Circadian Intelligence Dashboard

**Course:** 22CSE71 - Full Stack Technologies | **Assessment:** AAT-1
**Student:** Krish Sunil | **USN:** 1NH23CS117 | **Semester/Section:** 7/C | **College:** New Horizon College of Engineering

## 1. Objective

To build and publish a full-stack web application that uses solar geometry and live weather data to show how much daylight a person receives and how it affects their body clock. The project has a browser front end and a Node.js / Express backend with a REST API, and it is presented as a portfolio project on GitHub.

## 2. Description

SolarSelf is a single-page dashboard for circadian health. It answers questions such as "What is the sun doing right now at my location?", "How much light is my body receiving?" and "How should I shift my sleep after a flight?"

The front end has six sections:

| Section | What it does |
|---|---|
| **Sky Now** | Solar elevation, estimated lux, UV index with category and advice, solar arc, sunrise and sunset, and current weather (Open-Meteo). |
| **Latitude Analyzer** | Scans a full year day by day to show annual daylight extremes, polar day and polar night, and a solar analemma. |
| **Circadian Protocol** | Builds a light and sleep plan from a phase-shift target, with four anchor times that are scored. |
| **Jet Lag Calculator** | Plans a schedule for a flight between two cities, including a blue-light cutoff and dinner timing. |
| **Time Format** | Compares 12-hour and 24-hour time usage across countries. |
| **12h vs 24h** | Explains with clocks and tables why 24-hour time removes ambiguity. |

The backend provides:
- **`GET /api/health`** returns the service status.
- **`GET /api/solar`** computes, for any latitude, longitude, time zone and date, the solar declination, equation of time, solar noon, sunrise, sunset and day length. With an optional `time=HH:MM` it also returns the sun's elevation and azimuth at that time. Polar day and polar night are detected and reported.

The Sky Now header has a **Backend** status pill. When the page is served by the Node server, it shows "live" with the server's solar noon for the selected location. When the page is opened as a plain file, it shows "offline" and everything else still works.

## 3. Tools and Technologies

| Layer | Technology |
|---|---|
| Front-end structure and style | HTML5, CSS3 (custom properties, grid, flexbox) |
| Front-end logic | Vanilla JavaScript (ES6+), HTML5 Canvas 2D |
| Backend | Node.js (v18+), Express.js 4 |
| API | REST (JSON), query-string validation, JSON error responses |
| Testing | Node.js built-in test runner (`node:test`) |
| Data | Local JavaScript datasets (about 120,000 cities, 47 countries), Open-Meteo REST API |
| Development tools | VS Code, Git, GitHub, npm |

## 4. Project Structure

```
solarself/
├── index.html            # Page layout and section markup
├── css/
│   └── style.css         # Theme variables, layout and component styles
├── js/
│   └── app.js            # Solar display logic, weather, canvas drawing, backend check
├── data/
│   ├── cities.js         # City database (about 120,000 entries)
│   └── countries.js      # Country 12h/24h usage data
├── server/
│   ├── index.js          # Starts the HTTP server (PORT, default 3000)
│   ├── app.js            # Express app: static files and API routes, input validation
│   ├── solar.js          # Solar position and sunrise/sunset calculations
│   └── test/
│       └── solar.test.js # Unit and API tests
├── package.json          # Scripts and dependencies
├── package-lock.json
├── .gitignore
└── README.md
```

The front end and the backend are kept apart. The front end holds the user interface and the data it displays, and the backend holds the calculations exposed through the API. Only the front-end folders (`index.html`, `css/`, `js/`, `data/`) are served to the browser; the server source and configuration are not.

## 5. Execution Steps

**Prerequisites:** Node.js 18 or later and npm. Internet access is needed for live weather, and for the browser to load the Open-Meteo data.

**1. Clone the repository**
```bash
git clone https://github.com/krishsunil/solarself.git
cd solarself
```

**2. Install dependencies**
```bash
npm install
```

**3. Run the tests (optional)**
```bash
npm test
```
Expected result: all tests pass. The tests check the day-of-year calculation, Bengaluru's solar noon, sunrise and sunset, the noon elevation, polar day and polar night, and the API responses and error handling.

**4. Start the server**
```bash
npm start
```
Open **http://localhost:3000** in a browser. Change the port with `PORT=4000 npm start` (Windows: `set PORT=4000` then `npm start`).

**Using the app**
1. The default location is Bengaluru. Click **Change**, type a city and press **Apply**. The Backend pill updates for the new location.
2. Use the navigation bar to move between the six sections.
3. In **Sky Now**, watch the solar elevation and UV values update every second.
4. In **Jet Lag**, choose departure and destination cities and a flight duration to generate a plan.

**Static mode (no server):** open `index.html` directly. The Backend pill shows "offline" and the rest of the app works.

## 6. REST API

| Method | Endpoint | Parameters | Description |
|---|---|---|---|
| GET | `/api/health` | none | Returns `{ "status": "ok", ... }`. |
| GET | `/api/solar` | `lat` (required, -89.9 to 89.9), `lng` (required, -180 to 180), `tz` (required, time-zone hours, -12 to 14), `date` (optional, `YYYY-MM-DD`, default today in UTC), `time` (optional, `HH:MM`) | Sun times for the date, plus the sun's elevation and azimuth at `time` if given. |

**Example**
```
GET /api/solar?lat=12.97&lng=77.59&tz=5.5&date=2026-10-22&time=14:30
```
```json
{
  "date": "2026-10-22",
  "latitude": 12.97,
  "longitude": 77.59,
  "timeZoneHours": 5.5,
  "dayOfYear": 295,
  "declinationDeg": -12.1,
  "equationOfTimeMin": 15.9,
  "solarNoon": "12:04",
  "sunrise": "06:12",
  "sunset": "17:56",
  "dayLengthHours": 11.74,
  "polar": null,
  "atTime": "14:30",
  "sun": { "elevationDeg": 45.9, "azimuthDeg": 236.85 }
}
```

Invalid input returns HTTP 400 with an `error` message. Unknown `/api` routes return HTTP 404 with a JSON error.

## 7. Output

The application's output screens are documented in the accompanying AAT-1 hard copy report (Section 7). The main views are:

1. Sky Now: solar elevation, estimated lux, SCN reading and UV index
2. Sky Now: solar arc, current weather and sunrise window
3. Latitude Analyzer: annual extremes, score breakdown and solar analemma
4. Circadian Protocol: schedule input and the four circadian anchors
5. Jet Lag Calculator: origin and destination inputs, flight duration and stay
6. Time Format: world comparison of sunset variation
7. 12h vs 24h: side-by-side clocks and the learning curve

## 8. Challenges Faced

- **Solar accuracy at high latitudes:** near the poles the sunrise equation has no solution for part of the year. The app handles this with explicit midnight-sun and polar-night checks, and the API reports the same condition.
- **Two places doing the same maths:** the browser and the server both calculate the sun. The server's tests check its results against the values the app displays, so the two stay in agreement.
- **Sunrise and sunset definitions:** the sun's top and bottom edges use different depression angles. Separate requests with the correct values give the sunrise, the start of sunset and the end of sunset.
- **Unreliable network services:** the weather service can be slow or unavailable. Each request is cancelled after 9 seconds, the status indicator reports the failure, and the user can enter temperature and humidity manually.
- **Large static dataset:** the city data is about 13 MB, so it is kept in its own file and loaded separately from the application logic.
- **Time zones and daylight saving time:** the Latitude Analyzer uses standard (winter) offsets and states that DST is excluded. The jet-lag planner checks the DST status for the selected dates.

## 9. Learning Outcomes

- Built a client and server application: a static front end, and a Node.js / Express REST API with validation and error handling.
- Implemented astronomical formulas and checked them with automated tests.
- Used the Fetch API with timeouts to consume REST services, both the project's own API and Open-Meteo.
- Used the Canvas API for data visualisation.
- Restructured a single-file prototype into a maintainable project with separate front-end, backend and data folders.
- Used version control and npm, and documented the project for a professional portfolio.

## 10. Credits and Data Sources

- Weather and sunrise/sunset data: [Open-Meteo](https://open-meteo.com) (free, no API key required).
- Solar position formulas: standard analytical approximations for declination, the equation of time and the sun's position.
- City coordinates and time zones compiled from public geographic data.

## 11. Author

Krish Sunil, B.E. Computer Science and Engineering, New Horizon College of Engineering.
