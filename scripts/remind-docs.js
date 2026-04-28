#!/usr/bin/env node
/**
 * ③ 서류 미제출 리마인드 — 매일 10시 실행
 * "서류요청" 상태로 3일 이상 지난 고객 → 알림톡 자동 발송
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BOT_TOKEN = "8723256496:AAERmlGYiwkPTOH8-nosyw2ymh9XNt6Kc7I";
const ADMIN_CHAT_ID = "5500296822";
const DATA_DIR = path.join(__dirname, "../data");

// Solapi 설정
const SOLAPI_API_KEY = "NCSM9IGKP48S2WOP";
const SOLAPI_API_SECRET = "YIGNTAJ0FYQFP7SV2XCIE25BBDD7IIAL";
const KAKAO_CHANNEL_ID = "KA01PF260417154030663wL77U66wlWz";
const SENDER_PHONE = "01082114291";
const DOCS_REQUEST_TEMPLATE = "KA01TP26041716110927854v9cH3OlJb"; // docs_request (승인됨)

function makeSignature(date, salt) {
  return crypto.createHmac("sha256", SOLAPI_API_SECRET).update(date + salt).digest("hex");
}

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

async function sendAlimtalk(name, phone) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).slice(2);
  const signature = makeSignature(date, salt);

  const lmsText = `[엠프론티어] 서류 제출 안내\n\n${name} 대표님, 안녕하세요!\n정책자금 신청을 위한 서류가 아직 제출되지 않았습니다.\n\n서류 제출이 완료되어야 심사가 진행됩니다.\n서류 제출이 어려우시면 담당 매니저에게 연락 주세요.\n\n엠프론티어`;

  const body = {
    message: {
      to: phone.replace(/-/g, ""),
      from: SENDER_PHONE,
      kakaoOptions: {
        pfId: KAKAO_CHANNEL_ID,
        templateId: DOCS_REQUEST_TEMPLATE,
        variables: { "#{이름}": name },
      },
      text: lmsText,
    },
  };

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}

async function main() {
  const consultFile = path.join(DATA_DIR, "consultations.json");
  if (!fs.existsSync(consultFile)) { console.log("데이터 없음"); return; }

  const consultations = JSON.parse(fs.readFileSync(consultFile, "utf8") || "[]");
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const today = new Date().toLocaleDateString("ko-KR");

  // 서류요청 상태 + 3일 이상 경과
  const targets = consultations.filter(c => {
    if (c.status !== "서류요청") return false;
    const updated = new Date(c.updatedAt || c.createdAt).getTime();
    return (now - updated) >= THREE_DAYS;
  });

  if (targets.length === 0) {
    console.log("서류 미제출 리마인드 대상 없음");
    await sendTelegram(`✅ <b>[${today}] 서류 미제출 리마인드</b>\n\n리마인드 대상 고객 없음 👍`);
    return;
  }

  let report = `📎 <b>[${today}] 서류 미제출 리마인드</b>\n총 <b>${targets.length}명</b>에게 알림톡 발송\n\n`;
  let successCount = 0;

  for (const c of targets) {
    const daysAgo = Math.floor((now - new Date(c.updatedAt || c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    try {
      const result = await sendAlimtalk(c.name, c.phone);
      const ok = result.groupInfo?.count?.total > 0;
      report += `${ok ? "✅" : "❌"} ${c.name} (${c.phone}) — ${daysAgo}일 경과\n`;
      if (ok) successCount++;
    } catch (e) {
      report += `❌ ${c.name} (${c.phone}) — 오류\n`;
    }
    // API 과부하 방지
    await new Promise(r => setTimeout(r, 500));
  }

  report += `\n✅ 성공: ${successCount}건 / 전체: ${targets.length}건`;
  await sendTelegram(report);
  console.log(`리마인드 ${successCount}/${targets.length}건 완료`);
}

main().catch(console.error);
