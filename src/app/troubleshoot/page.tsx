"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type TroubleshootItem = {
  id: string;
  title: string;
  icon: string;
  tags?: string[];
  steps: string[];
};

const ITEMS: TroubleshootItem[] = [
  {
    id: "internet",
    title: "ไม่มีสัญญาณอินเทอร์เน็ต",
    icon: "🌐",
    tags: ["เครือข่าย"],
    steps: [
      "ตรวจสอบสาย LAN/ปลั๊กไฟของเราเตอร์และสวิตช์ว่าต่ออยู่หรือไม่",
      "ลองรีเซ็ต Wi‑Fi (ปิด/เปิด) หรือถอดแล้วเสียบสาย LAN ใหม่",
      "ตรวจสอบกับเพื่อนร่วมแผนกว่าทุกคนมีปัญหาหรือไม่",
      "ถ้ายังไม่หาย ให้แจ้งฝ่าย IT (โทร 7671 หรือ Report repair)",
    ],
  },
  {
    id: "no-power",
    title: "คอมพิวเตอร์เปิดไม่ติด",
    icon: "⚡",
    tags: ["ฮาร์ดแวร์"],
    steps: [
      "ตรวจสอบปลั๊กไฟและสวิตช์ไฟที่โต๊ะทำงาน",
      "ตรวจสอบสายไฟและอะแดปเตอร์ว่าต่อแน่น",
      "ลองต่อเข้าปลั๊ก/สายสำรอง ถ้ามี UPS ให้ตรวจสอบสถานะ",
      "ถ้ายังไม่ติด ให้บันทึกหมายเลขเครื่องและแจ้งฝ่าย IT",
    ],
  },
  {
    id: "printer",
    title: "ปริ้นเตอร์ไม่พิมพ์ / Offline",
    icon: "🖨️",
    tags: ["ปริ้นเตอร์"],
    steps: [
      "ตรวจสอบสถานะปริ้นเตอร์ (ไฟเตือน / กระดาษติดหรือไม่)",
      "รีสตาร์ทปริ้นเตอร์และเชื่อมต่อใหม่",
      "ตรวจสอบว่ไดร์เวอร์/คิวปริ้นถูกเลือกถูกต้อง",
      "ถ้ายังไม่ได้ ให้ถ่ายรูปหน้าจอและแจ้งฝ่าย IT",
    ],
  },
  {
    id: "slow",
    title: "คอมช้า / กระตุก",
    icon: "🐢",
    tags: ["ซอฟต์แวร์"],
    steps: [
      "ปิดโปรแกรมที่ไม่จำเป็นและรีสตาร์ทเครื่อง",
      "ตรวจสอบพื้นที่ว่างของฮาร์ดดิสก์ (ต้องมีว่างอย่างน้อย 10%)",
      "สแกนไวรัส/มัลแวร์ หากสงสัย",
      "ถ้ายังช้า ให้แจ้งฝ่าย IT พร้อมเวลาที่เกิดปัญหา",
    ],
  },
  {
    id: "login",
    title: "ล็อกอินไม่ได้ / รหัสผ่านผิด",
    icon: "🔐",
    tags: ["บัญชี"],
    steps: [
      "ตรวจสอบว่าพิมพ์ชื่อผู้ใช้และรหัสผ่านถูกต้อง (Caps Lock ปิด)",
      "ลองรีเซ็ตรหัสผ่านผ่านระบบ",
      "ถ้าบัญชีถูกล็อก ให้ติดต่อฝ่าย IT เพื่อปลดล็อก",
    ],
  },
  {
    id: "app-install",
    title: "โปรแกรมติดตั้งไม่ได้",
    icon: "📦",
    tags: ["ซอฟต์แวร์"],
    steps: [
      "ลอง Run as Administrator",
      "ตรวจสอบพื้นที่ว่างและอัพเดตระบบปฏิบัติการ",
      "ปิด Firewall/Antivirus ชั่วคราวถ้าสงสัยว่าบล็อก",
      "ดาวน์โหลดตัวติดตั้งจากแหล่งทางการ",
      "ถ้าเป็น .msi ลองรันคำสั่ง: msiexec /i C:\\path\\to\\file.msi",
      "ถ่ายภาพหน้าจอข้อผิดพลาดและแจ้งฝ่าย IT",
    ],
  },
  {
    id: "input-devices",
    title: "เมาส์และคีย์บอร์ดใช้ไม่ได้",
    icon: "🖱️",
    tags: ["ฮาร์ดแวร์"],
    steps: [
      "ตรวจสอบการเชื่อมต่อ: ถอดเสียบสายใหม่ หรือตรวจสอบแบตเตอรี่/Bluetooth",
      "เปลี่ยนพอร์ต USB หรือทดลองบนอุปกรณ์อื่น",
      "เปลี่ยนแบตเตอรี่และจับคู่ใหม่ (สำหรับอุปกรณ์ไร้สาย)",
      "รีสตาร์ทเครื่องคอมพิวเตอร์",
      "เข้า Device Manager เพื่อตรวจสอบสถานะ",
      "ลองใช้เมาส์/คีย์บอร์ดสำรอง เพื่อแยกปัญหา",
      "ถ้าแก้ไม่ได้ ให้แจ้งฝ่าย IT",
    ],
  },
];

export default function TroubleshootPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const filtered = ITEMS.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      it.title.toLowerCase().includes(q) ||
      (it.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
      it.steps.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/hospital-logo.png"
              alt="Hospital Logo"
              width={64}
              height={64}
              priority
              className="rounded-lg shadow-md"
            />
            <div>
              <h1 className="text-4xl font-extrabold text-gray-800">
                วิธีแก้ปัญหาเบื้องต้น
              </h1>
              <p className="text-gray-600 mt-2">
                ค้นหาปัญหาที่คุณพบเพื่อดูขั้นตอนการแก้ไขเบื้องต้น
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา เช่น อินเทอร์เน็ต, ปริ้นเตอร์, ช้า..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg overflow-hidden bg-white"
            >
              <button
                onClick={() => setActive(active === item.id ? null : item.id)}
                className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 flex-shrink-0">
                  {active === item.id ? "▼" : "▶"}
                </span>
              </button>

              {/* Expanded */}
              {active === item.id && (
                <div className="px-4 py-4 bg-slate-50 border-t border-slate-200">
                  <ol className="space-y-2 mb-4">
                    {item.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700">
                        <span className="flex-shrink-0 font-semibold text-slate-600 w-5">
                          {i + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-200">
                    <Link
                      href="/repair"
                      className="px-3 py-2 bg-slate-900 text-white rounded text-sm font-medium text-center hover:bg-slate-800 transition"
                    >
                      Report repair
                    </Link>
                    <a
                      href="tel:7671"
                      className="px-3 py-2 bg-slate-900 text-white rounded text-sm font-medium text-center hover:bg-slate-800 transition"
                    >
                      โทร 7671
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
              ไม่พบผลลัพธ์
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200 text-sm text-slate-700">
          <strong>หมายเหตุ:</strong> หากปัญหาไม่หาย กรุณา Report repair หรือโทร 7671 (08:00 - 16:00)
        </div>
      </div>
    </div>
  );
}
