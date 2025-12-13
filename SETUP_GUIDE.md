# 🎯 ระบบแจ้งซ่อมอุปกรณ์ IT - แนวทางสมบูรณ์

## 📊 สถานะระบบ: ✅ สมบูรณ์ และ พร้อมใช้งาน

ระบบแจ้งซ่อมอุปกรณ์ IT ของโรงพยาบาลนพรัตน์ราชธานี ได้รับการปรับปรุงให้ครบครันแล้ว ด้วยคุณสมบัติครบถ้วนและมีการจัดการข้อผิดพลาด

---

## 🚀 เริ่มต้นใช้งาน (5 นาที)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
npm install
```

### ขั้นตอนที่ 2: ตั้งค่า Environment
```bash
cp .env.example .env.local
# แล้วแก้ไข .env.local ด้วยข้อมูลจริง
```

### ขั้นตอนที่ 3: เตรียม Supabase
ไปที่ Supabase SQL editor และรัน:
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

### ขั้นตอนที่ 4: รันระบบ
```bash
npm run dev
# เปิด http://localhost:3000
```

---

## 📖 การใช้งาน

### 👤 สำหรับผู้ใช้ทั่วไป

#### แจ้งซ่อมอุปกรณ์
1. ไปที่ http://localhost:3000/repair
2. กรอกข้อมูลต่อไปนี้:
   - ชื่อผู้แจ้ง (บังคับ)
   - แผนก (เลือก)
   - อาคาร/ชั้น (เลือก)
   - ชนิดอุปกรณ์ (บังคับ)
   - หมายเลขเครื่อง (บังคับ)
   - ปัญหา/อาการ (บังคับ)
   - เบอร์โทร (เลือก - ต้องเป็น 10 หลัก)
   - หมายเหตุ (เลือก)
3. คลิก "ส่งแบบฟอร์ม"
4. รับ Job ID เพื่อติดตามสถานะ

#### ติดตามสถานะ
1. ไปที่ http://localhost:3000/status
2. ค้นหาด้วย:
   - Job ID
   - หมายเลขเครื่อง
   - ชื่อ
   - แผนก
3. ดูสถานะและรายละเอียด

#### ขอความช่วยเหลือ
1. ไปที่ http://localhost:3000/troubleshoot
2. เลือกปัญหาของคุณ
3. ทำตามขั้นตอนที่ให้ไว้

### 👨‍💼 สำหรับแอดมิน

#### ล็อกอิน
1. ไปที่ http://localhost:3000/admin/login
2. ใส่:
   - Username: (ตั้งค่าใน ADMIN_USER)
   - Password: (ตั้งค่าใน ADMIN_PASS)

#### จัดการงาน
1. ดูรายการงานที่ค้างอยู่
2. คลิกเพื่อดูรายละเอียด
3. เลือกการกระทำ:
   - **รับงาน**: เปลี่ยนสถานะเป็น "กำลังดำเนินการ"
   - **เสร็จสิ้น**: บันทึกเลขใบรับสิ่งของ
   - **ปฏิเสธ**: ระบุเหตุผล
   - **ลบ**: ลบรายงาน

#### ดาวน์โหลดข้อมูล
1. คลิกปุ่ม "📥 ส่งออก" ด้านบนขวา
2. เลือกสถานะ (ทั้งหมด, รอรับงาน, กำลังดำเนินการ, เสร็จสิ้น, ถูกปฏิเสธ)
3. ไฟล์ CSV จะดาวน์โหลดอัตโนมัติ

#### ออกจากระบบ
- คลิกปุ่ม "ออกจากระบบ"
- หากนั่งไม่ใช้งาน 1 ชั่วโมง ระบบจะออกอัตโนมัติ

---

## 🎨 หน้าต่างๆ และฟังก์ชัน

| หน้า | URL | ลิงค์ | ฟังก์ชัน |
|------|-----|------|---------|
| หน้าแรก | `/` | Home | ลิงค์ไปหน้าต่างๆ |
| แจ้งซ่อม | `/repair` | Report repair | ส่งแบบฟอร์ม |
| ติดตามสถานะ | `/status` | Check status | ค้นหาและติดตาม |
| ช่วยเหลือ | `/troubleshoot` | Basic problems | คำแนะนำแก้ไข |
| ล็อกอิน | `/admin/login` | Admin | เข้าสู่ระบบแอดมิน |
| แดชบอร์ด | `/admin` | Dashboard | จัดการงาน |

---

## 🔐 ตัวแปร Environment ที่จำเป็น

### Supabase
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJxx...
```

