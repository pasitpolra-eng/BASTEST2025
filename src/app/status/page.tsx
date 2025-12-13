import { Suspense } from "react";
import StatusContent from "./StatusContent";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StatusContent />
    </Suspense>
  );
}
