# OilSense AI – Smart Oil Quality Monitoring System

Arduino Uno → USB Serial → FastAPI (pySerial) → SQLite → React dashboard.
Hardware: Arduino Uno R3, DS18B20, 16x2 LCD, buzzer. The TCS34725 colour sensor is **not installed**; the UI shows an honest "Coming Soon" state.

> Temperature alone cannot determine oil purity, contamination, acidity, viscosity or remaining life. The app never shows GOOD/BAD oil ratings; it shows "Insufficient data for oil quality assessment". Default thresholds (60/80 °C) are examples only.

## Structure
```
backend/   main.py (REST API), serial_reader.py (thread), database.py, models.py, requirements.txt
frontend/  React + Vite + Tailwind + Recharts + Lucide (src/components, pages, services, hooks)
arduino/   oil_temperature_monitor.ino
hardware/  WIRING.md
```

## Windows setup
Prerequisites: Python 3.10+, Node.js 18+, Arduino IDE.

**1. Arduino:** wire per `hardware/WIRING.md`. In Arduino IDE install libraries *OneWire* and *DallasTemperature*, open `arduino/oil_temperature_monitor.ino`, select board *Arduino Uno* and the COM port, Upload. Close Serial Monitor afterwards (it blocks the port). The sketch prints `TEMP,26.50` every 2 s at 9600 baud.

**2. Backend** (PowerShell, from project root):
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

**3. Frontend** (second terminal):
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Shortcuts: `start_backend.bat`, `start_frontend.bat`.

## Demo Mode → real data
- Default `Auto`: if the serial port cannot be opened, or no valid sensor readings arrive before the configured timeout, the backend starts in **Demo Mode** with fluctuating simulated readings (stored with `source='demo'`, labelled "Simulated", and kept separate from hardware history unless you choose "All"). When valid sensor readings resume, the backend switches back to hardware readings.
- To use hardware: find the COM port (Device Manager → Ports), then in **Device Management** (or Settings) set the port, baud 9600 and press *Save & reconnect*. Header turns **Connected** only when the backend confirms an open port. Set Demo Mode to **Off** in Settings to forbid simulation.

## API
| Method | Path | Notes |
|---|---|---|
| GET | /api/health | service liveness |
| GET | /api/status | mode (connected/demo/disconnected), port, last reading |
| GET | /api/readings/latest | latest stored reading |
| GET | /api/readings/history | `hours` or `start`/`end`, `sample_id`, `source` (auto/hardware/demo/all) → readings + min/max/avg |
| GET | /api/alerts?status= | list |
| POST | /api/alerts/{id}/acknowledge · /resolve · /api/alerts/test | |
| GET/PUT | /api/settings | validated (422 on bad input) |
| GET/POST/PUT/DELETE | /api/samples | oil sample records |
| GET | /api/devices · /api/ports | |
| POST | /api/device/reconnect | |

## Troubleshooting
- *Disconnected / "Cannot open COM3"*: wrong port, port used by Arduino IDE Serial Monitor, or cable/driver (CH340) issue.
- *-127 °C / sensor alert*: DS18B20 wiring; needs 4.7 kΩ pull-up between data and 5 V.
- *Frontend says backend not reachable*: start uvicorn on port 8000.
- *Blank charts*: "Waiting for sensor data" means no readings yet in that time range.

## Notes
Database file `backend/oilsense.db` is created automatically (tables: devices, temperature_readings, oil_samples, alerts, user_settings). Colour sensor activation needs: TCS34725 wired to A4/A5, firmware sending RGB lines, a colour_readings table, and parsing in `serial_reader.py`.
