"""SQLite access + schema. Values in user_settings are JSON-encoded."""
import json, os, sqlite3
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "oilsense.db")
DEVICE_ID = "ARDUINO-UNO-001"

DEFAULT_SETTINGS = {
    "temp_warn": 60.0, "temp_crit": 80.0,          # EXAMPLE thresholds, calibrate for your oil
    "refresh_s": 5, "unit": "C", "notify_enabled": True, "notify_sound": False,
    "serial_port": "COM3", "baud": 9600, "retention_days": 30, "theme": "light",
    "no_data_timeout_s": 30, "abnormal_delta": 10.0,
    "demo_mode": "auto",                            # auto | force | off
    "active_sample_id": "",
}

def now():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")

def conn():
    c = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=10)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    c = conn()
    c.executescript("""
    CREATE TABLE IF NOT EXISTS devices(
      id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT UNIQUE NOT NULL, name TEXT, sensor TEXT, created_at TEXT);
    CREATE TABLE IF NOT EXISTS oil_samples(
      id INTEGER PRIMARY KEY AUTOINCREMENT, sample_id TEXT UNIQUE NOT NULL, oil_type TEXT NOT NULL,
      collected_at TEXT NOT NULL, equipment TEXT, notes TEXT, temperature_c REAL,
      device_id TEXT REFERENCES devices(device_id), created_at TEXT);
    CREATE TABLE IF NOT EXISTS temperature_readings(
      id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT NOT NULL REFERENCES devices(device_id),
      temperature_c REAL NOT NULL, source TEXT NOT NULL CHECK(source IN ('hardware','demo')),
      sample_id TEXT, ts TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_readings_ts ON temperature_readings(ts);
    CREATE TABLE IF NOT EXISTS alerts(
      id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, severity TEXT NOT NULL,
      device_id TEXT REFERENCES devices(device_id), description TEXT, status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT, acknowledged_at TEXT, resolved_at TEXT);
    CREATE TABLE IF NOT EXISTS user_settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    """)
    c.execute("INSERT OR IGNORE INTO devices(device_id,name,sensor,created_at) VALUES(?,?,?,?)",
              (DEVICE_ID, "Arduino Uno R3", "DS18B20", now()))
    for k, v in DEFAULT_SETTINGS.items():
        c.execute("INSERT OR IGNORE INTO user_settings(key,value) VALUES(?,?)", (k, json.dumps(v)))
    c.commit(); c.close()

def get_settings():
    c = conn()
    s = {r["key"]: json.loads(r["value"]) for r in c.execute("SELECT * FROM user_settings")}
    c.close()
    return {**DEFAULT_SETTINGS, **s}

def save_settings(d):
    c = conn()
    for k, v in d.items():
        c.execute("INSERT OR REPLACE INTO user_settings(key,value) VALUES(?,?)", (k, json.dumps(v)))
    c.commit(); c.close()

def query(sql, args=()):
    c = conn(); rows = [dict(r) for r in c.execute(sql, args)]; c.close(); return rows

def execute(sql, args=()):
    c = conn(); cur = c.execute(sql, args); c.commit(); i = cur.lastrowid; n = cur.rowcount; c.close(); return i, n

def raise_alert(type_, severity, description, device_id=DEVICE_ID):
    """Create an alert unless an unresolved one of the same type already exists."""
    if query("SELECT id FROM alerts WHERE type=? AND status!='resolved'", (type_,)):
        return None
    return execute("INSERT INTO alerts(type,severity,device_id,description,status,created_at) VALUES(?,?,?,?, 'open',?)",
                   (type_, severity, device_id, description, now()))[0]
