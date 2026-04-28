#!/usr/bin/env node
/**
 * ② 매일 아침 9시 — 미배정 상담 리포트
 * 배정 안 된 상담 목록 → 뭉님 텔레그램
 */
const fs = require("fs");
const path = require("path");

const BOT_TOKEN = "8723256496:AAERmlGYiwkPTOH8-nosyw2ymh9XNt6Kc7I";
const ADMIN_CHAT_ID = "5500296822";
const DATA_DIR = path.join(__dirname, "../data");

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function main() {
  const consultFile = path.join(DATA_DIR, "consultations.json");
  if (!fs.existsSync(consultFile)) { console.log("데이터 없음"); return; }

  const consultations = JSON.parse(fs.readFileSync(consultFile, "utf8") || "[]");

  // 미배정 + 접수대기/접수완료 상태
  const unassigned = consultations.filter(c =>
    (!c.assignedTo || c.assignedTo === "") &&
    (c.status === "접수대기" || c.status === "접수완료")
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const today = new Date().toLocaleDateString("ko-KR");

  if (unassigned.length === 0) {
    await sendTelegram(ADMIN_CHAT_ID, `✅ <b>[${today}] 미배정 상담 없음</b>\n\n모든 상담이 담당자에게 배정되었습니다! 👍`);
    console.log("미배정 상담 없음");
    return;
  }

  let msg = `📋 <b>[${today}] 미배정 상담 리포트</b>\n총 <b>${unassigned.length}건</b> 미배정\n\n`;

  unassigned.forEach((c, i) => {
    const daysAgo = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    msg += `${i + 1}. <b>${c.name}</b> (${c.phone})\n`;
    msg += `   📅 ${new Date(c.createdAt).toLocaleDateString("ko-KR")} (${daysAgo}일 경과)\n`;
    msg += `   💼 ${c.businessType || "-"} · ${c.status}\n\n`;
  });

  msg += `👉 https://emfrontier.team/team`;

  await sendTelegram(ADMIN_CHAT_ID, msg);
  console.log(`미배정 ${unassigned.length}건 리포트 전송 완료`);
}

main().catch(console.error);
