import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || "emfrontier_meta_2024";
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || "";
const DATA_DIR = path.join(process.cwd(), "data");

// Webhook 검증 (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Meta Webhook] 검증 성공");
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "검증 실패" }, { status: 403 });
}

// 리드 수신 (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[Meta Webhook] 수신:", JSON.stringify(body));

    if (body.object !== "page") {
      return NextResponse.json({ status: "ok" });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;

        const leadId = change.value?.leadgen_id;
        const formId = change.value?.form_id;

        if (!leadId) continue;

        // Meta API로 리드 상세 정보 조회
        const leadData = await fetchLeadData(leadId);

        let name = "미입력", phone = "", biz = "", amount = "";

        if (leadData?.field_data) {
          const fields: Record<string, string> = {};
          for (const f of leadData.field_data) {
            fields[f.name] = f.values?.[0] || "";
          }
          name = fields["full_name"] || fields["이름"] || fields["name"] || "미입력";
          phone = fields["phone_number"] || fields["연락처"] || fields["전화번호"] || fields["phone"] || "";
          biz = fields["업종"] || fields["business_type"] || "";
          amount = fields["희망금액"] || fields["amount"] || "";
        }

        console.log(`[Meta Lead] 이름: ${name}, 전화: ${phone}, 업종: ${biz}`);

        // DB에 상담 등록
        const consultId = saveConsultation({ name, phone, biz, amount, leadId, formId });

        // 텔레그램 알림
        await sendTelegramAlert({ name, phone, biz, amount, consultId });

        // 알림톡 발송
        if (phone) {
          await sendAlimtalk({ phone, name, id: consultId, biz, amount });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[Meta Webhook] 오류:", err);
    return NextResponse.json({ status: "ok" });
  }
}

function saveConsultation({ name, phone, biz, amount, leadId, formId }: {
  name: string; phone: string; biz: string; amount: string; leadId: string; formId?: string;
}): string {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, "consultations.json");
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
    const id = `meta_${Date.now()}`;
    const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    data.push({
      id,
      name,
      phone,
      bizType: biz,
      hopeAmount: amount ? `${amount}만원` : "",
      status: "pending",
      source: "meta_lead",
      metaLeadId: leadId,
      metaFormId: formId || null,
      createdAt: now,
      updatedAt: now,
      funds: [],
      rejectedFunds: [],
      memo: "",
      assignee: "",
      reservedAt: "",
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[Meta Lead] DB 저장: ${id}`);
    return id;
  } catch (e) {
    console.error("[Meta Lead] DB 저장 실패:", e);
    return `meta_${Date.now()}`;
  }
}

async function fetchLeadData(leadId: string) {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn("[Meta Lead] PAGE_ACCESS_TOKEN 없음");
    return null;
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`
    );
    return await res.json();
  } catch (e) {
    console.error("[Meta Lead] 리드 조회 실패:", e);
    return null;
  }
}

async function sendTelegramAlert({ name, phone, biz, amount, consultId }: {
  name: string; phone: string; biz: string; amount: string; consultId: string;
}) {
  const token = "8720804043:AAESLW-vYqKiGjw7jzGEPPowvd5_1-dDZto";
  const chatId = "5500296822";
  const msg = `🎯 [Meta 광고 리드 수신]\n이름: ${name}\n연락처: ${phone || "미입력"}\n업종: ${biz || "미입력"}\n희망금액: ${amount || "미입력"}\n접수번호: ${consultId}`;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg }),
    });
  } catch (e) {
    console.error("[Meta Lead] 텔레그램 실패:", e);
  }
}

async function sendAlimtalk({ phone, name, id, biz, amount }: {
  phone: string; name: string; id: string; biz: string; amount: string;
}) {
  try {
    await fetch("https://emfrontier.team/api/alimtalk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "register",
        phone, name, id,
        biz: biz || "미입력",
        amount: amount ? `${amount}만원` : "미입력",
      }),
    });
  } catch (e) {
    console.error("[Meta Lead] 알림톡 실패:", e);
  }
}
