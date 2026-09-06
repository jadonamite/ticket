import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center pt-32 pb-20 px-4 bg-[#f9f9f9]">
      <div className="max-w-md w-full text-center space-y-6 verseo-card p-10 bg-white shadow-sm">
        <div className="badge-pill px-3 py-1 bg-[#ededed] rounded-full mx-auto">
          <span>[</span>
          <span className="text-[#181818]">404 error</span>
          <span>]</span>
        </div>

        <h1 className="text-4xl font-extrabold text-[#181818] font-heading">
          Page Not Found
        </h1>

        <p className="text-sm text-[#686868]">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/" className="btn-primary w-full py-3">
          <ArrowLeft weight="bold" className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