### LINE Bot (ทำให้การแจ้งเตือนทำงาน)
```env
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_ID=xxx
LINE_USER_ID=xxx
```

### Admin Auth
```env
ADMIN_USER=admin
ADMIN_PASS=your_secure_password
ADMIN_COOKIE_SECRET=your_secret_key
```

### Application
```env
APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🛠️ API Endpoints Reference

### Public
```
POST /api/submit
- ส่งแบบฟอร์มแจ้งซ่อม
- Body: { fullName, deptName, deptBuilding, deptFloor, device, deviceId, issue, phone, notes }
- Response: { ok, jobId, error }

GET /api/reports
- ดึงรายงานทั้งหมด (ไม่ต้องการ auth)
- Response: Array of repairs
```

### Protected (Admin Only)
```
POST /api/reports
- อัปเดตสถานะ งาน
- Headers: Cookie admin_auth
- Body: { jobId, status, receiptNo?, reason? }
- Response: { ok, updated, status }

DELETE /api/reports
- ลบรายงาน
- Headers: Cookie admin_auth
- Body: { id }
- Response: { ok, message }

GET /api/export?format=csv&status=all
- ดาวน์โหลด CSV
- Headers: Cookie admin_auth
- Response: CSV file
```

### Auth
```
POST /api/admin/login
- ล็อกอิน
- Body: { username, password }
- Response: { ok, error? }

