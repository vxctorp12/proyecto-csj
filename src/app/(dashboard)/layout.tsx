import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#090A08]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 0%, rgba(180, 240, 0, 0.08) 0%, rgba(9, 10, 8, 0) 50%)",
      }}
    >
      <Navbar userEmail={user.email} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-[#242821] py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#94998F]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema de Gestión y Bitácora de Mantenimiento de Multifuncionales — Contrato{" "}
            <strong className="font-mono text-[#B4F000]">27-</strong>
          </span>
          <span className="font-mono">Regla Preventiva: 45 días</span>
        </div>
      </footer>
    </div>
  );
}
