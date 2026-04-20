import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = process.env.RESEND_FROM || "noreply@emfrontier.studio";

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

    <!-- Header -->
    <div style="background:#0B1120; border-radius:16px 16px 0 0; padding:32px 36px; text-align:center;">
      <p style="color:#60A5FA; font-size:12px; font-weight:700; letter-spacing:3px; margin-bottom:10px;">EMFRONTIER LAB</p>
      <div style="width:40px; height:2px; background:#3B82F6; margin:0 auto 16px;"></div>
      <p style="color:#F1F5F9; font-size:13px; line-height:1.7; opacity:0.7;">정책자금 전문 컨설팅 · 경영컨설팅업 정식 등록 · 법인사업자</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff; padding:40px 36px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background:#0B1120; border-radius:0 0 16px 16px; padding:24px 36px; text-align:center;">
      <p style="color:#60A5FA; font-size:12px; font-weight:700; margin-bottom:8px;">EMFRONTIER LAB</p>
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

const divider = `<div style="height:1px; background:#E2E8F0; margin:28px 0;"></div>`;

const infoBox = (color: string, bgColor: string, icon: string, title: string, rows: string[]) => `
<div style="background:${bgColor}; border-left:4px solid ${color}; border-radius:8px; padding:20px 24px; margin:24px 0;">
  <p style="font-size:14px; font-weight:700; color:${color}; margin-bottom:12px;">${icon} ${title}</p>
  ${rows.map(r => `<p style="font-size:13px; color:#334155; line-height:2.0; margin:0;">${r}</p>`).join("")}
</div>
`;

