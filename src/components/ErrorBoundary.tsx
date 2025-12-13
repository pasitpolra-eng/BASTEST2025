"use client";

import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
              <div className="text-red-600 text-4xl mb-3">⚠️</div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h1>
              <p className="text-gray-700 mb-4">
                {this.state.error?.message || "ไม่สามารถโหลดหน้านี้ได้"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                โหลดใหม่
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
