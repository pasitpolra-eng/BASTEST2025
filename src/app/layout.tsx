import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Support – โรงพยาบาลนพรัตน์ราชธานี",
  description:
    "ระบบแจ้งซ่อมและติดต่อ IT Support สำหรับบุคลากร โรงพยาบาลนพรัตน์ราชธานี",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className={`${geist.className} ${geistMono.className} bg-gray-50 text-gray-800`}
      >
        {/* Desktop header (hidden on small screens) */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            {/* Logo + โรงพยาบาลชื่อ */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Image
                src="/hospital-logo.png"
                alt="Hospital Logo"
                width={40}
                height={40}
                className="rounded flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm sm:text-lg font-semibold text-blue-700 truncate">
                  โรงพยาบาลนพรัตน์ราชธานี
                </span>
                <span className="text-xs text-gray-600 truncate">
                  IT Support & Repair
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
              <Link href="/repair" className="text-purple-700 hover:text-purple-900 whitespace-nowrap">
                Reportrepair
              </Link>
              <Link href="/status" className="text-purple-700 hover:text-purple-900 whitespace-nowrap">
                Checkstatus
              </Link>
              <Link href="/troubleshoot" className="text-purple-700 hover:text-purple-900 whitespace-nowrap">
                Basicproblem
              </Link>
              <Link href="/admin/login" className="text-purple-700 hover:text-purple-900 whitespace-nowrap">
                Admin
              </Link>
            </nav>

            {/* Contact button */}
            <a
              href="tel:7671"
              className="ml-2 sm:ml-3 px-2 sm:px-3 py-1.5 rounded bg-green-600 text-white text-xs sm:text-sm hover:bg-green-700 flex items-center gap-1 flex-shrink-0"
              aria-label="โทรหา IT Support 7671"
            >
              📞 <span className="hidden sm:inline">7671</span>
            </a>

            {/* Mobile menu button */}
            <div className="lg:hidden ml-2">
              <details className="relative">
                <summary className="list-none cursor-pointer p-2 rounded-md hover:bg-gray-100">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </summary>

                <div className="absolute right-0 top-full z-40 bg-white border-b shadow p-3 flex flex-col gap-3 w-56 rounded-lg mt-1">
                  <Link
                    href="/repair"
                    className="block text-center px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium shadow text-sm"
                  >
                    ➕ แจ้งปัญหาใหม่
                  </Link>

                  <Link
                    href="/status"
                    className="block text-center px-4 py-2.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm"
                  >
                    📋 ตรวจสถานะ
                  </Link>

                  <nav className="flex flex-col gap-2 text-sm border-t pt-2">
                    <Link
                      href="/troubleshoot"
                      className="text-blue-700 hover:text-blue-900 py-1"
                    >
                      ปัญหาเบื้องต้น
                    </Link>
                    <Link
                      href="/admin/login"
                      className="text-blue-700 hover:text-blue-900 py-1"
                    >
                      Admin
                    </Link>
                  </nav>

                  <a
                    href="tel:7671"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 justify-center"
                  >
                    📞 โทรหา 7671
                  </a>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">{children}</main>

        {/* Phone icon button — fixed on mobile */}
        <a
          href="tel:7671"
          className="md:hidden fixed bottom-4 right-4 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-95 transition"
          aria-label="โทรหา IT Support 7671"
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 5a2 2 0 012-2h2.1c.524 0 1.045.168 1.468.483l1.9 1.3a2 2 0 01.8 2.6L9 12a11 11 0 005 5l3.318-1.591a2 2 0 012.6.8l1.3 1.9c.315.423.483.944.483 1.468V19a2 2 0 01-2 2h-1C6.477 21 3 17.523 3 13V5z"
            />
          </svg>
        </a>

        <footer className="bg-white border-t border-gray-100 mt-8">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-1 text-center">
            <div>
              <h2 className="text-[13px] sm:text-sm font-semibold text-blue-700 leading-tight">
                โรงพยาบาลนพรัตน์ราชธานี
              </h2>
            </div>

            <div className="text-[11px] text-gray-600/90 space-y-0.5 leading-snug">
              <div>วันธรรมดา 08:00 - 16:00</div>
              <div>IT Support: ติดต่อ 7671</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
