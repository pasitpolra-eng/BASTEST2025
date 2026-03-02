"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Report {
  id: string;
  job_id: string;
  name: string;
  phone?: string;
  request_ip?: string;
  device?: string;
  device_id?: string;        
  issue: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  dept_name?: string;
  dept_building?: string;
  dept_floor?: string;
  handler_id?: string;
  handler_tag?: string;
  notes?: string;
  receipt_no?: string | null;
  reject_reason?: string | null;
  created_at: string;
  updated_at: string;
}

type ServerRow = {
  id?: string;
  job_id?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  request_ip?: string;
  device?: string;
  device_id?: string;
  issue?: string;
  status?: Report["status"];
  dept_name?: string;
  dept_building?: string;
  dept_floor?: string;
  handler_id?: string;
  handler_tag?: string;
  notes?: string;
  receipt_no?: string | null;
  reject_reason?: string | null;
  created_at?: string;
  updated_at?: string;
};

interface UpdateBody {
  jobId: string;
  status: Report["status"];
  receiptNo?: string;
  reason?: string;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });

const DetailItem: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
    {children ? children : <p className="text-xs text-slate-900 font-medium">{value}</p>}
  </div>
);

export default function AdminPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState<Report["status"] | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [completedReceiptNo, setCompletedReceiptNo] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [handlerName, setHandlerName] = useState("");
  const [completionSuccess, setCompletionSuccess] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const intervalRef = useRef<number | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/admin/login");
        }
        return [];
      }
      const data: Report[] = await res.json();
      setReports(data || []);
      setStats({
        total: data.length,
        pending: data.filter((r) => r.status === "pending").length,
        in_progress: data.filter((r) => r.status === "in-progress").length,
        completed: data.filter((r) => r.status === "completed").length,
        rejected: data.filter((r) => r.status === "rejected").length,
      });
      return data;
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      return [];
    }
  }, [router]);

  useEffect(() => {
    fetchReports();
    intervalRef.current = window.setInterval(() => {
      fetchReports();
    }, 5000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchReports]);

  useEffect(() => {
    setRejectedReason("");
    setCompletedReceiptNo("");
    setHandlerName("");
  }, [selectedReport]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.replace("/admin/login");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/export?format=csv&status=" + (activeTab === "all" ? "" : activeTab));
      if (!response.ok) {
        alert("ดาวน์โหลดล้มเหลว");
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `repair_reports_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด");
    }
  };

  const closeModal = () => {
    setSelectedReport(null);
    setCompletedReceiptNo("");
    setRejectedReason("");
    setHandlerName("");
  };

  const updateReportStatus = async (newStatus: Report["status"], metadata?: Record<string, string>) => {
    if (!selectedReport) return;
    setUpdateLoading(true);

    const body: UpdateBody = {
      jobId: selectedReport.job_id || selectedReport.id,
      status: newStatus,
      ...metadata,
    };

    try {
      const updatedReportData: Report = {
        ...selectedReport,
        status: newStatus,
        updated_at: new Date().toISOString(),
        receipt_no: metadata?.receiptNo ?? selectedReport.receipt_no,
        reject_reason: metadata?.reason ?? selectedReport.reject_reason,
      };
      setReports((prev) => {
        const jobKey = body.jobId;
        const updated = prev.map((r) => (r.job_id === jobKey || r.id === jobKey ? updatedReportData : r));
        setStats({
          total: updated.length,
          pending: updated.filter((r) => r.status === "pending").length,
          in_progress: updated.filter((r) => r.status === "in-progress").length,
          completed: updated.filter((r) => r.status === "completed").length,
          rejected: updated.filter((r) => r.status === "rejected").length,
        });
        return updated;
      });

      setSelectedReport(updatedReportData);

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        let bodyText = "";
        try {
          const json = await res.json();
          bodyText = json?.error || JSON.stringify(json);
        } catch {
          try {
            bodyText = await res.text();
          } catch {
            bodyText = "(no response body)";
          }
        }

        console.error("Update failed", res.status, bodyText);

        if (res.status === 401) {
          alert("เซสชันหมดอายุ กรุณาลงชื่อเข้าใช้อีกครั้ง");
          router.replace("/admin/login");
          return;
        }

        alert(`อัปเดตล้มเหลว (${res.status}): ${String(bodyText).slice(0, 240)}`);
        const fresh = await fetchReports();
        const refreshed = (fresh || []).find((rr) => rr.job_id === body.jobId || rr.id === body.jobId) as Report | undefined;
        if (refreshed) {
          setSelectedReport(refreshed);
        } else {
          setSelectedReport(null);
        }
      } else {
        const json = await res.json();
        // If server returned authoritative updated rows, map and apply them
        const updatedRows = (json && json.updated) || [];
        if (Array.isArray(updatedRows) && updatedRows.length > 0) {
              const row = updatedRows[0] as ServerRow;
          const mapped: Report = {
            id: row.id || selectedReport.id,
            job_id: row.job_id || selectedReport.job_id,
            name: row.full_name || row.name || selectedReport.name,
            phone: row.phone || selectedReport.phone,
            request_ip: row.request_ip || selectedReport.request_ip,
            // keep department and location fields
            dept_name: row.dept_name || selectedReport.dept_name,
            dept_building: row.dept_building || selectedReport.dept_building,
            dept_floor: row.dept_floor || selectedReport.dept_floor,
            // device info should also be preserved
            device: row.device || selectedReport.device,
            device_id: row.device_id || selectedReport.device_id,
            handler_id: row.handler_id || selectedReport.handler_id,
            handler_tag: row.handler_tag || selectedReport.handler_tag,
            notes: row.notes || selectedReport.notes,
            receipt_no: row.receipt_no ?? updatedReportData.receipt_no ?? null,
            reject_reason: row.reject_reason ?? updatedReportData.reject_reason ?? null,
            created_at: row.created_at || selectedReport.created_at,
            updated_at: row.updated_at || new Date().toISOString(),
            issue: row.issue || selectedReport.issue,
            status: newStatus,
          };

          setSelectedReport(mapped);
          setReports((prev) => prev.map((r) => (r.job_id === mapped.job_id || r.id === mapped.id ? mapped : r)));

          setCompletedReceiptNo(mapped.receipt_no ?? "");
          setRejectedReason(mapped.reject_reason ?? "");
        } else {
            if (newStatus === "completed") {
            setCompletionSuccess(updatedReportData);
            setTimeout(() => setCompletionSuccess(null), 5000);
          }
          setCompletedReceiptNo(updatedReportData.receipt_no ?? "");
          setRejectedReason(updatedReportData.reject_reason ?? "");
        }
      }

      await fetchReports();
      if (newStatus !== activeTab && activeTab !== "all") {
        setActiveTab(newStatus);
      }
    } catch (err) {
      console.error("Update error:", err);
      await fetchReports();
      alert("เกิดข้อผิดพลาด โปรดลองใหม่");
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteReport = async () => {
    if (!selectedReport) return;
    if (!window.confirm("คุณแน่ใจหรือว่าต้องการลบผู้แจ้งปัญหานี้")) return;
    setUpdateLoading(true);
    try {
      const deleteBody = { id: selectedReport.id };
      console.log("Sending delete request with:", deleteBody);

      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteBody),
        credentials: "include",
      });

      console.log("Delete response status:", res.status);

      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        console.error("Delete failed:", res.status, errText);
        alert(`ลบผู้แจ้งปัญหาล้มเหลว (${res.status}): ${errText.slice(0, 100)}`);
        return;
      }

      await fetchReports();
      closeModal();
      alert("ลบผู้แจ้งปัญหาเรียบร้อย");
    } catch (err) {
      console.error("Delete error:", err);
      alert("เกิดข้อผิดพลาดในการลบผู้แจ้งปัญหา");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusConfig = (status: Report["status"]) => {
    const map: Record<string, { badgeClass: string; label: string }> = {
      pending: { badgeClass: "bg-amber-100 text-amber-800", label: "รอรับงาน" },
      "in-progress": { badgeClass: "bg-slate-800 text-white", label: "กำลังดำเนินการ" },
      completed: { badgeClass: "bg-emerald-100 text-emerald-800", label: "เสร็จสิ้น" },
      rejected: { badgeClass: "bg-red-100 text-red-800", label: "ถูกปฏิเสธ" },
    };
    return map[status] || { badgeClass: "bg-gray-100 text-gray-800", label: status };
  };

  const tabs: Array<{ id: Report["status"] | "all"; label: string }> = [
    { id: "all", label: "ทั้งหมด" },
    { id: "pending", label: "รอรับงาน" },
    { id: "in-progress", label: "กำลังดำเนินการ" },
    { id: "completed", label: "เสร็จสิ้น" },
    { id: "rejected", label: "ถูกปฏิเสธ" },
  ];

  const filteredReports = reports
    .filter((r) => (activeTab === "all" ? true : r.status === activeTab))
    .filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.job_id?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.request_ip?.toLowerCase().includes(q) ||
        r.device?.toLowerCase().includes(q) ||
        r.device_id?.toLowerCase().includes(q) ||
        r.issue?.toLowerCase().includes(q) ||
        r.dept_name?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans antialiased text-base md:text-lg">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/hospital-logo.png"
              alt="Hospital Logo"
              width={48}
              height={48}
              className="rounded-md"
              priority
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold leading-tight">Admin dashboard</h1>
              <p className="text-base md:text-lg text-slate-500 leading-relaxed">จัดการคำขอซ่อมแซม</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              title="ดาวน์โหลด CSV"
            >
              บันทึกสถิติ CSV
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1 sm:px-4 sm:py-2 bg-white border border-slate-200 text-slate-700 rounded-md text-sm hover:bg-slate-50"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Completion Success Notification */}
        {completionSuccess && (
          <div className="mb-6 p-4 sm:p-6 bg-emerald-50 border border-emerald-200 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-900 mb-3">
                  ✅ งาน {completionSuccess.name} เสร็จเรียบร้อย
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-emerald-800 mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">ผู้แจ้ง</p>
                    <p className="font-medium">{completionSuccess.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">อุปกรณ์</p>
                    <p className="font-medium">{completionSuccess.device || "-"}</p>
                  </div>
                  {completionSuccess.receipt_no && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">เลขรับสิ่งของ</p>
                      <p className="font-medium">{completionSuccess.receipt_no}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">เวลา</p>
                    <p className="font-medium">{new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
                  </div>
                  {completionSuccess.handler_tag && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">ผู้รับงาน</p>
                      <p className="font-medium">{completionSuccess.handler_tag}</p>
                    </div>
                  )}
                </div>
                {/* LINE Notification Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 rounded-md">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-xs text-emerald-700 font-semibold">📱 ส่ง LINE notification แล้ว</span>
                </div>
              </div>
              <button
                onClick={() => setCompletionSuccess(null)}
                className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded hover:bg-emerald-300 text-sm font-medium self-start sm:self-auto"
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        <section className="mb-6">
          <div
            className="flex md:grid md:grid-cols-5 gap-3 md:gap-3 overflow-x-auto md:overflow-visible px-2 py-1 -mx-2 md:mx-0"
            aria-label="สถิติสรุป"
          >
            <div
              className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 flex flex-col items-start sm:items-center justify-center h-full space-y-1 min-w-[12rem] md:min-w-0"
              aria-label="สถิติทั้งหมด"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide md:text-center">ทั้งหมด</p>
              <p className="stats-number text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 leading-tight mt-1">
                {stats.total}
              </p>
            </div>

            <div
              className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 flex flex-col items-start sm:items-center justify-center h-full space-y-1 min-w-[12rem] md:min-w-0"
              aria-label="สถิติรอรับงาน"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide md:text-center">รอรับงาน</p>
              <p className="stats-number text-2xl sm:text-3xl md:text-4xl font-semibold text-amber-600 leading-tight mt-1">
                {stats.pending}
              </p>
            </div>

            <div
              className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 flex flex-col items-start sm:items-center justify-center h-full space-y-1 min-w-[12rem] md:min-w-0"
              aria-label="สถิติกำลังดำเนินการ"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide md:text-center">กำลังดำเนินการ</p>
              <p className="stats-number text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-800 leading-tight mt-1">
                {stats.in_progress}
              </p>
            </div>

            <div
              className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 flex flex-col items-start sm:items-center justify-center h-full space-y-1 min-w-[12rem] md:min-w-0"
              aria-label="สถิติเสร็จสิ้น"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide md:text-center">เสร็จสิ้น</p>
              <p className="stats-number text-2xl sm:text-3xl md:text-4xl font-semibold text-emerald-600 leading-tight mt-1">
                {stats.completed}
              </p>
            </div>

            <div
              className="bg-white rounded-lg border border-slate-200 p-4 sm:p-5 flex flex-col items-start sm:items-center justify-center h-full space-y-1 min-w-[12rem] md:min-w-0"
              aria-label="สถิติติดปฏิเสธ"
            >
              <p className="text-xs text-slate-500 uppercase tracking-wide md:text-center">ถูกปฏิเสธ</p>
              <p className="stats-number text-2xl sm:text-3xl md:text-4xl font-semibold text-red-600 leading-tight mt-1">
                {stats.rejected}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
            <div className="flex items-center space-x-3">
              <label className="text-base text-slate-600 whitespace-nowrap">ตัวกรอง:</label>
              <div className="flex items-center space-x-2">
                {tabs.map((t) => (
                  <button
                    key={String(t.id)}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md ${activeTab === t.id ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-700"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="ค้นหา: ชื่อ, เบอร์โทร, แผนก, ปัญหา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="text-sm sm:text-base text-slate-500 whitespace-nowrap">Auto refresh system</div>
        </section>

        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          {/* Desktop table (shown on md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-fixed text-base md:text-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">ชื่อ</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">แผนก</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">อาคาร / ชั้น</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">เบอร์โทร</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">IP Address</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">ปัญหา</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">สถานะ</th>
                  <th className="px-3 py-4 text-left text-sm text-slate-500 uppercase tracking-wider w-1/8">วันที่เดือนปี</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const cfg = getStatusConfig(r.status);
                  return (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-100 hover:bg-slate-200 cursor-pointer" onClick={() => setSelectedReport(r)}>
                      <td className="px-3 py-3 align-top align-middle">
                        <div className="font-medium text-slate-900 whitespace-nowrap">{r.name}</div>
                      </td>
                      <td className="px-3 py-3 align-top align-middle text-xs text-slate-900">
                        {r.dept_name}
                      </td>
                      <td className="px-3 py-3 align-top align-middle text-sm text-slate-700">
                        <div>{r.dept_building || "-"}</div>
                        <div className="text-xs text-slate-500">ชั้น {r.dept_floor || "-"}</div>
                      </td>
                      <td className="px-3 py-3 align-top align-middle text-slate-900">
                        <span className="text-slate-900">{r.phone}</span>
                      </td>
                      <td className="px-3 py-3 align-top align-middle text-sm text-slate-700 font-mono">{r.request_ip || "-"}</td>
                      <td className="px-3 py-3 align-top align-middle text-sm text-slate-700">{r.issue}</td>
                      <td className="px-3 py-3 align-top align-middle">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${cfg.badgeClass}`}>{cfg.label}</span>
                      </td>
                      <td className="px-3 py-3 align-top align-middle text-sm text-slate-500">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      ไม่พบผู้แจ้งปัญหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile list (shown on small screens) */}
          <div className="md:hidden p-4 space-y-3">
            {filteredReports.length > 0 ? (
              filteredReports.map((r) => {
                const cfg = getStatusConfig(r.status);
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className="w-full text-left bg-white even:bg-slate-100 border border-slate-200 rounded-lg p-3 shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 whitespace-nowrap">{r.name}</div>
                      <div className="text-xs text-slate-900 truncate">{r.dept_name}</div>
                      <div className="text-xs text-slate-600 mt-1">{r.dept_building || "-"} ชั้น {r.dept_floor || "-"}</div>
                      <div className="text-xs text-slate-900 mt-1">โทร: {r.phone || "-"}</div>
                      <div className="text-xs text-slate-500 mt-1">IP Address: <span className="font-mono text-slate-700">{r.request_ip || "-"}</span></div>
                      <div className="text-sm text-slate-700 mt-2 line-clamp-2">{r.issue}</div>
                    </div>

                    <div className="flex-shrink-0 text-right ml-3">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${cfg.badgeClass}`}>{cfg.label}</div>
                      <div className="text-xs text-slate-500 mt-2">{formatDate(r.created_at)}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-6 text-slate-500">ไม่พบผู้แจ้งปัญหา</div>
            )}
          </div>
        </section>

        {/* Modal */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-6">
            <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
            <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-white rounded-lg shadow-lg p-3 md:p-4 z-10">
              <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 font-semibold">ผู้แจ้งปัญหา</p>
                  <h2 className="text-lg font-bold text-slate-900">{selectedReport.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(selectedReport.created_at)}</p>
                </div>
                <div>
                  <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-800 flex-shrink-0">
                    ❌
                  </button>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <DetailItem label="เบอร์โทรศัพท์">{selectedReport.phone}</DetailItem>
                <DetailItem label="IP Address">{selectedReport.request_ip || "-"}</DetailItem>
                <DetailItem label="แผนก">{selectedReport.dept_name}</DetailItem>
                <DetailItem label="อาคาร">{selectedReport.dept_building || "-"}</DetailItem>
                <DetailItem label="ชั้น">{selectedReport.dept_floor || "-"}</DetailItem>
                <DetailItem label="ชนิดอุปกรณ์">{selectedReport.device}</DetailItem>
                <DetailItem label="หมายเลขเครื่อง (ร.พ.น.)">{selectedReport.device_id || "-"}</DetailItem>
                <DetailItem label="ปัญหา / อาการ">{selectedReport.issue}</DetailItem>
                <DetailItem label="หมายเหตุ">{selectedReport.notes || "-"}</DetailItem>
                <DetailItem label="เลขเครื่องที่เสร็จ">{selectedReport.receipt_no || "-"}</DetailItem>
                <DetailItem label="เหตุผลการปฏิเสธ">{selectedReport.reject_reason || "-"}</DetailItem>
                <DetailItem label="ผู้รับงาน">{selectedReport.handler_tag || "-"}</DetailItem>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">หมายเลขเครื่อง (เพื่อทำเครื่องหมายว่าเสร็จสิ้น)</label>
                  <input
                    value={completedReceiptNo}
                    onChange={(e) => setCompletedReceiptNo(e.target.value)}
                    placeholder="กรอกหมายเลขเครื่องที่เสร็จ (ไม่บังคับ)"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">เหตุผลการปฏิเสธ (เพื่อทำเครื่องหมายว่าปฏิเสธ)</label>
                  <input
                    value={rejectedReason}
                    onChange={(e) => setRejectedReason(e.target.value)}
                    placeholder="ป้อนเหตุผลการปฏิเสธ"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">ชื่อผู้รับงาน</label>
                  <input
                    value={handlerName}
                    onChange={(e) => setHandlerName(e.target.value)}
                    placeholder="กรอกชื่อผู้รับงาน"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={updateLoading || selectedReport.status === "in-progress" || !handlerName.trim()}
                    onClick={() => updateReportStatus("in-progress", { handlerName })}
                    className="flex-1 px-2 py-1.5 bg-slate-900 text-white text-xs font-medium rounded disabled:opacity-50 hover:bg-slate-800"
                  >
                    รับงาน
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || selectedReport.status === "completed" || selectedReport.status !== "in-progress"}
                    onClick={() => updateReportStatus("completed", { receiptNo: completedReceiptNo })}
                    className="flex-1 px-2 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded disabled:opacity-50 hover:bg-emerald-700"
                  >
                    เสร็จสิ้น
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading || selectedReport.status === "rejected" || !rejectedReason.trim()}
                    onClick={() => updateReportStatus("rejected", { reason: rejectedReason })}
                    className="flex-1 px-2 py-1.5 bg-red-600 text-white text-xs font-medium rounded disabled:opacity-50 hover:bg-red-700"
                  >
                    ปฏิเสธ
                  </button>

                  <button
                    type="button"
                    disabled={updateLoading}
                    onClick={deleteReport}
                    className="flex-1 px-2 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded hover:bg-slate-200"
                  >
                    ลบ
                  </button>
                </div>

                <div className="text-xs text-slate-500 pt-1">สถานะ: <span className="font-medium">{getStatusConfig(selectedReport.status).label}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}