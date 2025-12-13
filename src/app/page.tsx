"use client";

import Link from "next/link";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-700">
                โรงพยาบาลนพรัตน์ราชธานี
              </h1>
              <p className="mt-3 text-gray-600 leading-relaxed">
                ระบบแจ้งซ่อมและติดต่อทีม IT Support
                สำหรับบุคลากรในโรงพยาบาลนพรัตน์ราชธานี —
                ส่งข้อมูลแจ้งปัญหาและติดตามสถานะงานได้อย่างสะดวก รวดเร็ว
                และเป็นระบบ
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href="/repair"
                  className="px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow w-full sm:w-auto text-center"
                >
                  ➕ แจ้งปัญหาใหม่
                </Link>

                <Link
                  href="/status"
                  className="px-5 py-3 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 w-full sm:w-auto text-center"
                >
                  📋 ตรวจสอบสถานะงาน
                </Link>

                <Link
                  href="/troubleshoot"
                  className="px-5 py-3 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 w-full sm:w-auto text-center"
                >
                  🛠️ ปัญหาเบื้องต้น
                </Link>

                <Link
                  href="/admin/login"
                  className="px-5 py-3 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 w-full sm:w-auto text-center"
                >
                  🔐 แอดมิน
                </Link>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                <strong>เวลาให้บริการ:</strong> วันธรรมดา 08:00 - 16:00
                (อาจเปลี่ยนตามวันหยุดราชการ)
              </div>
            </div>

            {/* Responsive Box (stacks on small screens) */}
            <div className="w-full sm:w-72 md:w-56 text-center">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-700">
                  ฝ่าย IT Support
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  ทีมซ่อมบำรุงอุปกรณ์คอมพิวเตอร์ ปริ้นเตอร์ และเครือข่าย
                </p>
                <a className="mt-2 inline-block text-sm font-semibold text-green-600" href="tel:7671">
                  ติดต่อ: 7671
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
          {/* บริการ */}
          <div className="bg-white rounded-xl shadow p-6">
            <h4 className="text-lg font-semibold text-blue-700">บริการ</h4>
            <p className="text-sm text-gray-600 mt-2">
              ดูแลคอมพิวเตอร์, ปริ้นเตอร์, เครือข่าย และการตั้งค่า
            </p>
          </div>

          {/* ขั้นตอนการแจ้ง */}
          <div className="bg-white rounded-xl shadow p-6 ">
            <h4 className="text-lg font-semibold text-blue-700">
              ขั้นตอนการแจ้ง
            </h4>
            <p className="text-sm text-gray-600 mt-2">
              กรอกรายละเอียด → ส่งแจ้ง → ทีมตรวจสอบ → ดำเนินการซ่อม/แก้ไข
            </p>
          </div>

          {/* ติดต่อ — อยู่แถวล่าง & จัดข้อความกลาง */}
          <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
            <h4 className="text-lg font-semibold text-blue-700">ติดต่อ</h4>
            <p className="text-sm text-gray-600 mt-2">
              IT Support: ติดต่อ 7671 หรือกรอกฟอร์มแจ้งปัญหา
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
