#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "config.h"

#ifdef WITH_TEMP_SENSOR
#include <DHT.h>
#endif

WiFiClient espClient;
PubSubClient mqtt(espClient);

#ifdef WITH_TEMP_SENSOR
DHT dht(DHT_PIN, DHT22);
#endif

unsigned long lastSample = 0;

static float readSoilMoisture()
{
  // Rata-rata beberapa sample untuk menstabilkan pembacaan ADC.
  const int samples = 10;
  long sum = 0;
  for (int i = 0; i < samples; i++)
  {
    sum += analogRead(SOIL_PIN);
    delay(10);
  }
  int raw = sum / samples;

  long mapped = map(raw, CAL_DRY, CAL_WET, 0, 100);
  return constrain(mapped, 0, 100);
}

static void ensureConnected()
{
  if (mqtt.connected())
    return;

  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.print("[wifi] menghubungkan ke ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 15000)
    {
      delay(500);
      Serial.print('.');
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED)
    {
      Serial.print("[wifi] terhubung, IP ");
      Serial.println(WiFi.localIP());
    }
    else
    {
      Serial.println("[wifi] gagal terhubung");
    }
  }

  if (WiFi.status() != WL_CONNECTED)
    return;

  if (mqtt.username() != nullptr && String(mqtt.username()) != "")
  {
    mqtt.connect(MQTT_TOPIC, MQTT_USERNAME, MQTT_PASSWORD);
  }
  else
  {
    mqtt.connect(MQTT_TOPIC);
  }

  if (mqtt.connected())
  {
    Serial.println("[mqtt] terhubung ke broker");
  }
  else
  {
    Serial.print("[mqtt] koneksi gagal, rc=");
    Serial.println(mqtt.state());
  }
}

static void publishReading()
{
  float soil = readSoilMoisture();

#ifdef WITH_TEMP_SENSOR
  float temp = dht.readTemperature();
  if (isnan(temp))
    temp = 25.0;
#else
  float temp = 25.0; // asumsi ruangan; sensor suhu terpisah nonaktif
#endif

  char payload[96];
  snprintf(payload, sizeof(payload),
           "{\"soil_moisture\":%.1f,\"temperature\":%.1f}", soil, temp);

  Serial.print("[data] ");
  Serial.println(payload);

  bool ok = mqtt.publish(MQTT_TOPIC, payload);
  if (!ok)
  {
    Serial.println("[mqtt] publish gagal");
  }
}

void setup()
{
  Serial.begin(115200);

  WiFi.mode(WIFI_STA);

#ifdef WITH_TEMP_SENSOR
  dht.begin();
#endif

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  ensureConnected();
}

void loop()
{
  if (millis() - lastSample >= SAMPLE_INTERVAL_MS)
  {
    lastSample = millis();
    ensureConnected();
    if (mqtt.connected())
    {
      publishReading();
    }
  }

  mqtt.loop();
  delay(10);
}