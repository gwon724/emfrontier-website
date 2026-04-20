/**
 * /api/alimtalk — 솔라피 카카오 알림톡 발송
 * POST /api/alimtalk { consultation, templateType }
 * templateType: 'register' | 'consult_reserve' | 'docs_request' | 'fund_apply' | 'approved' | 'consult_done' | 'reserve_done' | 'rejected' | 'remind'
 */

import { NextRequest, NextResponse } from "next/server";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "NCSM9IGKP48S2WOP";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "YIGNTAJ0FYQFP7SV2XCIE25BBDD7IIAL";
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID || "KA01PF260417154030663wL77U66wlWz";
const SENDER_PHONE = process.env.SENDER_PHONE || "01082114291";

// 템플릿 ID 매핑
const TEMPLATE_IDS: Record<string, string> = {
  register:        "KA01TP2604171602263531CsEYLmE4wh", // 회원가입
  consult_reserve: "KA01TP2604171605002570ctibgtaaqh", // 상담예약 완료
  docs_request:    "KA01TP26041716110927854v9cH3OlJb", // 서류요청
  fund_apply:      "KA01TP2604171614132005gH6sFhOGNM", // 자금신청
  approved:        "KA01TP260417161535606HdiLHSz5XXf", // 정책자금 승인
  consult_done:    "KA01TP260417161629056tyh8uzhss5Z", // 상담완료
  reserve_done:    "KA01TP260417161717800dFkrLYiFkfQ", // 예약완료
  rejected:        "KA01TP260417161958704ibbzfHzxy5y", // 심사 미승인
  remind:          "KA01TP2604171621062160gbxFR1tGo1", // 리마인드
  fund_execute:    "KA01TP260417162409846tyV1faRd6EY", // 자금집행
  extra_apply:     "KA01TP260417162532938wspDWZfLnZb", // 추가신청
  review:          "KA01TP2604171626327389q6Avs8y6ip", // 후기
  new_fund:        "KA01TP260417162743447PU5rbPLrIOM", // 신규정책자금 출시
};

// 상담 상태 → templateType 매핑
const STATUS_TO_TEMPLATE: Record<string, string> = {
  "접수대기":  "register",
  "상담예약":  "consult_reserve",
  "서류요청":  "docs_request",
  "신청진행":  "fund_apply",
  "상담완료":  "consult_done",
  "집행완료":  "approved",
  "종결":     "rejected",
};

function makeSignature(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return { date, salt, signature };
}

