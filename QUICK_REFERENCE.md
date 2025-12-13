# ⚡ Quick Reference - ระบบแจ้งซ่อม

## 🚀 เริ่มต้น (30 วินาที)

```bash
npm install
cp .env.example .env.local
# แก้ไข .env.local
npm run dev
# เปิด http://localhost:3000
```

---

## 📱 URLs

| หน้า | URL |
|------|-----|
| 🏠 หน้าแรก | `http://localhost:3000/` |
| 📝 แจ้งซ่อม | `http://localhost:3000/repair` |
| 📊 ติดตามสถานะ | `http://localhost:3000/status` |
| 🛠️ ช่วยเหลือ | `http://localhost:3000/troubleshoot` |
| 🔐 ล็อกอิน | `http://localhost:3000/admin/login` |
| 👨‍💼 แดชบอร์ด | `http://localhost:3000/admin` |

---

## 🔑 Key Env Variables

```env
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_USER=admin
ADMIN_PASS=password
ADMIN_COOKIE_SECRET=secret
```

---

## 📚 Documentation Files

| ไฟล์ | เนื้อหา |
|-----|--------|
| `SETUP_GUIDE.md` | 📖 คำแนะนำการตั้งค่าและใช้งาน |
| `FEATURES.md` | ✨ รายละเอียดคุณสมบัติ |
| `SUMMARY.md` | 📋 สรุปการปรับปรุง |
| `.env.example` | 🔐 ตัวแปร environment |

---

## 🗂️ Project Structure

```
src/
├── app/             # Pages & API routes
├── components/      # Reusable components
├── utils/          # Helper functions
├── hooks/          # Custom React hooks
├── types/          # TypeScript definitions
├── config.ts       # App configuration
└── middleware.ts   # Auth middleware
```

---

## 🔌 API Endpoints

### Public
```
POST /api/submit             # ส่งแบบฟอร์ม
GET  /api/reports            # ดึงรายงาน
```

### Admin (Require Cookie)
```
POST   /api/reports          # อัปเดต
DELETE /api/reports          # ลบ
GET    /api/export           # Export CSV
POST   /api/admin/login      # ล็อกอิน
POST   /api/admin/logout     # ล็อกเอาท์
```

---

## 🛠️ Common Commands

```bash
npm install           # ติดตั้ง dependencies
npm run dev          # รัน dev server
npm run build        # สร้าง production
npm start            # รัน production
npm run lint         # ตรวจสอบ code
```

---

## 🐛 Debugging

```javascript
// ใช้ logger แทน console.log
import { logger } from '@/utils/logger';

logger.info('context', 'message', { data });
logger.error('context', 'message', { data });
```

---

## 📊 Supabase Table

```sql
repair_requests (
  id, job_id, full_name, dept_name,
  device, device_id, issue, phone,
  status, receipt_no, reject_reason,
  created_at, updated_at
)
```

---

## 🔒 Authentication

- **Admin Login**: Username + Password
- **Session**: HMAC-signed cookie
- **Timeout**: 1 hour auto-logout
- **Warning**: 5 minutes before timeout

---

## 📲 Form Fields

### Required (บังคับ)
- ✅ ชื่อผู้แจ้ง
- ✅ ชนิดอุปกรณ์
- ✅ หมายเลขเครื่อง
- ✅ ปัญหา/อาการ

### Optional (เลือก)
- ⭕ แผนก
- ⭕ อาคาร/ชั้น
- ⭕ เบอร์โทร (10 หลัก)
- ⭕ หมายเหตุ

---

## 🚨 Error Codes

| Code | ความหมาย |
|------|---------|
| 400 | Validation error |
| 401 | Unauthorized |
| 500 | Server error |

---

## 💡 Tips

- 💾 ใช้ session storage สำหรับ lastReport
- 🔍 ค้นหาโดย Job ID, Device ID, Name
- 📥 ดาวน์โหลด CSV โดยคลิกปุ่ม Export
- ⏰ Session หมดอายุ 1 ชั่วโมง
- 📞 ติดต่อ IT: 7671

---

## ✅ Checklist

- [ ] npm install
- [ ] .env.local setup
- [ ] Supabase ready
- [ ] npm run dev
- [ ] Test form submit
- [ ] Test admin login
- [ ] Test CSV export

---

## 📞 Support

**IT Help**: โทร 7671

**When reporting bugs:**
- ✅ Include Job ID
- ✅ Describe action taken
- ✅ Include error message
- ✅ Mention browser/device

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready
