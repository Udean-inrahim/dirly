# ESP32 Soil Moisture Firmware

Firmware PlatformIO untuk membaca capacitive soil moisture sensor dan mengirim data ke
backend Dirly lewat MQTT.

## Alur

```
Capacitive sensor (ADC) -> ESP32 -> MQTT Mosquitto -> Fastify API -> PostgreSQL
```

Setiap `SAMPLE_INTERVAL_MS` (default 5 detik), firmware mempublikasikan:

```json
{ "soil_moisture": 42.5, "temperature": 26.1 }
```

ke topik `soil/sensors/<KODE_SENSOR>/data`. Kode sensor harus terdaftar lebih dulu di
aplikasi (halaman Sensor).

## Konfigurasi

Edit `include/config.h`:

- SSID dan password WiFi
- Host/port broker MQTT (Mosquitto)
- Topik MQTT (ganti `SM-001` sesuai kode sensor yang didaftarkan)
- Kalibrasi ADC `CAL_DRY` / `CAL_WET`
- Opsional: aktifkan `WITH_TEMP_SENSOR` bila memakai DHT22 di `DHT_PIN`. Tanpa itu,
  suhu yang dikirim 25.0 (asumsi ruangan).

## Kalibrasi

1. Biarkan sensor di udara kering selama ±5 menit, baca log serial, catat nilai ADC
   kering sebagai `CAL_DRY`.
2. Rendam sensor di air, catat nilai ADC basah sebagai `CAL_WET`.
3. Sesuaikan bila angka terbalik (beberapa modul: basah menghasilkan ADC lebih kecil).

## Build & upload

```bash
pio run -t upload
pio device monitor
```

## Verifikasi

- Broker terima message: `mosquitto_sub -t "soil/#" -v`
- Aplikasi: dashboard dan halaman Riwayat menampilkan data baru setiap interval.
- Tanpa broker di jaringan lokal, firmware bisa diarahkan ke broker publik, atau sensor
  dapat memakai jalur HTTP (`POST /api/readings`) sebagai alternatif.