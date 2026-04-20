import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = process.env.RESEND_FROM || "noreply@emfrontier.team";

const emailWrapper = (bodyText: string) => {
  const html = bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#F1F5F9; font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif; }
  </style>
</head>
<body style="background:#F1F5F9; padding:32px 16px;">
  <div style="max-width:560px; margin:0 auto;">

    <div style="background:#0B1120; border-radius:16px 16px 0 0; padding:28px 32px; text-align:center;">
      <p style="color:#60A5FA; font-size:12px; font-weight:700; letter-spacing:3px; margin-bottom:8px;">EMFRONTIER</p>
      <div style="width:36px; height:2px; background:#3B82F6; margin:0 auto;"></div>
    </div>

    <div style="background:#ffffff; padding:36px 32px; font-size:15px; line-height:2.0; color:#1E293B; white-space:pre-line;">
      ${html}
    </div>

    <div style="background:#0B1120; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
      <p style="color:#475569; font-size:11px; line-height:1.8;">
        본 메일은 수신만 가능한 메일입니다. 회신이 불가합니다.<br/>
        문의사항은 담당 컨설턴트에게 직접 연락해 주세요.
      </p>
      <p style="color:#334155; font-size:10px; margin-top:10px;">© 2026 EMFRONTIER. All Rights Reserved</p>
    </div>

  </div>
</body>
</html>`;
};

function buildText(
  templateType: string,
  name: string,
  extra?: string,
  id?: string,
  manager?: string,
  phone?: string,
  biz?: string,
  amount?: string
): string {
  const _id      = id      || "-";
  const _manager = manager || "담당자";
  const _phone   = phone   || "담당자 연락처 확인";
  const _biz     = biz     || "-";
  const _amount  = amount  || "-";

  const texts: Record<string, string> = {
    register: `[엠프론티어] 상담 신청이 접수되었습니다.

안녕하세요, ${name} 대표님!
상담 신청이 정상 접수되었습니다.

📋 접수번호: ${_id}
💼 업종: ${_biz}
💰 희망금액: ${_amount}

담당 매니저가 영업일 1일 이내 연락드립니다.

감사합니다.
엠프론티어`,

    consult_reserve: `[엠프론티어] 상담 일정 확인

안녕하세요, ${name} 대표님!
상담 일정이 확정되었습니다.

📅 상담일시: ${extra || "담당자 안내 예정"}
👤 담당매니저: ${_manager}
📞 연락처: ${_phone}

준비사항: 사업자등록증, 최근 3개월 매출 자료

궁금한 점은 언제든지 연락 주세요!
엠프론티어`,

    docs_request: `[엠프론티어] 서류 제출 안내

안녕하세요, ${name} 대표님!
신청하신 정책자금 상담 진행을 위해
아래 서류 제출을 부탁드립니다.

 필요 서류
• 사업자등록증
• 최근 3개월 매출내역
• 신분증 사본

서류 제출 후 빠르게 검토 도와드리겠습니다.

엠프론티어`,

    fund_apply: `[엠프론티어] 자금 신청 진행 안내

안녕하세요, ${name} 대표님!
정책자금 신청이 진행 중입니다.

💼 신청 자금: ${_amount}
📊 진행 단계: 신청서 접수 완료
⏰ 예상 결과: 영업일 3일 이내

진행 상황은 실시간으로 안내드리겠습니다.

담당자: ${_manager} (${_phone})
엠프론티어`,

    approved: `[엠프론티어] 정책자금 승인 완료!

${name} 대표님!
신청하신 정책자금 승인이 완료되었습니다.

💰 승인 자금: ${_amount}
✅ 승인 금액: ${_amount}
📅 집행 예정일: 담당자 안내 예정

담당자가 곧 연락드려 집행 절차를 안내해 드리겠습니다.

감사합니다.
엠프론티어`,

    consult_done: `[엠프론티어] 상담 종결 안내

안녕하세요, ${name} 대표님.
신청하신 상담이 종결 처리되었습니다.

이용해 주셔서 감사합니다.
추후 다시 필요하신 경우 언제든지 찾아주세요!

엠프론티어`,

    reserve_done: `[엠프론티어] 상담 예약 완료 안내

안녕하세요, ${name} 대표님!
예약하신 정책자금 무료 상담이 정상 접수되었습니다.

📋 접수번호: ${_id}
👤 담당자: ${_manager}

영업일 기준 1일 이내 연락드리겠습니다.

엠프론티어`,

    rejected: `[엠프론티어] 심사 결과 안내

안녕하세요, ${name} 대표님.
신청하신 정책자금 심사 결과를 안내드립니다.

💼 신청 자금: ${_amount}
📋 심사 결과: 미승인

미승인 사유와 재신청 가능 여부를 검토하여
담당자가 곧 연락드리겠습니다.

엠프론티어`,

    remind: `[엠프론티어] 상담 신청 확인 안내

안녕하세요, ${name} 대표님!
정책자금 무료 상담을 신청하셨는데
아직 연락이 닿지 않았습니다.

📞 담당자가 다시 연락드리겠습니다.
혹시 편한 연락 시간이 있으시면
아래 번호로 먼저 연락 주셔도 됩니다.

📞 엠프론티어 담당자: ${_phone}`,

    fund_execute: `[엠프론티어] 자금 집행 완료

축하드립니다, ${name} 대표님!
신청하신 정책자금 집행이 완료되었습니다.

💰 자금명: ${_amount}
✅ 집행 금액: ${_amount}
📅 집행일: 담당자 안내 완료

사후 관리 서비스는 1년간 무상으로 제공됩니다.
궁금한 점은 언제든지 연락 주세요!

엠프론티어`,

    extra_apply: `[엠프론티어] 재신청 가능 안내

안녕하세요, ${name} 대표님!
이전에 상담 신청하신 대표님께 재신청 가능 시기를 안내드립니다.

📅 재신청 가능일: 담당자 안내 예정
💼 추천 자금: ${_amount}

무료 상담으로 최적 자금을 찾아드리겠습니다!

엠프론티어`,

    review: `[엠프론티어] 소중한 후기 부탁드립니다

안녕하세요, ${name} 대표님!
정책자금 서비스를 이용해 주셔서 감사합니다.

대표님의 소중한 후기가 다른 사업자분들께
큰 도움이 됩니다 😊

⭐ 후기 남기기: ${extra || "담당자 링크 안내 예정"}

(소요 시간: 1분 이내)
감사합니다.
엠프론티어`,

    new_fund: `[엠프론티어] 신규 정책자금 출시 안내

안녕하세요, ${name} 대표님!
이전에 상담 신청하신 대표님께 맞는
신규 정책자금이 출시되었습니다.

💰 자금명: ${_amount}
✅ 한도: 담당자 안내 예정
📅 신청 마감: 담당자 안내 예정

⚠ 인기 자금은 빠르게 소진됩니다!
지금 바로 무료 상담 신청하세요.

엠프론티어`,
  };

  // 상태값 → templateType 매핑
  const statusMap: Record<string, string> = {
    "접수대기": "register",
    "상담예약": "consult_reserve",
    "서류요청": "docs_request",
    "신청진행": "fund_apply",
    "집행완료": "approved",
    "상담완료": "consult_done",
    "종결":     "reserve_done",
  };

  const key = statusMap[templateType] || templateType;
  return texts[key] || texts["register"];
}

const SUBJECT_MAP: Record<string, string> = {
  register:        "[엠프론티어] 상담 신청이 접수되었습니다",
  consult_reserve: "[엠프론티어] 상담 일정이 확정되었습니다",
  docs_request:    "[엠프론티어] 서류 제출을 안내드립니다",
  fund_apply:      "[엠프론티어] 정책자금 신청이 진행 중입니다",
  approved:        "[엠프론티어] 정책자금 승인이 완료되었습니다 🎉",
  consult_done:    "[엠프론티어] 상담이 종결되었습니다",
  reserve_done:    "[엠프론티어] 상담 예약이 완료되었습니다",
  rejected:        "[엠프론티어] 정책자금 심사 결과를 안내드립니다",
  remind:          "[엠프론티어] 상담 신청 확인 안내",
  fund_execute:    "[엠프론티어] 자금 집행이 완료되었습니다 🎊",
  extra_apply:     "[엠프론티어] 재신청 가능 안내",
  review:          "[엠프론티어] 소중한 후기를 부탁드립니다",
  new_fund:        "[엠프론티어] 신규 정책자금이 출시되었습니다",
  "접수대기":      "[엠프론티어] 상담 신청이 접수되었습니다",
  "상담예약":      "[엠프론티어] 상담 일정이 확정되었습니다",
  "서류요청":      "[엠프론티어] 서류 제출을 안내드립니다",
  "신청진행":      "[엠프론티어] 정책자금 신청이 진행 중입니다",
  "집행완료":      "[엠프론티어] 정책자금 승인이 완료되었습니다 🎉",
  "상담완료":      "[엠프론티어] 상담이 종결되었습니다",
  "종결":          "[엠프론티어] 상담 예약이 완료되었습니다",
};

export async function POST(req: NextRequest) {
  try {
    const { to, name, status, extra, id, manager, phone, biz, amount } = await req.json();
    if (!to || !name || !status) {
      return NextResponse.json({ ok: false, error: "필수 파라미터 누락" }, { status: 400 });
    }

    const bodyText = buildText(status, name, extra, id, manager, phone, biz, amount);
    const subject  = SUBJECT_MAP[status] || "[엠프론티어] 안내 말씀 드립니다";
    const html     = emailWrapper(bodyText);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `엠프론티어 <${FROM}>`,
        to: [to],
        subject,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
