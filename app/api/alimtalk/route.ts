/**
 * /api/alimtalk — 솔라피 카카오 알림톡 발송
 * POST /api/alimtalk { consultation, templateType }
 */

import { NextRequest, NextResponse } from "next/server";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "NCSM9IGKP48S2WOP";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "YIGNTAJ0FYQFP7SV2XCIE25BBDD7IIAL";
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID || "KA01PF260417154030663wL77U66wlWz";
const SENDER_PHONE = process.env.SENDER_PHONE || "01082114291";

const TEMPLATE_IDS: Record<string, string> = {
  register:        "KA01TP2604171602263531CsEYLmE4wh",
  register_portal:  "KA01TP2604211426533112Vr01NzRn2R",
  consult_reserve: "KA01TP2604171605002570ctibgtaaqh",
  docs_request:    "KA01TP26041716110927854v9cH3OlJb",
  fund_apply:      "KA01TP2604171614132005gH6sFhOGNM",
  approved:        "KA01TP260417161535606HdiLHSz5XXf",
  consult_done:    "KA01TP260417161717800dFkrLYiFkfQ",
  reserve_done:    "KA01TP260417161717800dFkrLYiFkfQ",
  rejected:        "KA01TP260417161958704ibbzfHzxy5y",
  remind:          "KA01TP2604171621062160gbxFR1tGo1",
  fund_execute:    "KA01TP260417162409846tyV1faRd6EY",
  extra_apply:     "KA01TP260417162532938wspDWZfLnZb",
  review:          "KA01TP2604171626327389q6Avs8y6ip",
  new_fund:        "KA01TP260417162743447PU5rbPLrIOM",
};

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

