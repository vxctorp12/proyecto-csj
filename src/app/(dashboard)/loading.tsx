import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-[#131512] border border-[#242821] rounded-full" />
          <div className="h-8 w-80 bg-[#131512] rounded-xl" />
          <div className="h-4 w-64 bg-[#131512] rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-44 bg-[#131512] rounded-full" />
          <div className="h-10 w-36 bg-[#131512] rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#131512] border border-[#242821] rounded-2xl p-5 h-32 flex flex-col justify-between"
          >
            <div className="h-4 w-32 bg-[#1B1E19] rounded" />
            <div className="h-8 w-20 bg-[#1B1E19] rounded" />
            <div className="h-3 w-40 bg-[#1B1E19] rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#131512] border border-[#242821] rounded-2xl p-6 h-72" />
        <div className="bg-[#131512] border border-[#242821] rounded-2xl p-6 h-72 lg:col-span-2" />
      </div>
    </div>
  );
}
