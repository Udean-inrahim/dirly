# Dirly - Product Requirement Document (Soil Moisture Monitoring)

Status: human-authored scope, adapted to the chosen soil-moisture tech stack.

## 1. Ringkasan

Dirly adalah sistem pemantauan kelembapan tanah (dan suhu tanah sebagai metrik sekunder)
untuk tanaman di berbagai titik. Sistem membaca data dari sensor kapasitif lewat ESP32,
mengirimnya ke broker MQTT, menyimpan ke PostgreSQL, mengevaluasi ambang batas menjadi
alert, dan menampilkan kondisi terkini pada dashboard web secara live.

```
Capacitive Sensor -> ESP32 -> MQTT Mosquitto -> Fastify API -> PostgreSQL
                                                  |-> WebSocket -> React dashboard
```

## 2. Tujuan

- Memantau kelembapan tanah beberapa lokasi (pot/bedeng/rumah kaca) secara kontinu.
- Mendeteksi tanah kering (di bawah ambang) dan kelembapan berlebih.
- Memantau kesehatan koneksi sensor (offline/online) dan memberi peringatan saat sensor diam.
- Menampilkan riwayat pengukuran yang dapat difilter, serta grafik tren.

## 3. Non-tujuan (diputuskan)

- Bukan pemantauan suhu/kelembapan ruangan (PRD awal "Smart Temperature Monitoring"
  diputuskan diganti dengan metrik kelembapan tanah).
- Tidak ada kontrol aktuator (pompa/siram otomatis) pada cakupan awal.
- Tidak ada autentikasi per-agregator; satu role admin cukup untuk versi awal.

## 4. Persona dan peran

- Admin: satu akun (seed) yang dapat melihat semua data, mengelola sensor, mengubah
  ambang batas, dan merespons alert. Role non-admin disiapkan di model data untuk tahap
  berikutnya.

## 5. Fitur

1. **Dashboard** : ringkasan real-time: kartu status per sensor (kelembapan, suhu,
   kesehatan ONLINE/OFFLINE/DISABLED), grafik tren beberapa jam terakhir, alert aktif,
   daftar pengukuran terbaru.
2. **Sensor** : daftar, tambah, ubah, aktif/nonaktifkan, hapus.
3. **Riwayat** : tabel pengukuran dengan filter sensor dan rentang tanggal.
4. **Alert** : daftar alert aktif/riwayat; alert resolvable oleh admin.
5. **Pengaturan** : ambang kelembapan, ambang suhu, interval refresh, timeout offline.
6. **Ingest** : dua jalur: HTTP `POST /api/readings` dan MQTT `soil/sensors/+/data`
   (payload JSON `{soil_moisture, temperature?}`, suhu default 25).
7. **Live update** : WebSocket `/ws` mendorong perubahan (reading, sensor, alert, settings)
   ke dashboard; fallback polling mengikuti `refreshIntervalSec`.

## 6. Rule evaluasi dan alert

- Level tanah dari kelembapan terhadap ambang: LOW (kering) < minSoilMoisture,
  HIGH (basah) > maxSoilMoisture, OK di antaranya.
- Suhu: LOW < minTemperature, HIGH > maxTemperature.
- Tipe alert: `SOIL_LOW`, `SOIL_HIGH`, `TEMP_HIGH`, `SENSOR_OFFLINE`.
- `SENSOR_OFFLINE` dibuat saat sensor aktif tidak mengirim data melebihi `offlineTimeoutSec`
  (cek berkala tiap 15 detik) dan otomatis diresolusi saat data masuk kembali.
- Alert kelembapan/suhu dibuat saat kondisi abnormal dan diresolusi otomatis saat kembali
  normal; pengecekan per pengukuran masuk.

## 7. Data dan model (ringkas)

- `User` (admin seed `admin@dirly.dev`/`admin123`), `Sensor` (kode unik, nama, lokasi,
  tanaman opsional, aktif, `lastSeenAt`), `Reading` (soilMoisture, temperature, recordedAt),
  `Alert` (tipe, status ACTIVE/RESOLVED), `Setting` (singleton ambang dan interval).

## 8. Persyaratan non-fungsional

- API stateless, JWT Bearer untuk seluruh rute `/api` (rute ingest device memakai
  `X-Device-Token` opsional).
- Validasi input dengan Zod di semua rute.
- Dashboard responsif (grid), aksesibel (label, fokus terlihat, status tidak hanya warna).

## 9. Kriteria penerimaan

- Data dari simulator/MQTT muncul di dashboard < beberapa detik tanpa refresh manual.
- Sensor yang berhenti mengirim > `offlineTimeoutSec` berstatus OFFLINE dan memicu alert.
- Admin dapat mengubah ambang dan daftar sensor; perubahan tampak live.
- Login non-admin dilarang mengubah data.

## 10. Panduan visual

Lihat `DESIGN.md`: dashboard fungsional tenang, palette slate bernuansa dingin dengan accent
emerald untuk kelembapan tanah, dial ENERGY 2 / RHYTHM 2 / MOTION 1, tanpa animasi berlebihan.