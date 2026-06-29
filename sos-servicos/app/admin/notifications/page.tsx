import { requireAdmin } from "@/lib/admin/auth";
import AdminTopbar from "@/components/admin/AdminTopbar";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const admin = await requireAdmin();
  return (
    <>
      <AdminTopbar title="Notificações" admin={admin} />
      <main style={{ padding: 24, maxWidth: 560 }}>
        <NotificationsClient />
      </main>
    </>
  );
}
