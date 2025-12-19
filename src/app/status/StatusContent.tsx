"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import { PostgrestError } from "@supabase/supabase-js";

type DatabaseItem = {
  job_id: string;
  device_id: string;
  full_name: string;
  dept_name: string;
  dept_building?: string;
  dept_floor?: string;
  phone?: string;
  device: string;
  issue: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  created_at: string;
  updated_at: string;
  notes?: string;
};

type RepairStatus = {
  jobId: string;
  deviceId: string;
  fullName: string;
  deptName: string;
  deptBuilding?: string;  
  deptFloor?: string;    
  phone?: string;
  device: string;
  issue: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

const STATUS_CONFIG = {
  pending: {
    label: "รอรับงาน",
    bg: "bg-yellow-100 text-yellow-800",
    icon: "⏳",
  },
  "in-progress": {
    label: "ยืนยันรับงานแล้ว",
    bg: "bg-amber-100 text-amber-800",
    icon: "🔧",
  },
  completed: {
    label: "เสร็จสิ้น",
    bg: "bg-green-100 text-green-800",
    icon: "✅",
  },
  rejected: {
    label: "ปฏิเสธ",
    bg: "bg-red-100 text-red-800",
    icon: "❌",
  },
};

export default function StatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [repairStatus, setRepairStatus] = useState<RepairStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const jobIdParam = searchParams.get("jobId");

    if (!jobIdParam) {
      router.push("/");
      return;
    }

    const fetchRepairStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const { data, error: supabaseError } = await supabase
          .from("repairs")
          .select("*")
          .eq("job_id", jobIdParam)
          .single() as { data: DatabaseItem | null; error: PostgrestError | null };

        if (supabaseError) {
          if (supabaseError.code === "PGRST116") {
            setNotFound(true);
          } else {
            throw supabaseError;
          }
        } else if (data) {
          const convertedData: RepairStatus = {
            jobId: data.job_id,
            deviceId: data.device_id,
            fullName: data.full_name,
            deptName: data.dept_name,
            deptBuilding: data.dept_building,
            deptFloor: data.dept_floor,
            phone: data.phone,
            device: data.device,
            issue: data.issue,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            notes: data.notes,
          };
          setRepairStatus(convertedData);
        }
      } catch (err) {
        console.error("Error fetching repair status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch repair status"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRepairStatus();
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบการซ่อม Job ID นี้</p>
          <Link href="/">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              กลับหน้าหลัก
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!repairStatus) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[repairStatus.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <button className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2">
            ← กลับหน้าหลัก
          </button>
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{statusConfig.icon}</div>
            <h1 className="text-3xl font-bold mb-2">สถานะการซ่อม</h1>
            <div className={`inline-block ${statusConfig.bg} px-6 py-2 rounded-full text-lg font-semibold`}>
              {statusConfig.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-t border-b border-gray-200 py-6">
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                เลขที่ Job
              </label>
              <p className="text-xl font-semibold text-gray-800">
                {repairStatus.jobId}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                เลขที่ Device
              </label>
              <p className="text-xl font-semibold text-gray-800">
                {repairStatus.deviceId}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                ชื่อ
              </label>
              <p className="text-lg text-gray-800">{repairStatus.fullName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                เบอร์โทร
              </label>
              <p className="text-lg text-gray-800">
                {repairStatus.phone || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                แผนก
              </label>
              <p className="text-lg text-gray-800">{repairStatus.deptName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                อาคาร
              </label>
              <p className="text-lg text-gray-800">
                {repairStatus.deptBuilding || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                ชั้น
              </label>
              <p className="text-lg text-gray-800">
                {repairStatus.deptFloor || "-"}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                อุปกรณ์
              </label>
              <p className="text-lg text-gray-800">{repairStatus.device}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-500 uppercase tracking-wide">
              ปัญหา
            </label>
            <p className="text-gray-800 text-base leading-relaxed mt-2">
              {repairStatus.issue}
            </p>
          </div>

          {repairStatus.notes && (
            <div className="mb-6">
              <label className="text-sm text-gray-500 uppercase tracking-wide">
                หมายเหตุ
              </label>
              <p className="text-gray-800 text-base leading-relaxed mt-2">
                {repairStatus.notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 border-t pt-6">
            <div>
              <label className="text-xs uppercase tracking-wide">
                วันที่สร้าง
              </label>
              <p className="text-gray-800">
                {new Date(repairStatus.createdAt).toLocaleString("th-TH")}
              </p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide">
                อัปเดตล่าสุด
              </label>
              <p className="text-gray-800">
                {new Date(repairStatus.updatedAt).toLocaleString("th-TH")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
              ส่งการซ่อมใหม่
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