POST /api/admin/logout
- ล็อกเอาท์
- Response: { ok }
```

---

## 📦 โครงสร้างไฟล์

```
repair-system/
├── src/
│   ├── app/
│   │   ├── page.tsx              # หน้าแรก
│   │   ├── repair/
│   │   │   └── page.tsx          # แจ้งซ่อม
│   │   ├── status/
│   │   │   └── page.tsx          # ติดตามสถานะ
│   │   ├── troubleshoot/
│   │   │   └── page.tsx          # ช่วยเหลือ
│   │   ├── admin/
│   │   │   ├── page.tsx          # แดชบอร์ด
│   │   │   └── login/page.tsx    # ล็อกอิน
│   │   ├── api/
│   │   │   ├── submit/route.ts
│   │   │   ├── reports/route.ts
│   │   │   ├── export/route.ts
│   │   │   ├── admin/login/route.ts
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── RepairForm.tsx        # ฟอร์ม
│   │   └── ErrorBoundary.tsx     # Error handling
│   ├── utils/
│   │   ├── submitRepair.ts       # API helper
│   │   ├── supabase.ts          # DB client
│   │   ├── errorHandler.ts      # Error utilities
│   │   ├── logger.ts            # Logging
│   │   ├── dateFormat.ts        # Date helper
│   │   └── env.ts               # Env validation
│   ├── hooks/
│   │   └── useSession.ts        # Session hook
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── config.ts                 # Configuration
│   └── middleware.ts             # Auth middleware
├── public/
│   └── hospital-logo.png
├── .env.example                  # Env template
├── README_NEW.md                 # Setup guide
├── FEATURES.md                   # Features list
├── SETUP_GUIDE.md               # This file
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
└── verify.sh                     # Verification script
```

---

## ✨ คุณสมบัติพิเศษ

### ✅ Validation
- ✅ Thai phone number (10 digits)
- ✅ Required fields
- ✅ Form error messages in Thai
- ✅ Real-time validation feedback

### ✅ Error Handling
- ✅ Error boundaries for crashes
- ✅ Network error retry logic
- ✅ User-friendly error messages
- ✅ Detailed logging for debugging

### ✅ Security
- ✅ HMAC-based authentication
- ✅ HttpOnly cookies
- ✅ CSRF protection
- ✅ SQL injection prevention (Supabase)
- ✅ Session timeout (1 hour)

### ✅ User Experience
- ✅ Real-time status updates (5 sec polling)
- ✅ Session warning (5 min before logout)
- ✅ Thai language throughout
- ✅ Mobile responsive
- ✅ CSV export
- ✅ LINE notifications

### ✅ Performance
- ✅ Indexed database queries
- ✅ Optimized polling
- ✅ Image optimization
- ✅ CSS optimization (Tailwind)

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to database"
**วิธีแก้:**
1. ตรวจสอบ SUPABASE_URL ถูกต้อง
2. ตรวจสอบ SUPABASE_SERVICE_ROLE_KEY
3. สร้างตาราง repair_requests
4. ตรวจสอบ Supabase RLS policies

### ❌ "LINE notifications not working"
**วิธีแก้:**
1. ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN
2. ตรวจสอบ LINE webhook URL
3. เปิด LINE console สำหรับตรวจสอบ logs

### ❌ "Login failed"
**วิธีแก้:**
1. ตรวจสอบ ADMIN_USER และ ADMIN_PASS
2. ตรวจสอบ ADMIN_COOKIE_SECRET
3. ล้าง browser cookies
4. ลองล็อกอินใหม่

### ❌ "Export button not working"
**วิธีแก้:**
1. ตรวจสอบล็อกอินอยู่
2. ตรวจสอบ browser console errors
3. ตรวจสอบ /api/export endpoint
4. ลองใหม่โดย refresh หน้า

### ❌ "Session timeout too fast"
**วิธีแก้:**
- แก้ไข SESSION_TIMEOUT_MS ใน src/config.ts
- เริ่มต้น: 60 * 60 * 1000 (1 ชั่วโมง)

---

## 📱 Mobile & Desktop

✅ ระบบสนับสนุน:
- iPhone / iPad
- Android phones
- Tablets
- Desktop computers
- Touch & keyboard navigation

---

## 🔄 Deployment

### Vercel (ง่ายที่สุด)
```bash
vercel deploy
```

### Docker
```bash
docker build -t repair-system .
docker run -p 3000:3000 repair-system
```

### Self-hosted (VPS)
```bash
npm run build
npm start
# หรือ pm2 start next.js
```

---

## 📊 Database Schema

```sql
repair_requests (
  id: BigInt,                 -- Primary key
  job_id: Text (UNIQUE),      -- Job reference
  full_name: Text,            -- Requester name
  dept_name: Text,            -- Department
  dept_building: Text,        -- Building
  dept_floor: Text,           -- Floor
  device: Text,               -- Device type
  device_id: Text,            -- Device model/serial
  issue: Text,                -- Problem description
  phone: Text,                -- Contact phone
  notes: Text,                -- Additional notes
  status: Text,               -- pending/in-progress/completed/rejected
  receipt_no: Text,           -- Receipt number (optional)
  reject_reason: Text,        -- Rejection reason (optional)
  handler_id: Text,           -- Who handled it
  handler_tag: Text,          -- Handler tag
  created_at: Timestamp,      -- Created date
  updated_at: Timestamp       -- Updated date
)

Indexes:
- job_id (UNIQUE)
- status
- device_id
- created_at (DESC)
```

---

## 📞 Support & Contact

**IT Support:**
- โทร: 7671
- Line: @hospital_it_support
- Email: it-support@hospital.ac.th

**เมื่อติดต่อ โปรดบอก:**
- Job ID
- เครื่องที่เสียหาย
- อาการสั้นๆ
- ที่ตั้งแน่ชัด

---

## ✅ Checklist ก่อนใช้งาน

- [ ] npm install
- [ ] .env.local ตั้งค่าเรียบร้อย
- [ ] Supabase ตั้งค่าเรียบร้อย
- [ ] ตาราง repair_requests สร้างแล้ว
- [ ] npm run dev ทำงาน
- [ ] สามารถส่งแบบฟอร์มได้
- [ ] สามารถติดตามสถานะได้
- [ ] Admin login ทำงาน
- [ ] CSV export ทำงาน
- [ ] หากใช้ LINE: ตั้งค่า webhook

---

✅ **ระบบพร้อมใช้งาน**

หากมีปัญหา โปรดตรวจสอบ logs และ FEATURES.md

ขอให้ประสบความสำเร็จ! 🎉
