import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contato@sosservicos.com.br";

  if (!publicKey || !privateKey) {
    console.warn(
      "[push] VAPID keys ausentes. Rode `npm run vapid:generate` e configure as variáveis de ambiente."
    );
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/** Envia uma notificação push para todas as inscrições de um usuário */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: any) {
        failed++;
        // 404/410 = inscrição expirada ou revogada pelo navegador
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("[push] erro ao enviar:", err?.message ?? err);
        }
      }
    })
  );

  await prisma.notification.create({
    data: {
      userId,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      sentAt: sent > 0 ? new Date() : null,
    },
  });

  return { sent, failed };
}

/** Envia para múltiplos usuários de uma vez (ex: campanha, anúncio de novidade) */
export async function broadcastPush(userIds: string[], payload: PushPayload) {
  const results = await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
  return {
    sent: results.reduce((acc, r) => acc + r.sent, 0),
    failed: results.reduce((acc, r) => acc + r.failed, 0),
  };
}
