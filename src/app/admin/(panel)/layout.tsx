import { Suspense } from "react";
import { Sidebar, SidebarSkeleton } from "@/components/admin/Sidebar";
import { getCurrentUser } from "@/lib/server/auth";
import { countPendingWebOrders } from "@/lib/server/orders";

/** Panel admin selalu dinamis (butuh sesi & data terbaru) — navigasi boleh menunggu server. */
export const instant = false;

/** Sidebar membaca sesi → dibungkus Suspense agar konten halaman tidak ikut tertahan. */
async function SidebarWithUser() {
  const user = await getCurrentUser();
  const pendingWeb = user ? await countPendingWebOrders().catch(() => 0) : 0;
  return <Sidebar user={user ? { name: user.name, username: user.username, role: user.role } : null} pendingWeb={pendingWeb} />;
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarWithUser />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">{children}</main>
    </div>
  );
}
