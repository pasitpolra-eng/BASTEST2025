-- SQL สำหรับเพิ่มคอลัมน์ handler_tag (ชื่อผู้รับงาน) ลงในตาราง repair_requests

-- หากยังไม่มีคอลัมน์ handler_tag ให้เพิ่มเข้าไป
ALTER TABLE repair_requests
ADD COLUMN IF NOT EXISTS handler_tag VARCHAR(255) DEFAULT NULL;

-- SQL สำหรับอัปเดตผู้รับงาน
-- ตัวอย่างการใช้งาน:
UPDATE repair_requests 
SET 
  handler_tag = 'ชื่อผู้รับงาน',
  status = 'in-progress',
  updated_at = NOW()
WHERE job_id = '77606ba0-b04f-4053-8efa-160907e2ee4c';

-- SQL สำหรับค้นหาข้อมูลผู้รับงาน
SELECT 
  id,
  job_id,
  full_name as ชื่อผู้แจ้ง,
  handler_tag as ผู้รับงาน,
  status as สถานะ,
  updated_at as เวลาอัปเดต
FROM repair_requests
WHERE status = 'in-progress'
ORDER BY updated_at DESC;
