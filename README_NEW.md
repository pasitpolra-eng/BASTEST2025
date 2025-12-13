# โรงพยาบาลนพรัตน์ราชธานี - ระบบแจ้งซ่อมอุปกรณ์ IT

ระบบจัดการคำขอซ่อมแซมและติดต่อสอบถามปัญหา IT โดยมีระบบติดตามสถานะแบบเรียลไทม์สำหรับบุคลากรในโรงพยาบาล

## คุณสมบัติหลัก

- ✅ ส่งแบบฟอร์มแจ้งซ่อม
- ✅ ติดตามสถานะงานแบบเรียลไทม์
- ✅ แอดมิน Dashboard
- ✅ LINE Bot Integration
- ✅ ดาวน์โหลด CSV
- ✅ ระบบช่วยเหลือปัญหาพื้นฐาน
- ✅ Thai language interface

## ความต้องการ

- Node.js 18+
- npm หรือ yarn
- Supabase account
- LINE Bot account (optional)

## เริ่มต้นใช้งาน

### 1. ติดตั้ง

```bash
npm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env.local
# แก้ไข .env.local ด้วยข้อมูลจริง
```

### 3. ตั้งค่า Supabase

สร้างตารางใน Supabase:

```sql
CREATE TABLE repair_requests (
  id BIGSERIAL PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  dept_name TEXT,
  dept_building TEXT,
  dept_floor TEXT,
  device TEXT NOT NULL,
  device_id TEXT NOT NULL,
  issue TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  receipt_no TEXT,
  reject_reason TEXT,
  handler_id TEXT,
  handler_tag TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_job_id ON repair_requests(job_id);
CREATE INDEX idx_status ON repair_requests(status);
CREATE INDEX idx_device_id ON repair_requests(device_id);
CREATE INDEX idx_created_at ON repair_requests(created_at DESC);
```

### 4. รัน Development Server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## โครงสร้าง

```
src/
├── app/
│   ├── page.tsx                 # หน้าแรก
│   ├── repair/page.tsx          # แจ้งซ่อม
│   ├── status/page.tsx          # ติดตามสถานะ
│   ├── troubleshoot/page.tsx    # ช่วยเหลือ
│   ├── admin/
│   │   ├── page.tsx            # Dashboard
│   │   └── login/page.tsx       # ล็อกอิน
│   └── api/                     # API Routes
├── components/
│   ├── RepairForm.tsx
│   └── ErrorBoundary.tsx
└── utils/
    ├── submitRepair.ts
    ├── supabase.ts
    ├── dateFormat.ts
    └── env.ts
```

## API Endpoints

```
POST /api/submit                    # ส่งแบบฟอร์ม
GET  /api/reports                   # ดึงรายงาน
POST /api/reports                   # อัปเดต (admin)
DELETE /api/reports                 # ลบ (admin)
GET  /api/export                    # ดาวน์โหลด CSV (admin)
POST /api/admin/login              # ล็อกอิน
```

## Build & Deploy

```bash
npm run build
npm start
```

## Support

สำหรับปัญหาหรือคำถาม กรุณาติดต่อแผนก IT โทร 7671
