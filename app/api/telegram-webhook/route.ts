import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BOT_TOKEN = process.env.TELEGRAM_NOTIFY_BOT_TOKEN || "";
const DATA_DIR = path.join(process.cwd(), "data");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.message) return NextResponse.json({ ok: true });

  const msg = body.message;
  const chatId = String(msg.chat?.id || "");
  const text = (msg.text || "").trim();
  const firstName = msg.from?.first_name || "";
  const username = msg.from?.username || "";

  // /등록 [어드민username] 또는 /start [어드민username]
  const match = text.match(/^\/(?:등록|register|start)\s*(.*)$/i);
  const adminUsername = (match?.[1] || "").trim();

  if (!adminUsername) {
    // username만 보낸 경우
    await sendMessage(chatId, `👋 안녕하세요!\n\n어드민 계정 연동을 위해 아래 형식으로 메시지 보내주세요:\n\n<code>/등록 [어드민ID]</code>\n\n예: <code>/등록 son4291</code>`);
    return NextResponse.json({ ok: true });
  }

  // adminAccounts에서 username 찾기
  const accountsFile = path.join(DATA_DIR, "adminAccounts.json");
  if (!fs.existsSync(accountsFile)) {
    await sendMessage(chatId, "❌ 관리자 데이터를 찾을 수 없습니다.");
    return NextResponse.json({ ok: true });
  }

  const accounts = JSON.parse(fs.readFileSync(accountsFile, "utf8") || "[]");
  const idx = accounts.findIndex((a: { username: string }) =>
    a.username.toLowerCase() === adminUsername.toLowerCase()
  );

  if (idx === -1) {
    await sendMessage(chatId, `❌ <b>${adminUsername}</b> 계정을 찾을 수 없습니다.\n\n어드민 로그인 ID를 정확히 입력해주세요.`);
    return NextResponse.json({ ok: true });
  }

  // chatId 저장
  accounts[idx].telegramChatId = chatId;
  fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));

  await sendMessage(chatId,
    `✅ <b>${accounts[idx].name}</b> 담당자 연동 완료!\n\n` +
    `📱 Chat ID: <code>${chatId}</code>\n` +
    `👤 텔레그램: ${firstName} (@${username})\n\n` +
    `이제 서류 제출 알림과 리마인드가 이 채팅으로 전송됩니다.`
  );

  console.log(`[webhook] 어드민 연동: ${accounts[idx].name} (${adminUsername}) → chatId: ${chatId}`);
  return NextResponse.json({ ok: true });
}

async function sendMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
