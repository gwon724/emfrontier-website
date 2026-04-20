import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = process.env.RESEND_FROM || "noreply@emfrontier.team";

const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #F1F5F9; font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; }
  </style>
`;

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${baseStyle}
</head>
<body style="background:#F1F5F9; padding: 32px 16px;">
  <div style="max-width:580px; margin:0 auto;">
    <div style="background:#0B1120; border-radius:16px 16px 0 0; padding:32px 36px; text-align:center;">
      <p style="color:#60A5FA; font-size:12px; font-weight:700; letter-spacing:3px; margin-bottom:10px;">EMFRONTIER</p>
      <div style="width:40px; height:2px; background:#3B82F6; margin:0 auto 16px;"></div>
      <p style="color:#F1F5F9; font-size:13px; line-height:1.7; opacity:0.7;">정책자금 전문 컨설팅 · 경영컨설팅업 정식 등록 · 법인사업자</p>
    </div>
    <div style="background:#ffffff; padding:40px 36px;">
      ${content}
    </div>
    <div style="background:#0B1120; border-radius:0 0 16px 16px; padding:24px 36px; text-align:center;">
      <p style="color:#60A5FA; font-size:12px; font-weight:700; margin-bottom:8px;">EMFRONTIER</p>
      <p style="color:#475569; font-size:11px; line-height:1.8;">
        경영컨설팅업 정식 등록 · 법인사업자 2024년 설립<br/>
        본 메일은 수신만 가능한 메일입니다. 회신이 불가합니다.<br/>
        문의사항은 담당 컨설턴트에게 직접 연락해 주세요.
      </p>
      <p style="color:#334155; font-size:10px; margin-top:12px;">© 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved</p>
    </div>
  </div>
</body>
</html>
`;

const row = (icon: string, label: string, value: string) =>
  `<tr><td style="padding:8px 0; font-size:13px; color:#64748B; width:40px;">${icon}</td><td style="padding:8px 0; font-size:13px; color:#1E293B; font-weight:600;">${label}</td><td style="padding:8px 0; font-size:13px; color:#334155;">${value}</td></tr>`;

const infoTable = (rows: string) =>
  `<table style="width:100%; border-collapse:collapse; background:#F8FAFC; border-radius:12px; padding:16px 20px; margin:24px 0;" cellpadding="0" cellspacing="0"><tbody style="display:block; padding:16px 20px;">${rows}</tbody></table>`;

const divider = `<div style="height:1px; background:#E2E8F0; margin:24px 0;"></div>`;

const greeting = (name: string, body: string) =>
  `<p style="font-size:15px; color:#1E293B; line-height:2.0;">안녕하세요, <strong>${name} 대표님</strong>!<br/>${body}</p>`;

const footer = `${divider}<p style="font-size:13px; color:#94A3B8; line-height:1.8;">감사합니다.<br/><strong style="color:#3B82F6;">엠프론티어</strong></p>`;

