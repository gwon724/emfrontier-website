import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_K1BDktGH_FDBBDFMfornqJXJWGqPDM2bE";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@emfrontier.team";

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ ok: false, error: "이름과 연락처를 입력해주세요." }, { status: 400 });
    }

    // 서버 DB에서 clientUsers 조회
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emfrontier.team";
    const dbRes = await fetch(`${baseUrl}/api/db?key=clientUsers`).then(r => r.json()).catch(() => ({ value: null }));
    const users: Array<{ name: string; phone: string; email?: string; password: string }> = dbRes.value || [];

    const cleanPhone = phone.replace(/-/g, "").replace(/\s/g, "");
    const user = users.find(u =>
      u.name === name.trim() &&
      (u.phone?.replace(/-/g, "").replace(/\s/g, "") === cleanPhone)
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "등록된 정보를 찾을 수 없습니다." });
    }

    if (!user.email) {
      return NextResponse.json({ ok: false, error: "등록된 이메일이 없습니다. 담당자에게 문의해주세요." });
    }

    // 임시 비밀번호 생성 및 업데이트
    const tempPw = generateTempPassword();
    const updatedUsers = users.map(u =>
      u.name === user.name && u.phone === user.phone
        ? { ...u, password: tempPw }
        : u
    );

    // 서버 DB 업데이트
    await fetch(`${baseUrl}/api/db`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "clientUsers", value: updatedUsers }),
    }).catch(() => {});

    // 이메일 발송
    const html = `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px; background: #f8fafc;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">🔐 임시 비밀번호 안내</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">엠프론티어 고객 포털</p>
          <p style="color: #334155; font-size: 15px;">${name} 대표님, 안녕하세요!</p>
          <p style="color: #334155; font-size: 15px; margin-bottom: 24px;">임시 비밀번호가 발급되었습니다. 로그인 후 반드시 비밀번호를 변경해주세요.</p>
          <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">임시 비밀번호</p>
            <p style="color: #1e293b; font-size: 28px; font-weight: 800; letter-spacing: 4px;">${tempPw}</p>
          </div>
          <a href="https://emfrontier.team/client" style="display: block; background: #2563eb; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">고객 포털 로그인하기</a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">본인이 요청하지 않은 경우 무시하셔도 됩니다.</p>
        </div>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: "[엠프론티어] 임시 비밀번호 안내",
        html,
      }),
    });

    const emailResult = await emailRes.json();
    if (emailResult.id) {
      return NextResponse.json({ ok: true, email: user.email.replace(/(.{2}).*(@.*)/, "$1***$2") });
    } else {
      return NextResponse.json({ ok: false, error: "이메일 발송에 실패했습니다." });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
