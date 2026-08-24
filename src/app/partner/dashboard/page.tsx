"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const PartnerDashboardComp = lazy(() =>
  import("@/components/PartnerDashboard").then((m) => ({
    default: m.PartnerDashboard
  })) as Promise<{ default: React.ComponentType<any> }>
);

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { theme } = useApp();
  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    const session = localStorage.getItem("clats_partner_session");
    if (!session) {
      router.push("/partner/login");
      return;
    }
    setPartner(JSON.parse(session));
  }, [router]);

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2EC4B6] font-bold">
        Loading Portal...
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[#2EC4B6] font-bold">
          Loading Portal...
        </div>
      }
    >
      <PartnerDashboardComp 
        partner={partner} 
        onUpdate={(updatedPartner: any) => {
          setPartner(updatedPartner);
          localStorage.setItem("clats_partner_session", JSON.stringify(updatedPartner));
        }}
        onLogout={() => {
          localStorage.removeItem("clats_partner_session");
          router.push("/partner/login");
        }} 
        theme={theme} 
      />
    </Suspense>
  );
}