function buildText(templateType: string, c: Record<string, string>): string {
  const name = c.name || "고객";
  const id = c.id || "-";
  const biz = c.businessType || "-";
  const amount = c.desiredAmount || "-";
  const manager = c.manager || "담당 매니저";
  const phone = c.managerPhone || "엠프론티어";

  const texts: Record<string, string> = {
    register: `[엠프론티어] 상담 신청이 접수되었습니다.\n\n안녕하세요, ${name} 대표님!\n상담 신청이 정상 접수되었습니다.\n\n📋 접수번호: ${id}\n💼 업종: ${biz}\n💰 희망금액: ${amount}\n\n담당 매니저가 영업일 1일 이내 연락드립니다.\n\n감사합니다.\n엠프론티어`,

    consult_reserve: `[엠프론티어] 상담 일정 확인

안녕하세요, ${name} 대표님!
상담 일정이 확정되었습니다.

📅 상담일시: ${id}
👤 담당매니저: ${manager}
📞 연락처: ${phone}

준비사항: 사업자등록증, 최근 3개월 매출 자료

궁금한 점은 언제든지 연락 주세요!
엠프론티어`,

    docs_request: `[엠프론티어] 서류 제출 안내\n\n안녕하세요, ${name} 대표님!\n신청하신 정책자금 상담 진행을 위해\n아래 서류 제출을 부탁드립니다.\n\n 필요 서류\n• 사업자등록증\n• 최근 3개월 매출내역\n• 신분증 사본\n\n서류 제출 후 빠르게 검토 도와드리겠습니다.\n\n엠프론티어`,

    fund_apply: `[엠프론티어] 자금 신청 진행 안내\n\n안녕하세요, ${name} 대표님!\n정책자금 신청이 진행 중입니다.\n\n💼 신청 자금: ${amount}\n📊 진행 단계: 신청서 접수 완료\n⏰ 예상 결과: 영업일 3일 이내\n\n진행 상황은 실시간으로 안내드리겠습니다.\n\n담당자: ${manager} (${phone})\n엠프론티어`,

    approved: `[엠프론티어] 정책자금 승인 완료!

${name} 대표님! 
신청하신 정책자금 승인이 완료되었습니다.

💰 승인 자금: ${amount}
✅ 승인 금액: ${amount}
📅 집행 예정일: 담당자 안내 예정

담당자가 곧 연락드려 집행 절차를 안내해 드리겠습니다.

감사합니다.
엠프론티어`,

    consult_done: `[엠프론티어] 상담 완료 안내

안녕하세요, ${name} 대표님!
오늘 상담 감사드립니다.

📋 상담 요약:
• 추천 자금: ${amount}
• 예상 한도: ${amount}
• 다음 단계: 서류 제출 후 신청 진행

추가 문의사항은 언제든지 연락 주세요.
엠프론티어`,

    reserve_done: `[엠프론티어] 상담 예약 완료 안내\n\n안녕하세요, ${name} 대표님!\n예약하신 정책자금 무료 상담이 정상 접수되었습니다.\n\n📋 접수번호: ${id}\n👤 담당자: ${manager}\n\n영업일 기준 1일 이내 연락드리겠습니다.\n\n엠프론티어`,

    rejected: `[엠프론티어] 심사 결과 안내\n\n안녕하세요, ${name} 대표님.\n신청하신 정책자금 심사 결과를 안내드립니다.\n\n📋 심사 결과: 미승인\n\n미승인 사유와 재신청 방법을 담당자가 곧 안내드리겠습니다.\n착수금은 100% 환불 처리됩니다.\n\n엠프론티어`,

    remind: `[엠프론티어] 상담 신청 확인 안내\n\n안녕하세요, ${name} 대표님!\n정책자금 무료 상담을 신청하셨는데 아직 연락이 닿지 않았습니다.\n\n담당자가 다시 연락드리겠습니다.\n먼저 연락 주셔도 됩니다.\n\n📞 엠프론티어: ${phone}\n\n감사합니다.`,

    fund_execute: `[엠프론티어] 정책자금 집행 완료 안내 🎉\n\n축하드립니다, ${name} 대표님!\n신청하신 정책자금 집행이 완료되었습니다.\n\n폭 집행 금액: ${amount}\n\n사후 관리 서비스는 1년간 무상으로 제공됩니다.\n추가 문의는 담당자에게 연락 주세요.\n\n감사합니다.\n엠프론티어`,

    extra_apply: `[엠프론티어] 추가 자금 신청 접수 안내\n\n안녕하세요, ${name} 대표님!\n요청하신 추가 정책자금 신청이 접수되었습니다.\n\n📋 접수번호: ${id}\n폭 희망금액: ${amount}\n\n영업일 1일 이내 연락드리겠습니다.\n\n엠프론티어`,

    new_fund: `[엠프론티어] 신규 정책자금 출시 안내 📢\n\n안녕하세요, ${name} 대표님!\n이전에 상담 신청하신 대표님께 적합한 신규 정책자금이 출시되었습니다.\n\n⚠️ 인기 자금은 빠르게 소진됩니다!\n지금 바로 무료 상담 신청하세요.\n\n폰: ${phone}\n엠프론티어`,
  };

  return texts[templateType] || texts["register"];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consultation, templateType, status, customText } = body;

    if (!consultation) {
      return NextResponse.json({ error: "consultation required" }, { status: 400 });
    }

    const c = consultation;
    const phone = c.phone?.replace(/-/g, "").replace(/\s/g, "");

    if (!phone) {
      return NextResponse.json({ ok: false, reason: "phone number missing" });
    }

    // templateType 결정: 직접 지정 > 상태 기반 매핑 > 기본값(register)
    const resolvedType = templateType || STATUS_TO_TEMPLATE[status || c.status] || "register";
    const templateId = TEMPLATE_IDS[resolvedType];
    // customText 있으면 직접 작성 내용 사용, 없으면 자동 템플릿
    const text = customText || buildText(resolvedType, c as Record<string, string>);

    const { date, salt, signature } = makeSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    const payload: Record<string, unknown> = {
      message: {
        to: phone,
        from: SENDER_PHONE,
        text,
        ...(templateId && KAKAO_CHANNEL_ID ? {
          kakaoOptions: {
            pfId: KAKAO_CHANNEL_ID,
            templateId,
          }
        } : {}),
      },
    };

    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log(`[Alimtalk:${resolvedType}] 발송 결과:`, JSON.stringify(result));

    if (result.errorCode) {
      return NextResponse.json({ ok: false, error: result.errorMessage });
    }

    return NextResponse.json({ ok: true, result, templateType: resolvedType });
  } catch (e) {
    console.error("[Alimtalk] 오류:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
