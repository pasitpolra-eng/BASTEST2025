"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LoginErrorResponse {
  error?: string;
}

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDebugInfo("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter username and password");
      return;
    }

    const payload = { username: trimmedUsername, password: trimmedPassword };
    console.log("[CLIENT] Sending payload:", JSON.stringify(payload));
    setDebugInfo(`Sending: ${JSON.stringify(payload)}`);

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const statusCode = res.status;
      const responseText = await res.text();

      console.log("[CLIENT] Response status:", statusCode);
      console.log("[CLIENT] Response body:", responseText);

      setDebugInfo(`Status: ${statusCode}, Body: ${responseText}`);

      if (!res.ok) {
        let data: LoginErrorResponse = {};
        try {
          data = JSON.parse(responseText);
        } catch {
          setError(`Login failed: (Code ${statusCode})`);
          setLoading(false);
          return;
        }

        setError(data?.error || "Login failed");
        setLoading(false);
        return;
      }

      if (res.status === 401) {
        router.replace("/admin/login");
      } else {
        console.log("[CLIENT] Login success! Redirecting to /admin?allow=1...");
        // Force one-time access by adding allow=1
        router.replace("/admin?allow=1");
      }
    } catch (err) {
      console.error("[CLIENT] Fetch error:", err);
      setError("Network error: " + String(err));
      setDebugInfo("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Admin Access
          </h1>
          <p className="text-gray-500 text-sm">ระบบนี้มีไว้เฉพาะเจ้าหน้าที่เกี่ยวข้องเท่านั้น</p>
        </div>

        <main className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 md:p-8">
          <div className="bg-white rounded-2xl shadow p-6 md:p-8 border border-gray-100">
            <form onSubmit={submit} className="space-y-6" suppressHydrationWarning>

              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {debugInfo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-700 text-xs font-mono break-words">{debugInfo}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition transform hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Sign In"}
              </button>
            </form>
          </div>
        </main>

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition">
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
