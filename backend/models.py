from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

class SettingsModel(BaseModel):
    temp_warn: float = Field(ge=-50, le=300)
    temp_crit: float = Field(ge=-50, le=300)
    refresh_s: int = Field(ge=1, le=300)
    unit: Literal["C", "F"]
    notify_enabled: bool
    notify_sound: bool
    serial_port: str = Field(min_length=1, max_length=64, pattern=r"^[A-Za-z0-9_./\-]+$")
    baud: Literal[1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]
    retention_days: int = Field(ge=1, le=3650)
    theme: Literal["light", "dark"]
    no_data_timeout_s: int = Field(ge=5, le=3600)
    abnormal_delta: float = Field(gt=0, le=100)
    demo_mode: Literal["auto", "force", "off"]
    active_sample_id: str = Field(default="", max_length=50)

    @model_validator(mode="after")
    def crit_above_warn(self):
        if self.temp_crit <= self.temp_warn:
            raise ValueError("temp_crit must be greater than temp_warn")
        return self

class SettingsPatch(BaseModel):
    temp_warn: Optional[float] = None; temp_crit: Optional[float] = None; refresh_s: Optional[int] = None
    unit: Optional[str] = None; notify_enabled: Optional[bool] = None; notify_sound: Optional[bool] = None
    serial_port: Optional[str] = None; baud: Optional[int] = None; retention_days: Optional[int] = None
    theme: Optional[str] = None; no_data_timeout_s: Optional[int] = None; abnormal_delta: Optional[float] = None
    demo_mode: Optional[str] = None; active_sample_id: Optional[str] = None

class SampleIn(BaseModel):
    sample_id: str = Field(min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_\-]+$")
    oil_type: str = Field(min_length=1, max_length=80)
    collected_at: str = Field(min_length=1)
    equipment: Optional[str] = Field(default="", max_length=120)
    notes: Optional[str] = Field(default="", max_length=1000)
    temperature_c: Optional[float] = Field(default=None, ge=-55, le=300)
