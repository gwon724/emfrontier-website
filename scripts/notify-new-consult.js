#!/usr/bin/env node
/**
 * ① 새 상담 신청 알림 — 5분마다 실행
 * 새로 접수된 상담 → 슈퍼어드민(뭉) 텔레그램 알림
 */
const fs = require("fs");
const path = require("path");

const BOT_TOKEN = "8461150221:AAHj6eijK8nBUbOcBZsPrHLK2_4nbyAT7p8";
const ADMIN_CHAT_ID = "5500296822"; // 뭉님 chat ID
const DATA_DIR = path.join(__dirname, "../data");
const LAST_CHECK_FILE = path.join(DATA_DIR, "last_consult_check.json");
const CONSULTATIONS_FILE = path.join(DATA_DIR, "consultations.json");

function sendTelegram(chatId, text) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function main() {
  if (!fs.existsSync(CONSULTATIONS_FILE)) { console.log("상담 데이터 없음"); return; }

  const consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, "utf8") || "[]");

  // 마지막 체크 시간 로드
  let lastCheck = 0;
  if (fs.existsSync(LAST_CHECK_FILE)) {
    lastCheck = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, "utf8")).lastCheck || 0;
  }
  const now = Date.now();

  // 마지막 체크 이후 새 접수 필터
  const newConsults = consultations.filter(c => {
    const t = new Date(c.createdAt).getTime();
    return t > lastCheck;
  });

  if (newConsults.length === 0) {
    console.log(`[${new Date().toLocaleString("ko-KR")}] 새 상담 없음`);
  } else {
    for (const c of newConsults) {
      const msg = `🔔 <b>새 상담 신청!</b>\n\n👤 이름: ${c.name}\n📞 연락처: ${c.phone}\n💼 업종: ${c.businessType || "-"}\n💰 희망금액: ${c.desiredAmount || "-"}\n📅 신청시각: ${new Date(c.createdAt).toLocaleString("ko-KR")}\n\n👉 https://emfrontier.team/team`;
      await sendTelegram(ADMIN_CHAT_ID, msg);
      console.log(`[새상담] ${c.name} 알림 전송`);

      // 담당자가 배정된 경우 담당자한테도 알림
      if (c.assignedTo) {
        try {
          const admins = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "adminAccounts.json"), "utf8") || "[]");
          const adm = admins.find(a => a.username === c.assignedTo);
          if (adm?.telegramChatId && adm.telegramChatId !== ADMIN_CHAT_ID) {
            await sendTelegram(adm.telegramChatId, msg);
            console.log(`[새상담] ${adm.name} 담당자 알림 전송`);
          }
        } catch {}
      }
    }
    console.log(`[${new Date().toLocaleString("ko-KR")}] 새 상담 ${newConsults.length}건 알림 완료`);
  }

  // 마지막 체크 시간 업데이트
  fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify({ lastCheck: now }));
}

main().catch(console.error);
