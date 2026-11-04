"""OilSense AI backend. Run: uvicorn main:app --reload --port 8000"""
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import database as db
from models import SampleIn, SettingsModel, SettingsPatch
from serial_reader import reader

@asynccontextmanager
async def lifespan(app):
    db.init_db(); reader.start(); yield; reader.stop()

app = FastAPI(title="OilSense AI API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health(): return {"status": "ok", "service": "OilSense AI backend", "time": db.now()}

@app.get("/api/status")
def status():
    cfg = db.get_settings()
    last = reader.last
    return {"mode": reader.mode, "connected": reader.mode == "connected", "device_id": db.DEVICE_ID,
            "device_name": "Arduino Uno R3", "sensor": "DS18B20", "port": cfg["serial_port"], "baud": cfg["baud"],
            "serial_open": reader.ser is not None, "error": reader.error, "malformed_messages": reader.malformed,
            "last_reading": last, "last_ts": last["ts"] if last else None, "backend": "running",
            "open_alerts": db.query("SELECT COUNT(*) n FROM alerts WHERE status='open'")[0]["n"]}

@app.get("/api/readings/latest")
def latest():
    r = db.query("SELECT * FROM temperature_readings ORDER BY id DESC LIMIT 1")
    return {"reading": r[0] if r else None, "message": None if r else "Waiting for sensor data"}

@app.get("/api/readings/history")
def history(hours: Optional[float] = Query(None, gt=0, le=24 * 365), start: Optional[str] = None,
            end: Optional[str] = None, sample_id: Optional[str] = None, source: str = "auto"):
    if source not in ("auto", "hardware", "demo", "all"): raise HTTPException(422, "invalid source")
    if source == "auto": source = "demo" if reader.mode == "demo" else "hardware"
    where, args = [], []
    if source != "all": where.append("source=?"); args.append(source)
    if hours:
        from datetime import datetime, timedelta, timezone
        where.append("ts>=?"); args.append((datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat(timespec="milliseconds").replace("+00:00", "Z"))
    if start: where.append("ts>=?"); args.append(start)
    if end: where.append("ts<=?"); args.append(end)
    if sample_id: where.append("sample_id=?"); args.append(sample_id)
    w = ("WHERE " + " AND ".join(where)) if where else ""
    st = db.query(f"SELECT COUNT(*) n, MIN(temperature_c) min, MAX(temperature_c) max, AVG(temperature_c) avg FROM temperature_readings {w}", args)[0]
    rows = db.query(f"SELECT * FROM temperature_readings {w} ORDER BY ts ASC", args)
    stride = max(1, len(rows) // 5000)
    return {"source": source, "stats": st, "downsampled": stride > 1, "readings": rows[::stride]}

@app.get("/api/alerts")
def alerts(status: Optional[str] = None):
    if status and status not in ("open", "acknowledged", "resolved"): raise HTTPException(422, "invalid status")
    if status: return db.query("SELECT * FROM alerts WHERE status=? ORDER BY id DESC", (status,))
    return db.query("SELECT * FROM alerts ORDER BY id DESC")

def _alert_action(id, new, col):
    _, n = db.execute(f"UPDATE alerts SET status=?, {col}=? WHERE id=?", (new, db.now(), id))
    if not n: raise HTTPException(404, "Alert not found")
    return db.query("SELECT * FROM alerts WHERE id=?", (id,))[0]

@app.post("/api/alerts/{id}/acknowledge")
def ack(id: int): return _alert_action(id, "acknowledged", "acknowledged_at")

@app.post("/api/alerts/{id}/resolve")
def resolve(id: int): return _alert_action(id, "resolved", "resolved_at")

@app.post("/api/alerts/test")
def test_alert():
    i = db.execute("INSERT INTO alerts(type,severity,device_id,description,status,created_at) VALUES('test','info',?,?,'open',?)",
                   (db.DEVICE_ID, "[TEST] Manually generated alert for demonstration.", db.now()))[0]
    return db.query("SELECT * FROM alerts WHERE id=?", (i,))[0]

@app.get("/api/settings")
def get_settings(): return db.get_settings()

@app.put("/api/settings")
def put_settings(patch: SettingsPatch):
    try: merged = SettingsModel(**{**db.get_settings(), **patch.model_dump(exclude_none=True)})
    except ValidationError as e:
        raise HTTPException(422, "; ".join(f"{'.'.join(map(str, x['loc']))}: {x['msg']}" for x in e.errors()))
    db.save_settings(merged.model_dump())
    if {"serial_port", "baud", "demo_mode"} & set(patch.model_dump(exclude_none=True)): reader.reconnect()
    return merged.model_dump()

@app.get("/api/samples")
def samples(): return db.query("SELECT * FROM oil_samples ORDER BY collected_at DESC")

@app.post("/api/samples", status_code=201)
def add_sample(s: SampleIn):
    if db.query("SELECT 1 FROM oil_samples WHERE sample_id=?", (s.sample_id,)): raise HTTPException(409, "Sample ID already exists")
    i = db.execute("INSERT INTO oil_samples(sample_id,oil_type,collected_at,equipment,notes,temperature_c,device_id,created_at) VALUES(?,?,?,?,?,?,?,?)",
                   (s.sample_id, s.oil_type, s.collected_at, s.equipment, s.notes, s.temperature_c, db.DEVICE_ID, db.now()))[0]
    return db.query("SELECT * FROM oil_samples WHERE id=?", (i,))[0]

@app.put("/api/samples/{id}")
def edit_sample(id: int, s: SampleIn):
    if db.query("SELECT 1 FROM oil_samples WHERE sample_id=? AND id!=?", (s.sample_id, id)): raise HTTPException(409, "Sample ID already exists")
    _, n = db.execute("UPDATE oil_samples SET sample_id=?,oil_type=?,collected_at=?,equipment=?,notes=?,temperature_c=? WHERE id=?",
                      (s.sample_id, s.oil_type, s.collected_at, s.equipment, s.notes, s.temperature_c, id))
    if not n: raise HTTPException(404, "Sample not found")
    return db.query("SELECT * FROM oil_samples WHERE id=?", (id,))[0]

@app.delete("/api/samples/{id}")
def del_sample(id: int):
    _, n = db.execute("DELETE FROM oil_samples WHERE id=?", (id,))
    if not n: raise HTTPException(404, "Sample not found")
    return {"deleted": id}

@app.get("/api/devices")
def devices(): return db.query("SELECT * FROM devices")

@app.get("/api/ports")
def ports(): return {"ports": reader.ports()}

@app.post("/api/device/reconnect")
def reconnect(): reader.reconnect(); return {"message": "Reconnect requested"}