function buildEmailHtml(templateType: string, name: string, extra?: string, id?: string, manager?: string, phone?: string, biz?: string, amount?: string): string {
  const _id = id || "-";
  const _manager = manager || "담당자";
  const _phone = phone || "담당자 연락처 확인";
  const _biz = biz || "-";
  const _amount = amount || "-";

  switch (templateType) {
    case "접수대기":
    case "register":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">상담 신청이 접수되었습니다 ✅</p>
        ${greeting(name, "상담 신청이 정상 접수되었습니다.")}
        ${infoTable(
          row("📋", "접수번호", _id) +
          row("💼", "업종", _biz) +
          row("💰", "희망금액", _amount)
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">담당 매니저가 영업일 1일 이내 연락드립니다.</p>
        ${footer}
      `);

    case "상담예약":
    case "consult_reserve":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">상담 일정이 확정되었습니다 📅</p>
        ${greeting(name, "상담 일정이 확정되었습니다.")}
        ${infoTable(
          row("📅", "상담일시", extra || "담당자 안내 예정") +
          row("👤", "담당매니저", _manager) +
          row("📞", "연락처", _phone)
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">준비사항: 사업자등록증, 최근 3개월 매출 자료<br/>궁금한 점은 언제든지 연락 주세요!</p>
        ${footer}
      `);

    case "서류요청":
    case "docs_request":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">서류 제출을 안내드립니다 📎</p>
        ${greeting(name, "신청하신 정책자금 상담 진행을 위해 아래 서류 제출을 부탁드립니다.")}
        ${infoTable(
          row("①", "필수 서류", "사업자등록증") +
          row("②", "", "최근 3개월 매출내역") +
          row("③", "", "신분증 사본")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">서류 제출 후 빠르게 검토 도와드리겠습니다.</p>
        ${footer}
      `);

    case "신청진행":
    case "fund_apply":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">자금 신청이 진행 중입니다 🔄</p>
        ${greeting(name, "정책자금 신청이 진행 중입니다.")}
        ${infoTable(
          row("💼", "신청 자금", _amount) +
          row("📊", "진행 단계", "신청서 접수 완료") +
          row("⏰", "예상 결과", "영업일 3일 이내")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">진행 상황은 실시간으로 안내드리겠습니다.<br/>담당자: ${_manager} (${_phone})</p>
        ${footer}
      `);

    case "집행완료":
    case "approved":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">정책자금 승인이 완료되었습니다 🎉</p>
        ${greeting(name, "신청하신 정책자금 승인이 완료되었습니다!")}
        ${infoTable(
          row("💰", "승인 자금", _amount) +
          row("✅", "승인 금액", _amount) +
          row("📅", "집행 예정일", "담당자 안내 예정")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">담당자가 곧 연락드려 집행 절차를 안내해 드리겠습니다.</p>
        ${footer}
      `);

    case "상담완료":
    case "consult_done":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">상담이 종결되었습니다</p>
        ${greeting(name, "신청하신 상담이 종결 처리되었습니다.")}
        <p style="font-size:14px; color:#475569; line-height:2.0; margin-top:16px;">이용해 주셔서 감사합니다.<br/>추후 다시 필요하신 경우 언제든지 찾아주세요!</p>
        ${footer}
      `);

    case "종결":
    case "reserve_done":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">상담 예약이 완료되었습니다 ✅</p>
        ${greeting(name, "예약하신 정책자금 무료 상담이 정상 접수되었습니다.")}
        ${infoTable(
          row("📋", "접수번호", _id) +
          row("👤", "담당자", _manager)
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">영업일 기준 1일 이내 연락드리겠습니다.</p>
        ${footer}
      `);

    case "rejected":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">심사 결과를 안내드립니다</p>
        ${greeting(name, "신청하신 정책자금 심사 결과를 안내드립니다.")}
        ${infoTable(
          row("💼", "신청 자금", _amount) +
          row("📋", "심사 결과", "미승인")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">미승인 사유와 재신청 가능 여부를 검토하여<br/>담당자가 곧 연락드리겠습니다.</p>
        ${footer}
      `);

    case "remind":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">상담 신청 확인 안내</p>
        ${greeting(name, "정책자금 무료 상담을 신청하셨는데 아직 연락이 닿지 않았습니다.")}
        <p style="font-size:14px; color:#475569; line-height:2.0; margin-top:16px;">📞 담당자가 다시 연락드리겠습니다.<br/>혹시 편한 연락 시간이 있으시면 아래 번호로 먼저 연락 주셔도 됩니다.<br/><br/><strong>엠프론티어 담당자: ${_phone}</strong></p>
        ${footer}
      `);

    case "fund_execute":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">자금 집행이 완료되었습니다 🎊</p>
        ${greeting(name, "신청하신 정책자금 집행이 완료되었습니다.")}
        ${infoTable(
          row("💰", "자금명", _amount) +
          row("✅", "집행 금액", _amount) +
          row("📅", "집행일", "담당자 안내 완료")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">사후 관리 서비스는 1년간 무상으로 제공됩니다.<br/>궁금한 점은 언제든지 연락 주세요!</p>
        ${footer}
      `);

    case "extra_apply":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">재신청 가능 안내 📅</p>
        ${greeting(name, "이전에 상담 신청하신 대표님께 재신청 가능 시기를 안내드립니다.")}
        ${infoTable(
          row("📅", "재신청 가능일", "담당자 안내 예정") +
          row("💼", "추천 자금", _amount)
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">무료 상담으로 최적 자금을 찾아드리겠습니다!</p>
        ${footer}
      `);

    case "review":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">소중한 후기를 부탁드립니다 ⭐</p>
        ${greeting(name, "정책자금 서비스를 이용해 주셔서 감사합니다.")}
        <p style="font-size:14px; color:#475569; line-height:2.0; margin-top:16px;">대표님의 소중한 후기가 다른 사업자분들께 큰 도움이 됩니다 😊<br/><br/>⭐ 후기 남기기: ${extra || "담당자 링크 안내 예정"}<br/><br/>(소요 시간: 1분 이내)</p>
        ${footer}
      `);

    case "new_fund":
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">신규 정책자금이 출시되었습니다 🆕</p>
        ${greeting(name, "이전에 상담 신청하신 대표님께 맞는 신규 정책자금이 출시되었습니다.")}
        ${infoTable(
          row("💰", "자금명", _amount) +
          row("✅", "한도", "담당자 안내 예정") +
          row("📅", "신청 마감", "담당자 안내 예정")
        )}
        <p style="font-size:14px; color:#475569; line-height:2.0;">⚠ 인기 자금은 빠르게 소진됩니다!<br/>지금 바로 무료 상담 신청하세요.</p>
        ${footer}
      `);

    default:
      return emailWrapper(`
        <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:16px;">안내 말씀 드립니다</p>
        ${greeting(name, extra || "담당자가 곧 연락드리겠습니다.")}
        ${footer}
      `);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, name, status, extra, id, manager, phone, biz, amount } = await req.json();
    if (!to || !name || !status) {
      return NextResponse.json({ ok: false, error: "필수 파라미터 누락" }, { status: 400 });
    }

    const SUBJECT_MAP: Record<string, string> = {
      "접수대기":  "[엠프론티어] 상담 신청이 접수되었습니다",
      "register":  "[엠프론티어] 상담 신청이 접수되었습니다",
      "상담예약":  "[엠프론티어] 상담 일정이 확정되었습니다",
      "consult_reserve": "[엠프론티어] 상담 일정이 확정되었습니다",
      "서류요청":  "[엠프론티어] 서류 제출을 안내드립니다",
      "docs_request": "[엠프론티어] 서류 제출을 안내드립니다",
      "신청진행":  "[엠프론티어] 정책자금 신청이 진행 중입니다",
      "fund_apply": "[엠프론티어] 정책자금 신청이 진행 중입니다",
      "집행완료":  "[엠프론티어] 정책자금 승인이 완료되었습니다 🎉",
      "approved":  "[엠프론티어] 정책자금 승인이 완료되었습니다 🎉",
      "상담완료":  "[엠프론티어] 상담이 종결되었습니다",
      "consult_done": "[엠프론티어] 상담이 종결되었습니다",
      "종결":      "[엠프론티어] 상담 예약이 완료되었습니다",
      "reserve_done": "[엠프론티어] 상담 예약이 완료되었습니다",
      "rejected":  "[엠프론티어] 정책자금 심사 결과를 안내드립니다",
      "remind":    "[엠프론티어] 상담 신청 확인 안내",
      "fund_execute": "[엠프론티어] 자금 집행이 완료되었습니다 🎊",
      "extra_apply": "[엠프론티어] 재신청 가능 안내",
      "review":    "[엠프론티어] 소중한 후기를 부탁드립니다",
      "new_fund":  "[엠프론티어] 신규 정책자금이 출시되었습니다",
    };

    const subject = SUBJECT_MAP[status] || "[엠프론티어] 안내 말씀 드립니다";
    const html = buildEmailHtml(status, name, extra, id, manager, phone, biz, amount);

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
