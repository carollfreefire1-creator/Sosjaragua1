"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function NotificationToggle() {
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Notificações bloqueadas. Habilite nas configurações do navegador para receber avisos.
      </p>
    );
  }

  return (
    <button
      onClick={() => (subscribed ? unsubscribe() : subscribe())}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span>{subscribed ? "🔔" : "🔕"}</span>
      {loading ? "Processando..." : subscribed ? "Notificações ativadas" : "Ativar notificações"}
    </button>
  );
}
