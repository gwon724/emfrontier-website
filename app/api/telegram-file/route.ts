import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const chatId = formData.get("chatId") as string;
  const clientName = formData.get("clientName") as string;
  const consultationId = formData.get("consultationId") as string;
  const docName = formData.get("docName") as string;

  if (!file || !chatId) {
    return NextResponse.json({ error: "file and chatId required" }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: "bot token missing" }, { status: 500 });

  const tgForm = new FormData();
  tgForm.append("chat_id", chatId);
  tgForm.append("document", file, file.name);
  tgForm.append(
    "caption",
    `📎 서류 제출\n👤 고객명: ${clientName || "-"}\n📋 접수번호: ${consultationId || "-"}\n📂 서류종류: ${docName || "-"}`
  );

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: "POST",
    body: tgForm,
  });
  const result = await res.json();
  if (!result.ok) return NextResponse.json({ error: result.description }, { status: 500 });
  return NextResponse.json({ ok: true });
}
