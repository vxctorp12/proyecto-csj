import React from "react";

export default function EquipoDetalleLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-48 bg-[#131512] rounded-lg" />
      <div className="bg-[#131512] border border-[#242821] rounded-2xl p-6 h-64" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#131512] border border-[#242821] rounded-2xl h-96" />
        <div className="lg:col-span-7 bg-[#131512] border border-[#242821] rounded-2xl h-96" />
      </div>
    </div>
  );
}
