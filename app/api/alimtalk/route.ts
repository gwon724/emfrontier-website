/**
 * /api/alimtalk — 솔라피 카카오 알림톡 발송
 * POST /api/alimtalk { consultation, templateType }
 */

import { NextRequest, NextResponse } from "next/server";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "NCSM9IGKP48S2WOP";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "YIGNTAJ0FYQFP7SV2XCIE25BBDD7IIAL";
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID || "KA01PF260417154030663wL77U66wlWz";
const SENDER_PHONE = process.env.SENDER_PHONE || "01082114291";
const START_BOT_TOKEN = process.env.TELEGRAM_START_BOT_TOKEN || "";
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "5500296822";

const TEMPLATE_IDS: Record<string, string> = {
  register:        "KA01TP260428112948784jz0YhWeF8FP",
  register_portal:  "KA01TP260421142741105kr53kF0B6qf",
  consult_reserve: "KA01TP2604171605002570ctibgtaaqh",
  docs_request:    "KA01TP26041716110927854v9cH3OlJb",
  docs_request_link: "KA01TP260428105226107iNfbSt56pZJ",
  temp_password:     "KA01TP260428043128952glc3ZNHfXVO",
  fund_apply:      "KA01TP2604171614132005gH6sFhOGNM",
  fund_waiting:    "KA01TP260421144920873mw6XDuWLJ0i",
  fund_reviewing:  "KA01TP260421144921369tJ0SbbI62zZ",
  fund_reviewed:   "KA01TP260421144921550ea644yZoVOJ",
  approved:        "KA01TP260417161535606HdiLHSz5XXf",
  consult_done:    "KA01TP260417161717800dFkrLYiFkfQ",
  reserve_done:    "KA01TP260417161717800dFkrLYiFkfQ",
  rejected:        "KA01TP260428131339130EwFjx8QTzek",
  remind:          "KA01TP2604171621062160gbxFR1tGo1",
  fund_execute:    "KA01TP260417162409846tyV1faRd6EY",
  extra_apply:     "KA01TP260428042553990I8zTwD6Zul7",
  review:          "KA01TP2604171626327389q6Avs8y6ip",
  new_fund:        "KA01TP260428042703616Gj4KquXFCDJ",
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
  const amount    = c.exactAmount || c.amount || c.desiredAmount || "-";
  const manager   = c.manager || "담당 매니저";
  const contact   = c.managerPhone || "1234-5678";
  const datetime  = c.consultDatetime || "담당자 안내 예정";
  const reviewUrl = c.reviewUrl || "https://emfrontier.team";
  const fundName  = c.fundName || "-";
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
    // [엠프론티어] 서류 제출 안내 (링크 포함)
    docs_request_link: {
      "#{이름}": name,
      "#{서류리스트}": (Array.isArray(c["selectedDocs"]) ? (c["selectedDocs"] as string[]).join("\n") : c["docList"] || "-"),
      "#{매니저}": manager,
      "#{매니저연락처}": contact,
    },
    // [엠프론티어] 임시 비밀번호 안내
    temp_password: {
      "#{이름}": name,
      "#{임시비밀번호}": c["tempPassword"] || "",
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
    // 자금 심사대기/심사중/심사완료
    fund_waiting: {
      "#{이름}":    name,
      "#{자금명}":  fundName,
      "#{금액}":    c.fundLimit || amount,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    fund_reviewing: {
      "#{이름}":    name,
      "#{자금명}":  fundName,
      "#{금액}":    c.fundLimit || amount,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    fund_reviewed: {
      "#{이름}":    name,
      "#{자금명}":  fundName,
      "#{금액}":    c.fundLimit || amount,
      "#{담당자}":  manager,
      "#{연락처}":  contact,
    },
    // [엠프론티어] 정책자금 승인 완료!
    approved: {
      "#{이름}":    name,
      "#{희망금액}": fundName !== "-" ? `${fundName} ${amount}` : amount,
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
      "#{금액}":   amount || "-",
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
  const amount    = c.exactAmount || c.amount || c.desiredAmount || "-";
  const manager   = c.manager || "담당 매니저";
  const contact   = c.managerPhone || "1234-5678";
  const datetime  = c.consultDatetime || "담당자 안내 예정";
  const reviewUrl = c.reviewUrl || "https://emfrontier.team";
  const fundName  = c.fundName || "-";
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
요청하신 엠프론티어 고객 포털 가입 링크를 안내드립니다.

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

    docs_request_link:
`[엠프론티어] 서류 제출 안내

${name} 대표님, 안녕하세요!
요청하신 정책자금 신청을 위한 서류 제출을 부탁드립니다.

제출 서류 목록:
${Array.isArray(c["selectedDocs"]) ? (c["selectedDocs"] as string[]).join("\n") : (c["docList"] || "-")}

담당 매니저: ${manager}
연락처: ${contact}

엠프론티어`,

    temp_password:
`[엠프론티어] 임시 비밀번호 안내

${name} 대표님, 안녕하세요!

요청하신 고객 포털 임시 비밀번호가 발급되었습니다.

🔐 임시 비밀번호: ${c["tempPassword"] || ""}

로그인 후 반드시 비밀번호를 변경해주세요.

엠프론티어`,

    fund_apply:
`안녕하세요, ${name} 대표님!
정책자금 신청이 진행 중입니다.

💼 신청 자금: ${fundName}
📊 진행 단계: ${step}
⏰ 예상 결과: ${schedule}

진행 상황은 실시간으로 안내드리겠습니다.

담당자: ${manager} (${contact})
엠프론티어`,

    fund_waiting:
`[엠프론티어] 자금 심사 대기 안내

안녕하세요, ${name} 대표님!
신청하신 정책자금이 심사 대기 중입니다.

💼 자금명: ${fundName}
💰 신청금액: ${c.fundLimit || amount}
📋 현재 상태: 심사 대기

심사가 시작되면 즉시 안내드리겠습니다.
담당자: ${manager} (${contact})

엠프론티어`,

    fund_reviewing:
`[엠프론티어] 자금 심사 진행 안내

안녕하세요, ${name} 대표님!
신청하신 정책자금 심사가 진행 중입니다.

💼 자금명: ${fundName}
💰 신청금액: ${c.fundLimit || amount}
📋 현재 상태: 심사 중

심사 완료 시 결과를 바로 안내드리겠습니다.
담당자: ${manager} (${contact})

엠프론티어`,

    fund_reviewed:
`[엠프론티어] 자금 심사 완료 안내

안녕하세요, ${name} 대표님!
신청하신 정책자금 심사가 완료되었습니다.

💼 자금명: ${fundName}
💰 신청금액: ${c.fundLimit || amount}
📋 현재 상태: 심사 완료

담당자가 곧 최종 결과를 안내드리겠습니다.
담당자: ${manager} (${contact})

엠프론티어`,

    approved:
`[엠프론티어] 정책자금 승인 완료!

${name} 대표님! 
신청하신 정책자금 승인이 완료되었습니다.

💰 승인 자금: ${fundName !== "-" ? fundName : amount}
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
💰신청 자금: ${amount || "-"}
📋 심사 결과: 부결

부결 사유와 재신청 가능 여부를 검토하여
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
정책자금 신청하신 이력 기준, 재신청 제한이 종료되어 안내드립니다.
추가로 요청하신 신청 가능 일정 보내드립니다.

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
추가로 요청하신 신청 가능한 신규 자금이 확인되어 안내드립니다.

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
            // register_portal: 버튼 없이 발송 (링크는 본문에 포함)
            // docs_request_link: 서류 제출 링크 버튼 동적 주입
            ...(resolvedType === "docs_request_link" && c.uploadLink ? {
              buttons: [
                {
                  buttonType: "WL",
                  buttonName: "서류 제출하기",
                  linkMo: c.uploadLink,
                  linkPc: c.uploadLink,
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

    // 알림톡 발송 성공 시 START 봇으로 텔레그램 알림
    if (START_BOT_TOKEN && ADMIN_CHAT_ID) {
      const fallbackText = buildText(resolvedType, c);
      const tgText = `📨 [알림톡 발송됨]\n수신: ${phone}\n템플릿: ${resolvedType}\n\n${fallbackText}`;
      fetch(`https://api.telegram.org/bot${START_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: ADMIN_CHAT_ID, text: tgText }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, result, templateType: resolvedType });
  } catch (e) {
    console.error("[Alimtalk] 오류:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
