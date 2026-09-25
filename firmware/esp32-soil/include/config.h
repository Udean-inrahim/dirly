#pragma once

// Ubah sesuai lingkungan Anda sebelum build.

// --- WiFi ---
#define WIFI_SSID "ganti-ssid"
#define WIFI_PASSWORD "ganti-password"

// --- MQTT ---
#define MQTT_HOST "192.168.1.10"
#define MQTT_PORT 1883
#define MQTT_USERNAME ""   // kosongkan bila broker tanpa autentikasi
#define MQTT_PASSWORD ""
#define MQTT_TOPIC "soil/sensors/SM-001/data"

// --- Sensor ---
// Pin ADC analog untuk capacitive soil moisture sensor (ADC1, tanpa pull-up/pull-down).
#define SOIL_PIN 34

// Kalibrasi mentah ADC. Konfirmasi dengan sensor Anda:
//   - Letakkan sensor di udara kering kira-kira 5 menit, catat CAL_DRY.
//   - Rendam di air bersih, catat CAL_WET.
// Nilai ADC bisa terbalik tergantung modul (kelembapan tinggi = ADC kecil).
// Perbesar CAL_WET jika air menghasilkan angka yang lebih kecil dari udara.
#define CAL_DRY 2900
#define CAL_WET 1200

// --- Timer ---
// Interval pembacaan & publish dalam milidetik (5000 = tiap 5 detik).
#define SAMPLE_INTERVAL_MS 5000

// --- Suhu (opsional) ---
// Aktifkan bila memakai DHT22 terpisah: define WITH_TEMP_SENSOR dan DHT_PIN.
// tanpa itu, suhu yang dikirim 25.0 (asumsi ruangan).
// #define WITH_TEMP_SENSOR
#define DHT_PIN 15