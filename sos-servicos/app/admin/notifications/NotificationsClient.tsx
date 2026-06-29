"use client";

import { useState } from "react";

export default function NotificationsClient() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all_users");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(`Enviado para ${data.sent} dispositivo(s). Falhas: ${data.failed}.`);
        setTitle("");
        setBody("");
      } else {
        setResult(data.error || "Erro ao enviar.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} style={{ background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Enviar notificação push</div>

      <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Público</label>
      <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}>
        <option value="all_users">Todos os usuários</option>
        <option value="all_professionals">Apenas profissionais</option>
      </select>

      <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Título</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        required
        style={{ width: "100%", padding: 10, marginBottom: 14, borderRadius: 8, border: "1px solid #E2E8F0" }}
      />

      <label style={{ fontSize: 13, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Mensagem</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={180}
        rows={3}
        required
        style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #E2E8F0" }}
      />

      <button
        type="submit"
        disabled={sending}
        style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#0F172A", color: "#FFF", fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1 }}
      >
        {sending ? "Enviando..." : "Enviar notificação"}
      </button>

      {result && (
        <p style={{ marginTop: 14, fontSize: 13, color: "#0F172A", background: "#F1F5F9", padding: 10, borderRadius: 8 }}>
          {result}
        </p>
      )}
    </form>
  );
}