function buildVariables(templateType: string, c: Record<string, string>): Record<string, string> {
  const name      = c.name || "고객";
  const id        = c.id || "-";
  const biz       = c.businessType || "-";
  const amount    = c.exactAmount || c.desiredAmount || "-";
  const manager   = c.manager || "담당 매니저";
  const contact   = c.managerPhone || "1234-5678";
  const datetime  = c.consultDatetime || "담당자 안내 예정";
  const reviewUrl = c.reviewUrl || "https://emfrontier.team";
  const fundName  = c.fundName || amount;
  const limit     = c.fundLimit || "담당자 안내 예정";
  const deadline  = c.fundDeadline || "담당자 안내 예정";
  const reapplyDate = c.reapplyDate || "담당자 안내 예정";
  const execAmount = c.execAmount || amount;
  const execDate   = c.execDate || "담당자 안내 예정";
  const step       = c.step || "서류 검토 중";
  const schedule   = c.schedule || "영업일 3일 이내";
  const recommend  = c.recommendFund || fundName;
  const nextStep   = c.nextStep || "담당자 연락 예정";
  const expectLimit = c.expectLimit || "담당자 안내 예정";

  const varMaps: Record<string, Record<string, string>> = {
    // [엠프론티어] 상담 신청이 접수되었습니다.
    register: {
      "#{이름}":    name,
      "#{접수번호}": id,
      "#{업종}":    biz,
      "#{희망금액}": amount,
    },
    register_portal: {
      "#{이름}":  name,
      "#{링크}":  c.registerLink || "",
    },
    // [엠프론티어] 상담 일정 확인 (= consult_reserve)
    consult_reserve: {
      "#{이름}":    name,
      "#{상담일시}": datetime,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    // [엠프론티어] 서류 제출 안내
    docs_request: {
      "#{이름}": name,
    },
    // [엠프론티어] 자금 신청 진행 안내
    fund_apply: {
      "#{이름}":    name,
      "#{자금명}":  fundName,
      "#{진행단계}": step,
      "#{예상일정}": schedule,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    // [엠프론티어] 정책자금 승인 완료!
    approved: {
      "#{이름}":    name,
      "#{희망금액}": amount,
    },
    // [엠프론티어] 상담 종결 안내
    consult_done: {
      "#{이름}": name,
    },
    // [엠프론티어] 상담 일정 확인 (= reserve_done)
    reserve_done: {
      "#{이름}":    name,
      "#{상담일시}": datetime,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    // [엠프론티어] 심사 결과 안내
    rejected: {
      "#{이름}":   name,
      "#{자금명}": fundName,
    },
    // [엠프론티어] 상담 신청 확인 안내
    remind: {
      "#{이름}":   name,
      "#{연락처}": contact,
    },
    // [엠프론티어] 자금 집행 완료
    fund_execute: {
      "#{이름}":    name,
      "#{자금명}":  fundName,
      "#{집행금액}": execAmount,
      "#{집행일}":  execDate,
    },
    // [엠프론티어] 재신청 가능 안내
    extra_apply: {
      "#{이름}":       name,
      "#{재신청가능일}": reapplyDate,
      "#{추천자금}":   recommend,
    },
    // [엠프론티어] 소중한 후기 부탁드립니다
    review: {
      "#{이름}":    name,
      "#{후기링크}": reviewUrl,
    },
    // [엠프론티어] 신규 정책자금 안내
    new_fund: {
      "#{이름}":   name,
      "#{자금명}": fundName,
      "#{한도}":   limit,
      "#{마감일}": deadline,
    },
  };

  return varMaps[templateType] || varMaps["register"];
}

function buildText(templateType: string, c: Record<string, string>): string {
  const name      = c.name || "고객";
  const id        = c.id || "-";
  const biz       = c.businessType || "-";
  const amount    = c.exactAmount || c.desiredAmount || "-";
  const manager   = c.manager || "담당 매니저";
  const contact   = c.managerPhone || "1234-5678";
  const datetime  = c.consultDatetime || "담당자 안내 예정";
  const reviewUrl = c.reviewUrl || "https://emfrontier.team";
  const fundName  = c.fundName || amount;
  const limit     = c.fundLimit || "담당자 안내 예정";
  const deadline  = c.fundDeadline || "담당자 안내 예정";
  const reapplyDate = c.reapplyDate || "담당자 안내 예정";
  const execAmount = c.execAmount || amount;
  const execDate   = c.execDate || "담당자 안내 예정";
  const step       = c.step || "서류 검토 중";
  const schedule   = c.schedule || "영업일 3일 이내";
  const recommend  = c.recommendFund || fundName;

  const texts: Record<string, string> = {
    register_portal:
`[엠프론티어] 고객 포털 가입 안내

안녕하세요, ${name} 대표님!
엠프론티어 고객 포털 가입 링크를 안내드립니다.

🔗 가입 링크: ${c.registerLink || ""}

링크는 24시간 동안 유효합니다.
가입 후 진행 현황 및 서류 제출이 가능합니다.

엠프론티어`,
    register:
`[엠프론티어] 상담 신청이 접수되었습니다.

안녕하세요, ${name} 대표님!
상담 신청이 정상 접수되었습니다.

📋 접수번호: ${id}
💼 업종: ${biz}
💰 희망금액: ${amount}

담당 매니저가 영업일 1일 이내 연락드립니다.

감사합니다.
엠프론티어`,

    consult_reserve:
`[엠프론티어] 상담 일정 확인

안녕하세요, ${name} 대표님!
상담 일정이 확정되었습니다.

📅 상담일시: ${datetime}
👤 담당매니저: ${manager}
📞 연락처: ${contact}

준비사항: 사업자등록증, 최근 3개월 매출 자료

궁금한 점은 언제든지 연락 주세요!
엠프론티어`,

    docs_request:
`[엠프론티어] 서류 제출 안내

안녕하세요, ${name} 대표님!
신청하신 정책자금 상담 진행을 위해
아래 서류 제출을 부탁드립니다.

 필요 서류
• 사업자등록증
• 최근 3개월 매출내역
• 신분증 사본

서류 제출 후 빠르게 검토 도와드리겠습니다.

엠프론티어`,

    fund_apply:
`[엠프론티어] 자금 신청 진행 안내

안녕하세요, ${name} 대표님!
정책자금 신청이 진행 중입니다.

💼 신청 자금: ${fundName}
📊 진행 단계: ${step}
⏰ 예상 결과: ${schedule}

진행 상황은 실시간으로 안내드리겠습니다.

담당자: ${manager} (${contact})
엠프론티어`,

    approved:
`[엠프론티어] 정책자금 승인 완료!

${name} 대표님! 
신청하신 정책자금 승인이 완료되었습니다.

💰 승인 자금: ${amount}
✅ 승인 금액: ${amount}
📅 집행 예정일: 담당자 안내 예정

담당자가 곧 연락드려 집행 절차를 안내해 드리겠습니다.

감사합니다.
엠프론티어`,

    consult_done:
`[엠프론티어] 상담 종결 안내

안녕하세요, ${name} 대표님.
신청하신 상담이 종결 처리되었습니다.

이용해 주셔서 감사합니다.
추후 다시 필요하신 경우 언제든지 찾아주세요!

엠프론티어`,

    reserve_done:
`[엠프론티어] 상담 일정 확인

안녕하세요, ${name} 대표님!
상담 일정이 확정되었습니다.

📅 상담일시: ${datetime}
👤 담당매니저: ${manager}
📞 연락처: ${contact}

준비사항: 사업자등록증, 최근 3개월 매출 자료

궁금한 점은 언제든지 연락 주세요!
엠프론티어`,

    rejected:
`[엠프론티어] 심사 결과 안내

안녕하세요, ${name} 대표님.
신청하신 정책자금 심사 결과를 안내드립니다.

💼 신청 자금: ${fundName}
📋 심사 결과: 미승인

미승인 사유와 재신청 가능 여부를 검토하여
담당자가 곧 연락드리겠습니다.

엠프론티어`,

    remind:
`[엠프론티어] 상담 신청 확인 안내

안녕하세요, ${name} 대표님!
정책자금 무료 상담을 신청하셨는데
아직 연락이 닿지 않았습니다.

📞 담당자가 다시 연락드리겠습니다.
혹시 편한 연락 시간이 있으시면
아래 번호로 먼저 연락 주셔도 됩니다.

📞 엠프론티어 담당자: ${contact}`,

    fund_execute:
`[엠프론티어] 자금 집행 완료

축하드립니다, ${name} 대표님! 
신청하신 정책자금 집행이 완료되었습니다.

💰 자금명: ${fundName}
✅ 집행 금액: ${execAmount}
📅 집행일: ${execDate}

사후 관리 서비스는 1년간 무상으로 제공됩니다.
궁금한 점은 언제든지 연락 주세요!

엠프론티어`,

    extra_apply:
`[엠프론티어] 재신청 가능 안내

안녕하세요 ${name} 대표님. 
이전에 정책자금 상담을 신청하신 이력 기준, 재신청 제한이 종료되어 안내드립니다.

📅 ${reapplyDate}부터 재신청 가능 
💼 ${recommend}

현재 조건 재확인 권장드립니다.

엠프론티어`,

    review:
`[엠프론티어] 소중한 후기 부탁드립니다

안녕하세요, ${name} 대표님!
정책자금 서비스를 이용해 주셔서 감사합니다.

대표님의 소중한 후기가 다른 사업자분들께
큰 도움이 됩니다 😊

⭐ 후기 남기기: ${reviewUrl}

(소요 시간: 1분 이내)
감사합니다.
엠프론티어`,

    new_fund:
`[엠프론티어] 신규 정책자금 안내

안녕하세요, ${name} 대표님! 
이전에 정책자금 상담을 신청하신 이력 기준으로 
신청 가능한 신규 자금이 확인되어 안내드립니다.

💰 자금명: ${fundName} 
✅ 한도: ${limit} 
📅 신청 마감: ${deadline}

엠프론티어`,
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

    const resolvedType = templateType || STATUS_TO_TEMPLATE[status || c.status] || "register";
    const templateId = TEMPLATE_IDS[resolvedType];
    const text = customText || buildText(resolvedType, c as Record<string, string>);
    const variables = buildVariables(resolvedType, c as Record<string, string>);

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
            variables,
            // register_portal: 버튼 링크를 실제 토큰 URL로 동적 주입
            ...(resolvedType === "register_portal" && c.registerLink ? {
              buttons: [
                {
                  buttonType: "WL",
                  buttonName: "지금 가입하기",
                  linkMo: c.registerLink,
                  linkPc: c.registerLink,
                }
              ]
            } : {}),
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
