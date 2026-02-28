"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase";

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
  reject_reason?: string | null;
  handler_tag?: string | null;
  receipt_no?: string | null;
};

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
  status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  reject_reason?: string | null;
  handler_tag?: string | null;
  receipt_no?: string | null;
};

const STATUS_CONFIG = {
  pending: {
    label: "รอรับงานดำเนินการ",
    bg: "bg-yellow-100 text-yellow-800",
    icon: "⏳",
  },
  "in-progress": {
    label: "กำลังดำเนินการ",
    bg: "bg-amber-100 text-amber-800",
    icon: "🔧",
  },
  completed: {
    label: "เสร็จสิ้น",
    bg: "bg-emerald-100 text-emerald-800",
    icon: "✅",
  },
  rejected: {
    label: "ถูกปฏิเสธ",
    bg: "bg-rose-100 text-rose-800",
    icon: "❌",
  },
};

const fuzzyMatch = (str: string, pattern: string): boolean => {
  const sLower = str.toLowerCase();
  let patternIdx = 0;
  for (let i = 0; i < sLower.length && patternIdx < pattern.length; i++) {
    if (sLower[i] === pattern[patternIdx]) patternIdx++;
  }
  return patternIdx === pattern.length;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/ร\.พ\.น\.|ร.พ.น\.|rpnn|rpn/g, "");



export default function Page(): React.ReactElement {
  return <StatusPageContent />;
}

function StatusPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<RepairStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<RepairStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastReport");
      if (raw) {
        const parsed = JSON.parse(raw) as RepairStatus;
        if (parsed && parsed.jobId) {
          setResults((prev) => {
            if (prev.find((r) => r.jobId === parsed.jobId)) return prev;
            return [parsed, ...prev];
          });
        }
        // clear it so it doesn't reappear on subsequent refreshes
        sessionStorage.removeItem("lastReport");
      }
    } catch (e) {
      console.warn("Could not read lastReport from sessionStorage", e);
    }
  }, []);


  const filteredResults = React.useMemo(() => {
    let base = results;
    const qtrim = searchQuery.trim();
    if (qtrim) {
      const q = qtrim.toLowerCase();
      const qNorm = normalize(qtrim);
      const digitsOnlyQuery = qtrim.replace(/\D/g, "");

      base = results.filter((item) => {
        const deviceNorm = normalize(item.deviceId ?? "");
        if (deviceNorm.includes(qNorm) && qNorm !== "") return true;
        if (fuzzyMatch(item.deviceId ?? "", qNorm)) return true;

        if ((item.jobId ?? "").toLowerCase().includes(q)) return true;
        if (fuzzyMatch(item.jobId ?? "", q)) return true;

        if ((item.deviceId ?? "").toLowerCase().includes(q)) return true;
        if (fuzzyMatch(item.deviceId ?? "", q)) return true;

        if ((item.fullName ?? "").toLowerCase().includes(q)) return true;
        if (fuzzyMatch(item.fullName ?? "", q)) return true;

        if ((item.deptName ?? "").toLowerCase().includes(q)) return true;
        if (fuzzyMatch(item.deptName ?? "", q)) return true;

        if ((item.device ?? "").toLowerCase().includes(q)) return true;
        if (fuzzyMatch(item.device ?? "", q)) return true;

        if ((item.issue ?? "").toLowerCase().includes(q)) return true;
        if ((item.notes ?? "").toLowerCase().includes(q)) return true;

        if (digitsOnlyQuery && (item.deviceId ?? "").replace(/\D/g, "").includes(digitsOnlyQuery)) return true;

        return false;
      });
    }
    return base;
  }, [results, searchQuery]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("repair_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const transformed: RepairStatus[] = (data || []).map((item: DatabaseItem) => ({
          jobId: item.job_id,
          deviceId: item.device_id,
          fullName: item.full_name,
          deptName: item.dept_name,
          deptBuilding: item.dept_building,  
          deptFloor: item.dept_floor,
          phone: item.phone,
          device: item.device,
          issue: item.issue,
          status: (item.status || "pending") as RepairStatus["status"],
          createdAt: item.created_at
            ? new Date(item.created_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "",
          updatedAt: item.updated_at
            ? new Date(item.updated_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
            : "",
          notes: item.notes,
          reject_reason: item.reject_reason,
          handler_tag: item.handler_tag,
          receipt_no: item.receipt_no,
        }));

        setResults(transformed);
        setLastSync(new Date());
      } catch (err) {
        console.error("Error loading data:", err);
        setError("ไม่สามารถโหลดข้อมูลจาก Supabase ได้ กรุณาตรวจสอบคอนโซล");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mountedRef = React.useRef(true);

  const fetchReports = React.useCallback(async () => {
    try {
      try {
        console.log("🔄 Syncing webhook events...");
        await fetch("/api/sync-webhook-events");
      } catch (err) {
        console.error("⚠️ Failed to sync webhook events:", err);
      }

      setLoading(true);
      const res = await fetch("/api/reports");
      if (!res.ok) {
        const err = await res.text();
        console.error("Failed to fetch reports:", err);
        return;
      }
      const data = await res.json();

      const transformed: RepairStatus[] = (data || []).map((item: Partial<DatabaseItem> & Record<string, unknown>) => ({
        jobId: item.job_id,
        deviceId: item.device_id,
        fullName: item.full_name || item.name || item.fullName || "",
        deptName: item.dept_name,
        deptBuilding: item.dept_building,
        deptFloor: item.dept_floor,
        phone: item.phone,
        device: item.device,
        issue: item.issue,
        status: (item.status || "pending") as RepairStatus["status"],
        createdAt: item.created_at
          ? new Date(item.created_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
          : "",
        updatedAt: item.updated_at
          ? new Date(item.updated_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
          : "",
        notes: item.notes,
        reject_reason: item.reject_reason,
        handler_tag: item.handler_tag,
        receipt_no: item.receipt_no,
      }));

      if (!mountedRef.current) return;
      setLastSync(new Date());
      setResults(transformed);
    } catch (err) {
      console.error("fetchReports error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchReports();
    const id = setInterval(fetchReports, 60000); 
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchReports, searchQuery]);


  if (selectedDetail) {
    const statusConfig = STATUS_CONFIG[selectedDetail.status];
    return (
      <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/30 p-3 md:p-4 pt-20 md:pt-0 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 mb-4">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">ผู้แจ้ง</div>
                <div className="text-lg md:text-2xl font-semibold text-gray-800">{selectedDetail.fullName}</div>
                <div className="mt-2 text-xs md:text-sm text-gray-600">{selectedDetail.device} • {selectedDetail.deviceId}</div>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} border`}>{statusConfig.icon}</div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="text-gray-500 hover:text-gray-800 text-lg md:hidden"
                >
                  ปิด
                </button>
              </div>
            </div>

            <div className="text-xs md:text-sm text-gray-600 mb-4 space-y-1">
              <div className="flex flex-col md:flex-row md:gap-4">
                <div className="flex-1">
                  {selectedDetail.deptName && <div><span className="font-medium">แผนก:</span> {selectedDetail.deptName}</div>}
                  {selectedDetail.deptBuilding && <div><span className="font-medium">สถานที่:</span> {selectedDetail.deptBuilding} ชั้น {selectedDetail.deptFloor || "—"}</div>}
                  {selectedDetail.phone && <div><span className="font-medium">เบอร์:</span> {selectedDetail.phone}</div>}
                </div>
                <div className="flex-1">
                  {selectedDetail.handler_tag && <div className="text-emerald-700 font-medium">👤 ผู้รับงาน: {selectedDetail.handler_tag}</div>}
                  {selectedDetail.receipt_no && <div className="text-blue-700 font-medium">📄 เครื่องที่เสร็จสิ้น: {selectedDetail.receipt_no}</div>}
                  <div className="text-gray-400 text-xs mt-1">อัปเดต: {selectedDetail.updatedAt}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-4">
              <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 mb-2 font-medium">รายละเอียดอาการ</div>
                <div className="text-sm md:text-base text-gray-800 leading-relaxed mb-3">{selectedDetail.issue}</div>
                
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">อุปกรณ์:</span> {selectedDetail.device} ({selectedDetail.deviceId})
                  </div>
                  {selectedDetail.notes && (
                    <div className="p-2 md:p-3 bg-emerald-50 rounded-md border border-emerald-100">
                      <div className="text-xs text-emerald-700 font-medium">หมายเหตุ</div>
                      <div className="text-xs md:text-sm text-emerald-800 mt-1">{selectedDetail.notes}</div>
                    </div>
                  )}
                  {selectedDetail.status === "rejected" && selectedDetail.reject_reason && (
                    <div className="p-2 md:p-3 bg-red-50 rounded-md border border-red-100">
                      <div className="text-xs text-red-700 font-medium">เหตุผลการปฏิเสธ</div>
                      <div className="text-xs md:text-sm text-red-800 mt-1">{selectedDetail.reject_reason}</div>
                    </div>
                  )}
                  {selectedDetail.handler_tag && selectedDetail.status === "completed" && (
                    <div className="p-2 md:p-3 bg-blue-50 rounded-md border border-blue-100">
                      <div className="text-xs text-blue-700 font-medium">ผู้ดำเนินการ</div>
                      <div className="text-xs md:text-sm text-blue-800 mt-1">{selectedDetail.handler_tag}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 mb-2 font-medium">ความคืบหน้า</div>
                <div className="space-y-3 text-xs md:text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold text-xs md:text-sm flex-shrink-0">1</div>
                    <div>
                      <div className="font-semibold text-xs md:text-sm">แจ้งเข้าระบบ</div>
                      <div className="text-xs text-gray-500">{selectedDetail.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-xs md:text-sm flex-shrink-0">2</div>
                    <div>
                      <div className="font-semibold text-xs md:text-sm">
                        {selectedDetail.status === "in-progress" ? "กำลังดำเนินการ" : selectedDetail.status === "completed" ? "เสร็จสิ้น" : selectedDetail.status === "rejected" ? "ไม่รับงาน" : "รอรับงาน"}
                      </div>
                      <div className="text-xs text-gray-500">อัปเดต: {selectedDetail.updatedAt}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedDetail(null)}
                className="hidden md:block px-4 py-2 bg-gray-100 text-gray-800 rounded-md font-medium text-sm"
              >
                ปิด
              </button>
              <Link
                href="/repair"
                className="w-full px-4 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-sm md:text-base text-center"
              >
                แจ้งซ่อมใหม่
              </Link>
              <div className="text-xs text-gray-500 text-center mt-2">
                การยืนยันรับงานทำได้ผ่าน Admin dashboard เจ้าหน้าเท่านั้น — ติดต่อ IT Support: <a href="tel:7671" className="font-medium hover:underline">7671</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg bg-white border border-gray-200 flex-shrink-0 overflow-hidden">
              <Image
                src="/hospital-logo.png"
                alt="Logo"
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-extrabold text-gray-800">สถานะงาน</h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">ค้นหาด้วยเลข ร.พ.น. ชื่อผู้แจ้ง หรือ Job ID</p>
            </div>
          </div>
          
          <Link href="/repair" className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base font-semibold shadow-sm">
            + แจ้งซ่อมใหม่
          </Link>
        </div>

        {/* Status tabs + stats */}
        <section className="mb-6">
            </section>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = searchQuery.trim();
                  setError(q ? null : "กรุณาใส่เลข ร.พ.น. ชื่อผู้แจ้ง หรือ Job ID");
                  setSelectedDetail(null);
                  // results update automatically via memo
                }
              }}
              placeholder="ร.พ.น. ชื่อผู้แจ้ง หรือ Job ID..."
              className="w-full rounded-lg py-2 md:py-3 px-3 md:px-4 bg-white border border-gray-200 placeholder:text-gray-400 text-sm md:text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 transition shadow-sm"
              suppressHydrationWarning
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="ล้าง"
              >
                ✕
              </button>
            )}

            <button
              onClick={() => {
                const q = searchQuery.trim();
                setError(q ? null : "กรุณาใส่เลข ร.พ.น. ชื่อผู้แจ้ง หรือ Job ID");
                setSelectedDetail(null);
                // search is reactive via memoized filteredResults
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 md:px-4 py-1 md:py-2 rounded-md bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 transition"
              suppressHydrationWarning
            >
              ค้นหา
            </button>
          </div>

          {error && (
            <div className="mt-2 text-center text-xs md:text-sm text-rose-500">
              {error} <button onClick={fetchReports} className="underline ml-2">ลองใหม่</button>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
            <span className="flex items-center space-x-2">
              <span>{loading ? "กำลังโหลด..." : lastSync ? `อัปเดต: ${lastSync.toLocaleTimeString("th-TH")}` : ""}</span>
              <button
                onClick={fetchReports}
                className="text-gray-400 hover:text-gray-600"
                aria-label="รีเฟรช"
              >🔄</button>
            </span>
          </div>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-8">กำลังโหลด...</div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-3">
              {filteredResults.map((result) => {
                const statusCfg = STATUS_CONFIG[result.status];
                return (
                  <div
                    key={result.jobId}
                    onClick={() => setSelectedDetail(result)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelectedDetail(result); }}
                    className="w-full p-3 md:p-4 rounded-lg border border-gray-100 bg-white hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        <Image
                          src="/user-avatar1.png"
                          alt="Avatar"
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex flex-col min-w-0">
                            <div className="text-xs md:text-sm font-semibold text-gray-800 truncate">{result.jobId}</div>
                            <div className="text-xs text-gray-600 truncate">{result.fullName}</div>
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} border border-transparent flex-shrink-0`}>
                            {statusCfg.label}
                          </div>
                        </div>

                        <div className="mt-1 text-xs md:text-sm text-gray-700">
                          <span className="font-medium">{result.device}</span>
                          <span className="mx-1 text-gray-400">•</span>
                          <span>{result.deviceId}</span>
                        </div>

                        <div className="mt-1 text-xs text-gray-600 truncate">
                          {result.fullName && <span>{result.fullName}</span>}
                          {result.deptName && <span> — {result.deptName}</span>}
                        </div>

                        <div className="mt-1 text-xs text-gray-700 line-clamp-2">{result.issue}</div>

                        <div className="mt-1 text-xs text-gray-400">{result.updatedAt}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">📋</div>
              <div className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
                {results.length === 0 ? "ไม่พบข้อมูล" : "ไม่พบผลลัพธ์ที่ตรงกับการค้นหา"}
              </div>
              <div className="text-sm md:text-base text-gray-600 mb-4">
                {results.length === 0
                  ? "ยังไม่มีงานแจ้งซ่อม"
                  : "กรุณาลองคำค้นอื่นหรือเคลียร์ช่องค้นหา"}
              </div>
              <Link
                href="/repair"
                className="inline-block px-6 py-2 md:py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold text-sm md:text-base"
              >
                + แจ้งซ่อมใหม่
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