const STATUS_TEMPLATES: Record<string, { subject: string; html: (name: string, extra?: string, date?: string) => string }> = {

  "접수대기": {
    subject: "[엠프론티어] 정책자금 상담 신청이 접수되었습니다",
    html: (name, extra, date) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">상담 신청이<br/>정상 접수되었습니다 ✅</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩을 찾아주셔서 진심으로 감사드립니다.<br/><br/>
        고객님께서 신청하신 <strong>정책자금 무료 상담</strong>이 정상적으로 접수되었음을 안내드립니다.
        저희 전문 컨설턴트가 고객님의 사업 현황을 꼼꼼히 검토한 후,
        가장 적합한 정책자금 솔루션을 제안드리기 위해 최선을 다하겠습니다.
      </p>
      ${infoBox("#3B82F6", "#EFF6FF", "📋", "접수 현황 안내", [
        "현재 상태 &nbsp;·&nbsp; <strong>접수 대기</strong>",
        "연락 예정 &nbsp;·&nbsp; 영업일 기준 <strong>1~2일 이내</strong> 담당자 연락",
        "상담 방식 &nbsp;·&nbsp; 전화 또는 비대면(화상) 상담 진행",
        "상담 비용 &nbsp;·&nbsp; <strong>완전 무료</strong> (미승인 시 착수금 100% 환불)",
      ])}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        상담에 앞서 아래 사항을 미리 준비해 두시면 더욱 정확하고 빠른 상담이 가능합니다.<br/><br/>
        &nbsp;&nbsp;· 사업자등록증 (개인 또는 법인)<br/>
        &nbsp;&nbsp;· 최근 매출 현황 (월별 매출 또는 연매출 기준)<br/>
        &nbsp;&nbsp;· 현재 보유 대출 현황 (있는 경우)<br/>
        &nbsp;&nbsp;· NICE 또는 KCB 신용점수 (대략적인 수준도 무관)
      </p>
      ${extra ? `${divider}<div style="background:#F8FAFC; border-radius:8px; padding:16px 20px;"><p style="font-size:13px; color:#64748B; line-height:1.8;">💬 담당자 메모: ${extra}</p></div>` : ""}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        궁금하신 사항이 있으시면 담당 컨설턴트에게 언제든지 연락해 주세요.<br/>
        고객님의 사업이 더욱 성장할 수 있도록 엠프론티어랩이 함께하겠습니다. 😊
      </p>
    `),
  },

  "상담예약": {
    subject: "[엠프론티어] 상담 일정이 확정되었습니다",
    html: (name, extra, date) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">상담 일정이<br/>확정되었습니다 📅</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩 전문 컨설턴트입니다.<br/><br/>
        고객님과의 정책자금 상담 일정이 <strong>공식적으로 확정</strong>되었습니다.
        상담 당일 편안한 마음으로 참여해 주시면 됩니다.
        저희가 미리 고객님의 상황에 맞는 최적의 자금 솔루션을 준비해 두겠습니다.
      </p>
      ${infoBox("#22C55E", "#F0FDF4", "📅", "상담 일정 안내", [
        `예약 일시 &nbsp;·&nbsp; <strong>${date || (extra || "담당자가 별도 안내드릴 예정입니다")}</strong>`,
        "상담 방식 &nbsp;·&nbsp; 비대면 전화 또는 화상 상담",
        "소요 시간 &nbsp;·&nbsp; 약 20~40분 예정",
        "상담 비용 &nbsp;·&nbsp; <strong>완전 무료</strong>",
      ])}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        <strong>상담 전 준비사항</strong><br/><br/>
        &nbsp;&nbsp;· 사업자등록증 (지참 또는 사진 촬영 준비)<br/>
        &nbsp;&nbsp;· 최근 3개월 매출 현황 자료<br/>
        &nbsp;&nbsp;· 현재 대출 현황 (금액, 금융기관명)<br/>
        &nbsp;&nbsp;· 신용점수 (NICE 또는 KCB 기준)<br/><br/>
        일정 변경이 필요하신 경우, <strong>상담 하루 전까지</strong> 담당 컨설턴트에게 미리 연락 주시면 감사하겠습니다.
      </p>
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        상담을 통해 고객님께 꼭 맞는 정책자금을 찾아드리겠습니다.<br/>
        좋은 결과로 뵙겠습니다! 💪
      </p>
    `),
  },

  "서류요청": {
    subject: "[엠프론티어] 정책자금 신청을 위한 서류 제출을 요청드립니다",
    html: (name, extra) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">서류 제출을<br/>요청드립니다 📎</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩 담당 컨설턴트입니다.<br/><br/>
        고객님의 정책자금 신청을 본격적으로 진행하기 위해
        <strong>필요 서류 제출</strong>을 안내드립니다.
        아래 서류를 준비하시어 담당 컨설턴트에게 전달해 주시면
        신속하게 다음 단계로 진행하겠습니다.
      </p>
      ${infoBox("#F59E0B", "#FFFBEB", "📎", "필수 제출 서류 목록", [
        "① &nbsp;사업자등록증 사본",
        "② &nbsp;최근 3개월 매출 내역 (카드매출확인서 또는 세금계산서)",
        "③ &nbsp;신분증 사본 (대표자)",
        "④ &nbsp;통장 사본 (사업용 또는 대표자 개인)",
        "⑤ &nbsp;임대차계약서 (사업장 해당 시)",
      ])}
      ${infoBox("#64748B", "#F8FAFC", "📌", "서류 제출 방법", [
        "카카오톡 &nbsp;·&nbsp; 담당 컨설턴트에게 직접 전송",
        "이메일 &nbsp;·&nbsp; 담당자 이메일로 첨부 파일 전송",
        "사진 촬영 &nbsp;·&nbsp; 스마트폰으로 선명하게 촬영 후 전송",
      ])}
      ${extra ? `${divider}<div style="background:#F8FAFC; border-radius:8px; padding:16px 20px;"><p style="font-size:13px; color:#64748B; line-height:1.8;">💬 담당자 추가 안내: ${extra}</p></div>` : ""}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        서류 준비가 어려우신 경우 담당 컨설턴트에게 먼저 연락 주시면
        대체 서류 또는 간소화 방법을 안내해 드리겠습니다.<br/><br/>
        고객님의 빠른 자금 집행을 위해 최선을 다하겠습니다. 감사합니다.
      </p>
    `),
  },

  "신청진행": {
    subject: "[엠프론티어] 정책자금 신청이 진행 중입니다",
    html: (name, extra) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">자금 신청이<br/>진행 중입니다 🔄</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩 담당 컨설턴트입니다.<br/><br/>
        고객님의 정책자금 신청 서류가 모두 완비되어
        현재 <strong>기관 심사가 진행 중</strong>임을 알려드립니다.
        저희 컨설턴트가 신청 과정 전반을 꼼꼼히 모니터링하고 있으니
        안심하고 결과를 기다려 주시기 바랍니다.
      </p>
      ${infoBox("#3B82F6", "#EFF6FF", "🔄", "신청 진행 현황", [
        "현재 상태 &nbsp;·&nbsp; <strong>기관 심사 진행 중</strong>",
        "심사 기간 &nbsp;·&nbsp; 통상 <strong>7~14 영업일</strong> 소요 (기관에 따라 상이)",
        "결과 통보 &nbsp;·&nbsp; 심사 결과 확인 즉시 고객님께 연락드립니다",
        "추가 요청 &nbsp;·&nbsp; 기관 추가 서류 요청 시 즉시 안내드립니다",
      ])}
      ${extra ? `${divider}<div style="background:#F8FAFC; border-radius:8px; padding:16px 20px;"><p style="font-size:13px; color:#64748B; line-height:1.8;">💬 진행 사항: ${extra}</p></div>` : ""}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        심사 진행 중에는 <strong>신용조회나 추가 대출 신청을 자제</strong>해 주시면
        승인에 더욱 유리합니다.<br/><br/>
        궁금하신 사항이나 불안하신 점이 있으시면 언제든지 담당 컨설턴트에게
        연락 주세요. 항상 빠르게 응대해 드리겠습니다. 😊
      </p>
    `),
  },

  "상담완료": {
    subject: "[엠프론티어] 정책자금 신청이 완료되었습니다 🎉",
    html: (name, extra) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">자금 신청이<br/>완료되었습니다 🎉</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩 담당 컨설턴트입니다.<br/><br/>
        고객님의 정책자금 상담 및 신청이 <strong>성공적으로 완료</strong>되었습니다!
        처음 신청하신 순간부터 최종 완료까지 믿고 맡겨주셔서 진심으로 감사드립니다.
        고객님의 사업이 이번 자금을 발판으로 더욱 크게 성장하시길 진심으로 응원합니다.
      </p>
      ${infoBox("#22C55E", "#F0FDF4", "🎉", "완료 내역 안내", [
        "상태 &nbsp;·&nbsp; <strong>상담 및 신청 완료</strong>",
        `${extra ? `결과 &nbsp;·&nbsp; <strong>${extra}</strong>` : "자금 집행 &nbsp;·&nbsp; 담당자가 별도 안내드릴 예정입니다"}`,
        "사후 관리 &nbsp;·&nbsp; 자금 집행 후 <strong>1년간 무상 사후 관리</strong> 서비스 제공",
        "재신청 &nbsp;·&nbsp; 추가 자금이 필요하실 때 언제든지 연락 주세요",
      ])}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        <strong>앞으로도 엠프론티어랩이 함께합니다.</strong><br/><br/>
        자금 집행 이후에도 궁금하신 사항이나 추가적인 자금이 필요하신 경우,
        언제든지 편하게 연락 주세요.<br/>
        매일 업데이트되는 300여 가지 정책자금 중 고객님께 가장 유리한 상품을
        지속적으로 모니터링하고 안내해 드리겠습니다.<br/><br/>
        다시 한번 진심으로 감사드립니다. 고객님의 사업 번창을 응원합니다! 🌟
      </p>
    `),
  },

  "종결": {
    subject: "[엠프론티어] 상담이 종결되었습니다",
    html: (name, extra) => emailWrapper(`
      <p style="font-size:22px; font-weight:900; color:#0B1120; margin-bottom:6px;">상담이<br/>종결되었습니다</p>
      ${divider}
      <p style="font-size:15px; color:#1E293B; line-height:2.0;">
        <strong>${name} 고객님</strong>, 안녕하세요.<br/>
        엠프론티어랩 담당 컨설턴트입니다.<br/><br/>
        고객님의 이번 정책자금 상담이 종결 처리되었음을 안내드립니다.
        상담 과정에서 불편하셨던 점이 있으셨다면 진심으로 사과드리며,
        저희와 함께해 주신 시간에 감사드립니다.
      </p>
      ${extra ? infoBox("#64748B", "#F8FAFC", "💬", "안내 사항", [extra]) : ""}
      ${infoBox("#64748B", "#F8FAFC", "📌", "재상담 안내", [
        "추후 정책자금이 필요하신 경우 언제든지 재신청하실 수 있습니다.",
        "고객님의 사업 상황이 변경되시면 새로운 자금 솔루션을 찾아드리겠습니다.",
        "신용점수나 매출 개선 후 재신청 시 더 유리한 조건의 자금을 받으실 수 있습니다.",
      ])}
      ${divider}
      <p style="font-size:14px; color:#475569; line-height:2.0;">
        비록 이번에는 아쉬운 결과가 되었지만,
        포기하지 마시고 다시 도전하실 때 저희 엠프론티어랩이 더욱 철저히 준비하여
        좋은 결과를 만들어 드리겠습니다.<br/><br/>
        항상 대표님의 사업을 응원합니다. 감사합니다. 🙏
      </p>
    `),
  },
};

export async function POST(req: NextRequest) {
  try {
    const { to, name, status, extra, date } = await req.json();
    if (!to || !name || !status) {
      return NextResponse.json({ ok: false, error: "필수 파라미터 누락" }, { status: 400 });
    }
    const tmpl = STATUS_TEMPLATES[status];
    if (!tmpl) {
      return NextResponse.json({ ok: false, error: "지원하지 않는 상태" }, { status: 400 });
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `엠프론티어 <${FROM}>`,
        to: [to],
        subject: tmpl.subject,
        html: tmpl.html(name, extra, date),
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
