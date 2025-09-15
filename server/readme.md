Endpoint `/v1/generate-daily-recommendations` memeriksa **kedua aspek berikut**:

### 1. **Daily Usage (Hours)**:
   - Program mengecek apakah **durasi penggunaan harian** sebuah appliance telah melebihi target yang telah ditentukan (`DailyUseTarget`).
   - Jika melebihi, program akan memberikan peringatan bahwa appliance tersebut perlu dikontrol atau dijadwalkan ulang.

   **Contoh Pemeriksaan:**
   - Jika `DailyUseTarget = 3 jam` dan `UsageToday = 4 jam`, maka appliance tersebut dianggap **melebihi batas harian**.
   - Program akan memberikan notifikasi seperti:
     ```
     WARNING: Mesin Cuci (D1000) telah melebihi target harian!
     ```

---

### 2. **Biaya Listrik (Cost)**:
   - Program juga menghitung **biaya listrik harian** dari setiap appliance berdasarkan konsumsi energi dan tarif listrik (`electricityRate`).
   - Tujuan utama dari pemeriksaan ini adalah memberikan informasi tentang:
     - Biaya listrik harian appliance saat ini.
     - Appliance mana yang paling banyak mengonsumsi biaya listrik sehingga dapat menjadi prioritas untuk pengelolaan.

   **Contoh Pemeriksaan:**
   - Jika appliance mengonsumsi **2 kWh** energi harian, dan tarif listrik adalah **1444.70 IDR/kWh**, maka biaya listrik appliance tersebut adalah:
     ```
     Biaya = 2 × 1444.70 = 2889.40 IDR
     ```
   - Program akan mencetak informasi seperti:
     ```
     Biaya saat ini untuk Mesin Cuci: IDR 2889.40
     ```

---

### **Apa yang Jadi Fokus?**
1. **Daily Usage**:
   - Menjaga durasi penggunaan appliance tetap sesuai target harian untuk mencapai efisiensi energi.
   - Menghindari penggunaan appliance secara berlebihan yang bisa meningkatkan tagihan listrik.

2. **Biaya Listrik**:
   - Memberikan transparansi kepada pengguna mengenai biaya listrik yang digunakan oleh masing-masing appliance.
   - Membantu pengguna memutuskan appliance mana yang perlu dikurangi penggunaannya untuk menghemat biaya.

---

### **Bagaimana Jika Daily Usage dan Biaya Terkait?**
Jika penggunaan appliance (dalam jam) meningkat, konsumsi energi dan biaya listrik juga meningkat. Dengan kata lain, **daily usage** dan **biaya listrik** saling berkaitan. 

- **Peningkatan Daily Usage → Biaya Naik**.
- Oleh karena itu, pengendalian durasi penggunaan appliance juga otomatis mengontrol biaya listrik.

---

### **Kesimpulan**
Program di atas:
- **Utama:** Memeriksa *daily usage* (jam penggunaan appliance per hari).
- **Tambahan:** Menghitung dan memberikan informasi tentang biaya listrik appliance.
