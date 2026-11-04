# Wiring (Arduino Uno R3)
- DS18B20: red -> 5V, black -> GND, data (yellow/white) -> D7, plus a 4.7 kOhm resistor between data and 5V.
- Buzzer: + -> D8, - -> GND.
- LCD 16x2 (parallel): RS->D12, E->D11, D4->D5, D5->D4, D6->D3, D7->D2, VSS/RW/K->GND, VDD/A->5V (A via 220 ohm), V0->potentiometer middle pin.
- TCS34725 (future): VIN->5V, GND->GND, SDA->A4, SCL->A5. Not installed; the dashboard shows it as disabled.
