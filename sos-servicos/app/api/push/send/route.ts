import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { broadcastPush } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/logs";

const sendSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(180),
  url: z.string().optional(),
  audience: z.enum(["all_users", "all_professionals", "specific"]).default("all_users"),
  userIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  let userIds: string[] = [];
  if (parsed.data.audience === "specific") {
    userIds = parsed.data.userIds ?? [];
  } else if (parsed.data.audience === "all_professionals") {
    const pros = await prisma.user.findMany({
      where: { professional: { isNot: null } },
      select: { id: true },
    });
    userIds = pros.map((p) => p.id);
  } else {
    const all = await prisma.user.findMany({ where: { blocked: false }, select: { id: true } });
    userIds = all.map((u) => u.id);
  }

  const result = await broadcastPush(userIds, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url,
  });

  await logAdminAction({
    adminId: admin.id,
    action: "send_push_campaign",
    targetType: "notification",
    details: { audience: parsed.data.audience, recipients: userIds.length, ...result },
  });

  return NextResponse.json({ success: true, ...result });
}
