"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  fullName: string;
  deptName: string;
  deptBuilding: string;
  deptFloor: string;
  device: string;
  deviceOther: string;
  deviceId: string;
  issue: string;
  phone: string;
  notes: string; 
};

export default function RepairForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    deptName: "",
    deptBuilding: "",
    deptFloor: "",
    device: "",
    deviceOther: "",
    deviceId: "",
    issue: "",
    phone: "",
    notes: "", 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("กรุณากรอกชื่อผู้แจ้ง");
      return false;
    }
    if (!formData.device.trim()) {
      setError("กรุณาเลือกชนิดอุปกรณ์");
      return false;
    }
    if (formData.device === "อื่นๆ" && !formData.deviceOther.trim()) {
      setError("กรุณาระบุชนิดอุปกรณ์ (เมื่อเลือก 'อื่นๆ')");
      return false;
    }
    if (!formData.deviceId.trim()) {
      setError("กรุณากรอกหมายเลขเครื่อง");
      return false;
    }
    if (!formData.issue.trim()) {
      setError("กรุณากรอกรายละเอียดอาการ");
      return false;
    }
    return true;
  };

  const submitToSupabase = async (data: FormData): Promise<{ ok: boolean; jobId?: string; error?: string }> => {
    try {
      // If user selected "อื่นๆ", prefer the provided free-text
      const payload = {
        ...data,
        device: data.device === "อื่นๆ" && data.deviceOther.trim() ? data.deviceOther.trim() : data.device,
        phone: data.phone || "", // Ensure phone is always a string
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
      }

      return {
        ok: true,
        jobId: result.jobId,
      };
    } catch (err) {
      console.error("Submit error:", err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await submitToSupabase(formData);

      if (result.ok) {
        setSuccess(true);
        setJobId(result.jobId || null);

        // Store in sessionStorage for status page
        const savedDevice = formData.device === "อื่นๆ" && formData.deviceOther.trim() ? formData.deviceOther.trim() : formData.device;
        sessionStorage.setItem(
          "lastReport",
          JSON.stringify({
            jobId: result.jobId,
            ...formData,
            device: savedDevice,
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        );

        // Keep a copy of deviceId for redirect before clearing form
        const redirectDeviceId = formData.deviceId;

        // Reset form
        setFormData({
          fullName: "",
          deptName: "",
          deptBuilding: "",
          deptFloor: "",
          device: "",
          deviceOther: "",
          deviceId: "",
          issue: "",
          phone: "",
          notes: "",
        });

        setTimeout(() => {
          router.push(`/status?deviceId=${encodeURIComponent(redirectDeviceId)}`);
        }, 2000);
      } else {
        setError(result.error || "ไม่สามารถส่งข้อมูลได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">แจ้งซ่อม</h1>
          <p className="text-gray-600 mt-2">กรุณากรอกข้อมูลอุปกรณ์ที่ต้องการซ่อม</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-700 font-semibold">❌ {error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-sm text-emerald-700 font-semibold">แจ้งซ่อมเรียบร้อย</div>
            <div className="text-sm text-emerald-600 mt-1">Job ID: {jobId}</div>
            <div className="text-sm text-emerald-600 mt-1">กำลังนำทางไปหน้าสถานะ...</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* ผู้แจ้ง */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อผู้แจ้ง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="เช่น สมชาย สมหวัง"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              disabled={loading}
            />
          </div>

          {/* แผนก */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              แผนก <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="deptName"
              value={formData.deptName}
              onChange={handleChange}
              placeholder="เช่น ห้องบันทึกทางการแพทย์"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              disabled={loading}
            />
          </div>

          {/* สถานที่ - แถวเดียว */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                อาคาร <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deptBuilding"
                value={formData.deptBuilding}
                onChange={handleChange}
                placeholder="เช่น อาคาร A"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ชั้น <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deptFloor"
                value={formData.deptFloor}
                onChange={handleChange}
                placeholder="เช่น 2"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* อุปกรณ์ */}
          <div>
            <label htmlFor="device" className="block text-sm font-semibold text-gray-700 mb-2">
              ชนิดอุปกรณ์ *เลือก
            </label>
            <select
              id="device"
              name="device"
              value={formData.device}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              disabled={loading}
              aria-required="true"
              required
            >
              <option value="">-- เลือกชนิดอุปกรณ์ --</option>
              <option value="คอมพิวเตอร์">คอมพิวเตอร์</option>
              <option value="ปริ๊นเตอร์">ปริ๊นเตอร์</option>
              <option value="เครื่องสแกน">เครื่องสแกน</option>
              <option value="เน็ตเวิร์ก">เน็ตเวิร์ก</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          {/* ระบุชนิดอุปกรณ์เมื่อเลือกอื่นๆ */}
          {formData.device === "อื่นๆ" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ระบุชนิดอุปกรณ์ที่ต้องการแจ้ง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deviceOther"
                value={formData.deviceOther}
                onChange={handleChange}
                placeholder="ระบุชนิดอุปกรณ์ เช่น เครื่องวัดความดัน, เครื่องฉายแสง ฯลฯ"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
                disabled={loading}
              />
            </div>
          )}

          {/* หมายเลขเครื่อง */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              หมายเลขเครื่อง (ร.พ.น.) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              placeholder="เช่น 1001-001"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              disabled={loading}
            />
          </div>

          {/* อาการ / รายละเอียด */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              อาการ / รายละเอียด <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              placeholder="อธิบายปัญหาที่เกิดขึ้น..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition resize-none"
              disabled={loading}
            />
          </div>

          {/* เบอร์ติดต่อ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              เบอร์ติดต่อ
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="เช่น 7671 หรือ 02-123-4567"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">ใช้ตัวเลขอย่างเดียว 4 หลัก หรือข้ามได้</p>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="เช่น ขออนุญาตปิดเครื่องแล้วเปิดใหม่ หรือข้อมูลเพิ่มเติมอื่นๆ"
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition resize-none"
              disabled={loading}
            />
          </div>

          {/* ปุ่ม Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "⏳ กำลังส่ง..." : "ส่งแจ้งซ่อม"}
            </button>
            <button
              type="reset"
              onClick={() => setFormData({ fullName: "", deptName: "", deptBuilding: "", deptFloor: "", device: "", deviceOther: "", deviceId: "", issue: "", phone: "", notes: "" })}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              ล้าง
            </button>
          </div>
        </form>

        {/* ข้อมูลติดต่อ */}
        <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-sm text-blue-700">
            <div className="font-semibold mb-2">ต้องการความช่วยเหลือ?</div>
            <div>ติดต่อ IT Support: <span className="font-bold">7671</span></div>
            <div className="text-xs text-blue-600 mt-1">ให้บอก Job ID ของคุณเมื่อติดต่อ</div>
          </div>
        </div>
      </div>
    </div>
  );
}