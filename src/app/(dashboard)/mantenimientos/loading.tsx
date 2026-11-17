import React from "react";

export default function MantenimientosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-44 bg-[#131512] rounded-full" />
        <div className="h-8 w-80 bg-[#131512] rounded-xl" />
        <div className="h-4 w-96 bg-[#131512] rounded-lg" />
      </div>
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-5 h-32" />
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 bg-[#1B1E19] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
