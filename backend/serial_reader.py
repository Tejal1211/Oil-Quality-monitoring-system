"""Background thread: reads 'TEMP,<celsius>' lines from the Arduino via pySerial.
Falls back to clearly-labelled simulated DEMO readings when no hardware is available."""
import math, random, threading, time
import serial
from serial.tools import list_ports
import database as db

class SerialReader:
    def __init__(self):
        self.mode = "disconnected"       # connected | demo | disconnected
        self.error = None
        self.last = None                 # last reading dict
        self.ser = None
        self.prev = None
        self.demo_temperature = 45.0
        self.last_insert = 0.0
        self.last_rx = time.time()
        self.malformed = 0
        self._stop = threading.Event()
        self._retry = threading.Event()

    def start(self): threading.Thread(target=self.run, daemon=True).start()
    def stop(self): self._stop.set(); self.close()
    def reconnect(self): self._retry.set(); self.close()

    def close(self):
        try:
            if self.ser: self.ser.close()
        except Exception: pass
        self.ser = None

    @staticmethod
    def ports(): return [p.device for p in list_ports.comports()]

    def run(self):
        t_open = t_clean = 0.0
        while not self._stop.is_set():
            try:
                cfg = db.get_settings()
                demo = cfg["demo_mode"]
                if demo == "force":
                    self.close(); self.mode = "demo"; self.error = None
                    self.demo_tick(cfg); time.sleep(2); continue
                if self.ser is None and (time.time() - t_open > 5 or self._retry.is_set()):
                    self._retry.clear(); t_open = time.time(); self.open(cfg)
                if self.ser:
                    self.read_line(cfg)
                else:
                    self.mode = "demo" if demo == "auto" else "disconnected"
                    if self.mode == "demo": self.demo_tick(cfg)
                    time.sleep(2)
                if self.mode == "connected" and time.time() - self.last_rx > cfg["no_data_timeout_s"]:
                    db.raise_alert("no_data", "warning", f"No data received for over {cfg['no_data_timeout_s']} s.")
                    if demo == "auto":
                        self.mode = "demo"
                if self.ser and self.mode == "demo" and demo == "auto":
                    self.demo_tick(cfg)
                if time.time() - t_clean > 3600:
                    t_clean = time.time()
                    cutoff = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(time.time() - cfg["retention_days"] * 86400))
                    db.execute("DELETE FROM temperature_readings WHERE ts < ?", (cutoff,))
            except Exception as e:      # never let the thread die
                self.error = str(e); self.close(); self.mode = "disconnected"
                db.raise_alert("serial_failure", "critical", f"Serial communication failure: {e}")
                time.sleep(2)

    def open(self, cfg):
        try:
            self.ser = serial.Serial(cfg["serial_port"], cfg["baud"], timeout=2)
            time.sleep(2)                # Arduino resets when the port opens
            self.mode = "connected"; self.error = None; self.last_rx = time.time()
        except Exception as e:
            self.ser = None
            self.error = f"Cannot open {cfg['serial_port']}: {e}"
            db.raise_alert("serial_failure", "warning", self.error)

    def read_line(self, cfg):
        line = self.ser.readline().decode("utf-8", errors="ignore").strip()
        if not line: return
        parts = line.split(",")
        if parts[0] == "TEMP" and len(parts) == 2:
            try: t = float(parts[1])
            except ValueError: self.malformed += 1; return
            if math.isnan(t) or t <= -127 or not -55 <= t <= 125:
                db.raise_alert("sensor_disconnected", "critical", f"Invalid DS18B20 value ({t}). Check sensor wiring.")
                return
            self.mode = "connected"
            self.record(t, "hardware", cfg)
        elif parts[0] == "ERROR":
            self.mode = "connected"
            self.last_rx = time.time()
            db.raise_alert("sensor_disconnected", "critical", f"Arduino reported: {line}")
        else:
            self.malformed += 1

    def demo_tick(self, cfg):
        target = 45 + 5 * math.sin(time.time() / 30)
        self.demo_temperature += (target - self.demo_temperature) * 0.15 + random.uniform(-0.8, 0.8)
        self.demo_temperature = max(35, min(55, self.demo_temperature))
        self.record(round(self.demo_temperature, 2), "demo", cfg)

    def record(self, t, source, cfg):
        self.last_rx = time.time()
        ts = db.now()
        self.last = {"device_id": db.DEVICE_ID, "temperature_c": t, "source": source, "ts": ts,
                     "previous_c": self.prev}
        if time.time() - self.last_insert < 1: return        # avoid duplicate/flood inserts
        self.last_insert = time.time()
        db.execute("INSERT INTO temperature_readings(device_id,temperature_c,source,sample_id,ts) VALUES(?,?,?,?,?)",
                   (db.DEVICE_ID, t, source, cfg.get("active_sample_id") or None, ts))
        tag = "[DEMO] " if source == "demo" else ""
        if t >= cfg["temp_crit"]:
            db.raise_alert("temp_high", "critical", f"{tag}Temperature {t:.1f} °C is above the critical threshold ({cfg['temp_crit']} °C).")
        elif t >= cfg["temp_warn"]:
            db.raise_alert("temp_high", "warning", f"{tag}Temperature {t:.1f} °C is above the warning threshold ({cfg['temp_warn']} °C).")
        if self.prev is not None and abs(t - self.prev) >= cfg["abnormal_delta"]:
            db.raise_alert("abnormal_change", "warning", f"{tag}Temperature changed by {abs(t-self.prev):.1f} °C between consecutive readings.")
        self.prev = t

reader = SerialReader()
