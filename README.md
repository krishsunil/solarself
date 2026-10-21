# SolarSelf: Circadian Intelligence Dashboard

**Course:** 22CSE71 - Full Stack Technologies | **Assessment:** AAT-1 (Portfolio-Driven)
**Student:** Krish Sunil | **USN:** 1NH23CS117 | **Semester/Section:** 7/C | **College:** New Horizon College of Engineering

## 1. Objective

To build and publish a practical web application that uses real astronomical algorithms and live weather data to show how much daylight a person is getting and how it affects their body clock, and to present the project professionally in a GitHub portfolio.

## 2. Description

SolarSelf is a single-page web application for circadian health. It answers questions such as "What is the sun doing right now at my location?", "How much light is my body receiving?", and "How should I shift my sleep schedule after a flight?"

The application has six sections:

| Section | What it does |
|---|---|
| **Sky Now** | Live solar elevation, estimated lux, UV index with category and advice, sunrise/sunset, and current weather (Open-Meteo). |
| **Latitude Analyzer** | Scans a full year day by day to show annual extremes of daylight, polar day and polar night, and a solar analemma plot. |
| **Circadian Protocol** | Builds a light and sleep plan from a phase-shift target with four anchor times, and scores each anchor. |
| **Jet Lag Calculator** | Plans a schedule for a flight between two cities, including a blue-light cutoff, forced wakefulness on arrival, and dinner timing. |
| **Time Format** | Compares 12-hour and 24-hour time usage across countries. |
| **12h vs 24h** | Explains with clocks and tables why 24-hour time removes ambiguity. |

Key features:
- **Solar geometry from first principles:** declination, equation of time, hour angle, elevation and azimuth are computed in the browser using VSOP87-based formulas.
- **Live data:** sunrise, sunset, daylight duration and weather come from the free Open-Meteo API. When the API is unreachable, the user can enter temperature and humidity manually.
- **Polar edge-case handling:** the app detects midnight sun and polar night and shows an explanatory banner instead of wrong times.
- **UV index model:** computed from solar elevation, latitude and altitude, with an ozone-layer adjustment.
- **Heat index:** calculated from temperature and humidity using the NOAA formula.
- **Location search:** a searchable database of about 120,000 cities with time zone and altitude data. Location can also be set by typing a city name.
- **Responsive, dark-themed UI:** built with CSS custom properties and CSS grid/flexbox.

## 3. Tools and Technologies

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, keyframe animation) |
| Logic | Vanilla JavaScript (ES6+), no framework |
| Graphics | HTML5 Canvas 2D (arc, analemma, clock and globe drawings) |
| Data | Local JavaScript city dataset (`data/cities.js`), Open-Meteo REST API (JSON) |
| Asynchronous operations | `fetch` with `AbortController` timeouts, `async/await` |
| Development tools | VS Code, Git, GitHub, Chrome DevTools |

No build step, package manager, or server-side code is required.

## 4. Project Structure

```
solarself/
├── index.html          # Page layout and section markup
├── css/
│   └── style.css       # Theme variables, layout and component styles
├── js/
│   └── app.js          # Solar calculations, weather, UI logic, canvas drawing
├── data/
│   ├── cities.js       # City database (about 120,000 entries)
│   └── countries.js    # Country 12h/24h usage data
├── docs/
│   └── screenshots/    # Output screenshots used in this README and the report
├── .gitignore
└── README.md
```

Separation of concerns: HTML defines structure, CSS defines presentation, JavaScript defines behaviour, and the data files hold static content. This is the same principle the Full Stack course teaches with MVC: the data layer is separate from the view and controller logic.

## 5. Execution Steps

**Prerequisites:** any modern browser (Chrome, Edge, Firefox or Safari). Internet access is needed only for the live sunrise, sunset and weather data.

**Option A: open directly**
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/solarself.git
   cd solarself
   ```
2. Double-click `index.html`, or open it from the browser with `File > Open`.

**Option B: run a local server (recommended)**
```bash
cd solarself
python -m http.server 8000      # or: npx serve .
```
Then open **http://localhost:8000** in the browser.

**Using the app**
1. The default location is Bengaluru. Click **Change**, type any city, and press **Apply**.
2. Use the navigation bar to move between the six sections.
3. In **Sky Now**, watch the solar elevation and UV values update every second.
4. In **Jet Lag**, choose departure and destination cities and a flight duration to generate a plan.

## 6. Output

Screenshots are stored in `docs/screenshots/` and are included in the hard copy report:

1. Sky Now dashboard (solar elevation, lux, UV index, sunrise and sunset)
2. Latitude Analyzer with annual daylight extremes and analemma
3. Circadian Protocol schedule with anchor scores
4. Jet Lag Calculator for a sample flight
5. 12h vs 24h comparison by country
6. Mobile layout (responsive view)

## 7. Challenges Faced

- **Solar accuracy at high latitudes:** near the poles the sunrise equation has no solution for part of the year. The app handles this with explicit midnight-sun and polar-night checks.
- **Daylight saving time:** the jet lag feature had to compare standard-time offsets with DST offsets so the time difference shown to the user is correct.
- **Large dataset in the browser:** about 120,000 cities are loaded as one script. Keeping the data in its own file makes the code readable and the page easier to maintain.
- **Mixing live and offline data:** the app must still work when the weather API fails. A status indicator and a manual input fallback solve this.

## 8. Learning Outcomes

- Structured a single-file prototype into a maintainable multi-file project (HTML, CSS, JavaScript and data separated).
- Used the Fetch API with timeouts to consume a REST API and handle errors.
- Implemented scientific formulas in JavaScript and checked the results against known values.
- Used the Canvas API for data visualisation.
- Applied version control and documentation practices expected in a professional portfolio.

## 9. Credits and Data Sources

- Weather and sunrise/sunset data: [Open-Meteo](https://open-meteo.com) (free, no API key required).
- Solar position formulas adapted from standard astronomical algorithms (VSOP87 series for the Earth's orbit).
- City coordinates and time zones compiled from public geographic data.

## 10. Author

Krish Sunil, B.E. Computer Science and Engineering, New Horizon College of Engineering.
