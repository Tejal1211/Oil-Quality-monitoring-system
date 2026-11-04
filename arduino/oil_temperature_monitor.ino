// OilSense AI - Arduino Uno R3 + DS18B20 + 16x2 LCD (parallel) + buzzer
// Libraries (Library Manager): OneWire, DallasTemperature. LiquidCrystal is built in.
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal.h>

#define ONE_WIRE_PIN 7          // DS18B20 data (4.7k pull-up resistor to 5V)
#define BUZZER_PIN 8
const float BUZZER_ALERT_C = 60.0;   // EXAMPLE value only
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);   // RS, E, D4, D5, D6, D7
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  pinMode(BUZZER_PIN, OUTPUT);
  lcd.begin(16, 2);
  lcd.print("OilSense AI");
  sensors.begin();
  delay(1500);
  lcd.clear();
}

void loop() {
  sensors.requestTemperatures();
  float t = sensors.getTempCByIndex(0);
  lcd.setCursor(0, 0);
  if (t == DEVICE_DISCONNECTED_C) {
    Serial.println("ERROR,SENSOR_DISCONNECTED");
    lcd.print("Sensor error!   ");
    lcd.setCursor(0, 1); lcd.print("Check wiring    ");
    digitalWrite(BUZZER_PIN, LOW);
  } else {
    Serial.print("TEMP,"); Serial.println(t, 2);
    lcd.print("Oil Temp:       ");
    lcd.setCursor(0, 1); lcd.print(t, 1); lcd.print(" C        ");
    digitalWrite(BUZZER_PIN, t >= BUZZER_ALERT_C ? HIGH : LOW);
  }
  delay(2000);
}
