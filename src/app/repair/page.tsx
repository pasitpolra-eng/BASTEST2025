"use client";

import Link from "next/link";
import RepairForm from "@/components/RepairForm";
import Image from "next/image";

import { useState, useEffect } from "react";

// gather local IP addresses via WebRTC; returns list of candidate IPs
async function getLocalIPs(): Promise<string[]> {
  const ips = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pc = new RTCPeerConnection({ iceServers: [] } as any);
  // create bogus data channel to prompt ICE gathering
  pc.createDataChannel("");
  return new Promise((resolve, reject) => {
    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        pc.close();
        resolve(Array.from(ips));
        return;
      }
      const ipRegex = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/;
      const m = ipRegex.exec(e.candidate.candidate);
      if (m) ips.add(m[1]);
    };
    pc.createOffer()
      .then((sdp) => pc.setLocalDescription(sdp))
      .catch(reject);
  });
}

export default function RepairPage() {
  const [detectedIp, setDetectedIp] = useState<string | null>(null);

  useEffect(() => {
    getLocalIPs()
      .then((ips) => {
        const privateIp = ips.find((ip) =>
          ip.startsWith("10.") ||
          ip.startsWith("192.168") ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
        );
        if (privateIp) {
          setDetectedIp(privateIp);
        } else {
          // no private address available; leave detectedIp null so we don't show anything
          console.warn("no private IP found, public addresses will be ignored");
        }
      })
      .catch((e) => {
        console.error("local IP detection failed", e);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb + small header */}
        {detectedIp && (
          <div className="mb-4 text-xs text-gray-500">
            ตรวจพบ IP: <span className="font-mono">{detectedIp}</span>
          </div>
        )}
        <div className="mb-6 flex items-center gap-3 text-sm text-gray-600">
          <Link href="/" className="hover:underline text-purple-700">หน้าแรก</Link>
          <span>›</span>
          <span className="font-medium text-gray-800">แจ้งซ่อม</span>
        </div>

        {/* Hero */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
               แจ้งซ่อมอุปกรณ์ IT
            </h1>
            <p className="text-gray-600 max-w-2xl">
              กรอกข้อมูลอุปกรณ์และอาการที่พบ ทีมช่างจะได้รับแจ้งทันทีผ่านช่องทางภายใน
              โปรดระบุหมายเลขเครื่อง (ร.พ.น.) และเบอร์ติดต่อให้ชัดเจนเพื่อการติดตามงานที่รวดเร็ว
            </p>

            <div className="mt-4 flex gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 rounded-full shadow-sm text-sm text-gray-700">
                <span className="text-yellow-600">⏳</span> เวลาตอบกลับโดยประมาณ: <strong className="ml-2">ภายใน 1–3 ชั่วโมง</strong>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 rounded-full shadow-sm text-sm text-gray-700">
                <span className="text-emerald-600">✅</span> แจ้งแล้วได้รับ Job ID เพื่อใช้ติดตาม
              </div>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:justify-end">
            <div className="w-36 h-36 relative rounded-xl overflow-hidden bg-white/80 shadow-md border border-white/50 flex items-center justify-center">
              <Image src="/hospital-logo.png" alt="Hospital" fill sizes="144px" className="object-contain p-3" />
            </div>
          </div>
        </div>

        {/* Main content: left info, right form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: info & contact */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white/80 p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">ขั้นตอนการแจ้งซ่อม</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>กรอกข้อมูลผู้แจ้ง และหมายเลขเครื่อง (ร.พ.น.)</li>
                  <li>ระบุอาการให้ชัดเจน (ถ่ายรูปเก็บไว้ถ้าจำเป็น)</li>
                  <li>รอรับ Job ID เพื่อใช้ติดตามสถานะ</li>
                </ol>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-purple-700 mb-2">ติดต่อฉุกเฉิน</h4>
                <div className="text-gray-700">
                  <div className="text-sm">IT Support: <strong>7671</strong></div>
                  <div className="text-xs text-gray-500 mt-1">บอก Job ID เมื่อโทรหาเพื่อความรวดเร็ว</div>
                </div>
              </div>

              <div className="bg-white/90 p-5 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">คำแนะนำเล็กน้อย</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>ถ้าเป็นปริ้นเตอร์ ระบุข้อความผิดพลาดหรือไฟสถานะที่เห็น</li>
                  <li>สำหรับปัญหาเน็ตเวิร์ก ระบุที่ตั้งและหมายเลขเครื่องอย่างชัดเจน</li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Right panel: form */}
          <main className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800">ส่งแบบฟอร์มแจ้งซ่อม</h2>
                <p className="text-sm text-gray-600">กรอกข้อมูลด้านล่างแล้วกดส่ง ทีมงานจะติดต่อกลับโดยเร็ว</p>
              </div>

              <RepairForm />
            </div>
          </main>
        </div>

        {/* Footer spacing */}
        <div className="mt-12 text-center text-sm text-gray-500">© โรงพยาบาลนพรัตน์ราชธานี · IT Support</div>
      </div>
    </div>
  );
}