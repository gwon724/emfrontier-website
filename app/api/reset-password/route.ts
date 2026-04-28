import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_K1BDktGH_FDBBDFMfornqJXJWGqPDM2bE";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@emfrontier.team";
const DATA_DIR = path.join(process.cwd(), "data");

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

function readClientUsers() {
  const file = path.join(DATA_DIR, "clientUsers.json");
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { return []; }
}

function writeClientUsers(users: unknown[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "clientUsers.json"), JSON.stringify(users, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();
    if (!name || !phone) {
      return NextResponse.json({ ok: false, error: "이름과 연락처를 입력해주세요." }, { status: 400 });
    }

    const users: Array<{ name: string; phone: string; email?: string; password: string }> = readClientUsers();
    const cleanPhone = phone.replace(/-/g, "").replace(/\s/g, "");
    const user = users.find(u =>
      u.name === name.trim() &&
      (u.phone?.replace(/-/g, "").replace(/\s/g, "") === cleanPhone)
    );

    if (!user) {
      return NextResponse.json({ ok: false, error: "등록된 정보를 찾을 수 없습니다." });
    }

    // 임시 비밀번호 생성
    const tempPw = generateTempPassword();
    const updatedUsers = users.map(u =>
      u.name === user.name && u.phone === user.phone ? { ...u, password: tempPw, isTempPassword: true } : u
    );
    writeClientUsers(updatedUsers);

    // 카카오 알림톡 발송 (전화번호로)
    let kakaoSent = false;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://emfrontier.team";
      const alimRes = await fetch(`${baseUrl}/api/alimtalk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: { name: user.name, phone: user.phone, tempPassword: tempPw },
          templateType: "temp_password",
        }),
      });
      const alimData = await alimRes.json();
      kakaoSent = alimData.ok;
    } catch { kakaoSent = false; }

    // 이메일 발송 (등록된 이메일 있으면)
    let emailSent = false;
    if (user.email) {
      const html = `
        <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px; background: #f8fafc;">
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 8px;">🔐 임시 비밀번호 안내</h2>
            <p style="color: #334155; font-size: 15px;">${name} 대표님, 안녕하세요!</p>
            <p style="color: #334155; font-size: 15px; margin-bottom: 24px;">임시 비밀번호가 발급되었습니다. 로그인 후 반드시 비밀번호를 변경해주세요.</p>
            <div style="background: #f1f5f9; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">임시 비밀번호</p>
              <p style="color: #1e293b; font-size: 28px; font-weight: 800; letter-spacing: 4px;">${tempPw}</p>
            </div>
            <a href="https://emfrontier.team/client" style="display: block; background: #2563eb; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;">고객 포털 로그인하기</a>
          </div>
        </div>
      `;
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM_EMAIL, to: [user.email], subject: "[엠프론티어] 임시 비밀번호 안내", html }),
        });
        const emailData = await emailRes.json();
        emailSent = !!emailData.id;
      } catch { emailSent = false; }
    }

    if (kakaoSent || emailSent) {
      return NextResponse.json({
        ok: true,
        kakaoSent,
        emailSent,
        maskedEmail: user.email ? user.email.replace(/(.{2}).*(@.*)/, "$1***$2") : null,
      });
    } else {
      return NextResponse.json({ ok: false, error: "발송에 실패했습니다. 담당자에게 문의해주세요." });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
