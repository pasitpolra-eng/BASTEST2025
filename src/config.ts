/**
 * Application configuration
 */

export const APP_CONFIG = {
  REPORT_POLLING_INTERVAL: 5000, 
  WEBHOOK_SYNC_INTERVAL: 10000, 
  
  SESSION_TIMEOUT_MS: 60 * 60 * 1000, 
  SESSION_WARNING_MS: 55 * 60 * 1000, 
  
  PHONE_DIGITS_REQUIRED: 10,
  MIN_ISSUE_LENGTH: 5,
  MAX_NOTES_LENGTH: 500,
  CSV_BATCH_SIZE: 1000,
  
  SHOW_COMPLETION_NOTIFICATION_DURATION: 5000, 
  
  STATUS_COLORS: {
    pending: "bg-amber-100 text-amber-800",
    "in-progress": "bg-slate-800 text-white",
    completed: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  },
  
  STATUS_LABELS: {
    pending: "รอรับงาน",
    "in-progress": "กำลังดำเนินการ",
    completed: "เสร็จสิ้น",
    rejected: "ถูกปฏิเสธ",
  },
};

export const FEATURES = {
  ENABLE_LINE_NOTIFICATIONS: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
  ENABLE_CSV_EXPORT: true,
  ENABLE_ADMIN_DASHBOARD: true,
  ENABLE_TROUBLESHOOT_PAGE: true,
  ENABLE_WEBHOOK_SYNC: true,
};

export const API_ENDPOINTS = {
  SUBMIT: "/api/submit",
  REPORTS: "/api/reports",
  EXPORT: "/api/export",
  ADMIN_LOGIN: "/api/admin/login",
  ADMIN_LOGOUT: "/api/admin/logout",
  LINE_INTERACTIONS: "/api/Line/interactions",
  SYNC_WEBHOOKS: "/api/sync-webhook-events",
};

export const ERROR_MESSAGES = {
  INVALID_PHONE: "หมายเลขโทรศัพท์ต้องเป็น 4 หลัก",
  REQUIRED_FIELD: "กรุณากรอกข้อมูล",
  SUBMIT_FAILED: "ส่งข้อมูลล้มเหลว กรุณาลองใหม่",
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่อ",
  INVALID_CREDENTIALS: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  SESSION_EXPIRED: "เซสชั่นหมดอายุ กรุณาลงชื่อเข้าใช้อีกครั้ง",
};
