# Proposal Transformasi Sistem Checklist (To-Do List Driven)

## 1. Perbandingan User Journey (As-Is vs To-Be)

Diagram ini menunjukkan bagaimana konsep "To-Do List" akan memangkas proses klik user yang tadinya panjang menjadi sangat efisien dan otomatis.

```mermaid
graph TD
    subgraph Flow_Saat_Ini_AsIs [Flow Saat Ini: Manual & Panjang]
        A1[User Login] --> A2[Klik 'Buat Laporan Baru']
        A2 --> A3[Pilih Area dari Dropdown]
        A3 --> A4[Pilih Ruangan]
        A4 --> A5[Pilih Equipment]
        A5 --> A6[Pilih Form/Template]
        A6 --> A7[Isi Form Parameter Cek]
        A7 --> A8[Submit Laporan]
        
        style A2 fill:#f9d0c4,stroke:#e06666
        style A3 fill:#f9d0c4,stroke:#e06666
        style A4 fill:#f9d0c4,stroke:#e06666
        style A5 fill:#f9d0c4,stroke:#e06666
        style A6 fill:#f9d0c4,stroke:#e06666
    end

    subgraph Flow_Baru_ToBe [Flow Baru: To-Do List]
        B1[User Login] --> B2{Sistem Identifikasi NIK User}
        B2 --> B3[Dashboard Menampilkan <br> Card 'Tugas Anda Hari Ini']
        B3 --> B4[User Klik Task Spesifik <br> e.g., 'Checklist Forklift Weekly']
        B4 -. Bypass (Otomatis deteksi Area/Room/Aset) .-> B7
        B7[Langsung Isi Form Parameter Cek] --> B8[Submit Laporan]
        
        style B3 fill:#d9ead3,stroke:#93c47d
        style B4 fill:#d9ead3,stroke:#93c47d
        style B7 fill:#cfe2f3,stroke:#6fa8dc
    end
```

**Penjelasan untuk Atasan:** 
*"Pak/Bu, perhatikan kotak berwarna merah. Itu adalah *pain points* user saat ini karena harus memilih data berulang kali secara manual. Di Flow Baru (hijau), *pain points* itu sepenuhnya hilang karena sistem yang secara proaktif 'mencarikan' tugas (PR) untuk user tersebut."*

---

## 2. Arsitektur Database (Entity-Relationship Diagram)

Untuk mewujudkan *flow* di atas, data Excel yang Bapak/Ibu berikan (Inventaris, NRA, Data PIC) akan ditransformasi menjadi struktur database relasional sebagai berikut:

```mermaid
erDiagram
    USER ||--o{ PIC_ASSIGNMENT : "Ditugaskan ke"
    USER {
        string NIK PK "e.g. 13097124"
        string name "e.g. SARIF HIDAYAT"
        string role "ES / COORD"
    }

    AREA ||--o{ ROOM : "Memiliki"
    AREA {
        string id PK
        string code "e.g. WH BANDUNG"
        string type "WAREHOUSE"
    }

    ROOM ||--o{ EQUIPMENT : "Berisi"
    ROOM {
        string id PK
        string areaId FK
        string name "e.g. Gudang Utama"
    }

    EQUIPMENT ||--o{ PIC_ASSIGNMENT : "Diurus oleh"
    EQUIPMENT {
        string id PK
        string roomId FK
        string name "e.g. Conveyor Unit 1"
        string type "CONVEYOR"
    }

    CHECKLIST_TEMPLATE ||--o{ PIC_ASSIGNMENT : "Menggunakan"
    CHECKLIST_TEMPLATE {
        string id PK
        string nraCode "e.g. SAT/FRM/TS/043"
        string name "CHECKLIST FORKLIFT WEEKLY"
        string period "WEEKLY"
    }

    PIC_ASSIGNMENT ||--o{ CHECKLIST_TASK : "Men-generate tugas"
    PIC_ASSIGNMENT {
        string id PK
        string userNik FK "Dari tabel User"
        string equipmentId FK "Dari tabel Equipment"
        string templateId FK "Dari tabel Template"
    }

    CHECKLIST_TASK ||--o| CHECKLIST_REPORT : "Diselesaikan lewat"
    CHECKLIST_TASK {
        string id PK
        string picAssignmentId FK
        string status "PENDING / OVERDUE"
        dateTime targetDate "Jadwal Pengerjaan"
    }

    CHECKLIST_REPORT {
        string id PK
        string taskId FK
        string status "COMPLETED"
    }
```

### Penjelasan Komponen Baru:
1. **`ROOM` & `EQUIPMENT`**: Tabel baru untuk memecah area menjadi hierarki yang lebih spesifik agar kita tahu pasti barang/mesin mana yang dicek.
2. **`CHECKLIST_TEMPLATE`**: Master tabel form (menyimpan NRA Code).
3. **`PIC_ASSIGNMENT` (Inti Sistem)**: Ini adalah tabel "Penugasan". Menyimpan fakta bahwa *"User A bertugas memeriksa Equipment X menggunakan form Y"*.
4. **`CHECKLIST_TASK`**: Ini adalah tabel **To-Do List**. Sistem (melalui *cron/scheduler* dari kalender excel) akan men-generate baris di tabel ini setiap minggu/bulan. Tabel inilah yang di-*query* dan ditampilkan di Dashboard user saat mereka login.
