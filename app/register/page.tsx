"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  validateRegisterToken, markTokenUsed,
  LOGO_B64, FONT,
} from "@/lib/store";

const font = FONT;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenStr = params.get("token") || "";

  const [tokenData, setTokenData] = useState<{name: string; phone: string; consultationId: string} | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // 서버에서 토큰 검증
  useEffect(() => {
    if (!tokenStr) { setTokenChecked(true); return; }
    fetch(`/api/register-token?token=${tokenStr}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setTokenData({ name: d.name, phone: d.phone, consultationId: d.consultationId });
        setTokenChecked(true);
      })
      .catch(() => setTokenChecked(true));
  }, [tokenStr]);

  if (!tokenChecked) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748B", fontSize: "14px" }}>⏳ 링크 확인 중...</p>
      </div>
    );
  }

  if (!tokenStr || !tokenData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "32px 24px", maxWidth: "400px", width: "100%", textAlign: "center", border: "1px solid #334155" }}>
          <p style={{ fontSize: "32px", marginBottom: "16px" }}>⚠️</p>
          <p style={{ fontSize: "18px", fontWeight: "800", color: "#F1F5F9", marginBottom: "10px" }}>유효하지 않은 링크</p>
          <p style={{ fontSize: "14px", color: "#94A3B8" }}>링크가 만료되었거나 유효하지 않습니다.<br />담당 매니저에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) return setError("올바른 이메일을 입력해주세요");
    if (password.length < 6) return setError("비밀번호는 6자 이상이어야 합니다");
    if (password !== confirm) return setError("비밀번호가 일치하지 않습니다");

    setSubmitting(true);
    try {
      // 서버 DB에서 clientUsers 조회, 없으면 localStorage 폴백
      let clientUsers: Array<{id: string; name: string; phone: string; email?: string; password: string; createdAt: string}> = [];
      try {
        const dbRes = await fetch("/api/db?key=clientUsers").then(r => r.json());
        clientUsers = dbRes.value || JSON.parse(localStorage.getItem("clientUsers") || "[]");
      } catch {
        clientUsers = JSON.parse(localStorage.getItem("clientUsers") || "[]");
      }
      const idx = clientUsers.findIndex((u: { name: string; phone: string }) =>
        u.name === tokenData.name && u.phone === tokenData.phone
      );
      if (idx !== -1) {
        clientUsers[idx].password = password;
        clientUsers[idx].email = email;
      } else {
        clientUsers.push({
          id: Date.now().toString(),
          name: tokenData.name,
          phone: tokenData.phone,
          email,
          password,
          createdAt: new Date().toISOString(),
        });
      }
      localStorage.setItem("clientUsers", JSON.stringify(clientUsers));
      // 서버 DB 동기화
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "clientUsers", value: clientUsers }),
      }).catch(() => {});
      await fetch("/api/register-token", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({action:"use", token:tokenStr}) }).catch(()=>{});
      setDone(true);
      setTimeout(() => router.replace("/client"), 2000);
    } catch (e) {
      setError("오류가 발생했습니다: " + e);
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "32px 24px", maxWidth: "400px", width: "100%", textAlign: "center", border: "1px solid #10B981" }}>
          <p style={{ fontSize: "40px", marginBottom: "16px" }}>✅</p>
          <p style={{ fontSize: "18px", fontWeight: "800", color: "#34D399", marginBottom: "8px" }}>회원가입 완료!</p>
          <p style={{ fontSize: "14px", color: "#94A3B8" }}>잠시 후 포털로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
      <div style={{ backgroundColor: "#1E293B", borderRadius: "20px", padding: "36px 28px", maxWidth: "420px", width: "100%", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src={LOGO_B64} alt="엠프론티어" style={{ height: "40px", objectFit: "contain" }} />
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "8px" }}>고객 포털 회원가입</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 이름 (readonly) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>이름</label>
            <input
              value={tokenData.name}
              readOnly
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#64748B", fontFamily: font, boxSizing: "border-box" }}
            />
          </div>

          {/* 연락처 (readonly) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>연락처</label>
            <input
              value={tokenData.phone}
              readOnly
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#64748B", fontFamily: font, boxSizing: "border-box" }}
            />
          </div>

          {/* 이메일 */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>이메일 <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소 입력"
              required
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
            />
            <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>비밀번호 분실 시 임시 비밀번호 발송에 사용됩니다</p>
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>비밀번호 <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="6자 이상 입력"
              required
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>비밀번호 확인 <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="비밀번호 재입력"
              required
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: `1px solid ${confirm && confirm !== password ? "#EF4444" : "#334155"}`, borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
            />
            {confirm && confirm !== password && (
              <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>비밀번호가 일치하지 않습니다</p>
            )}
          </div>

          {error && (
            <div style={{ backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#FCA5A5" }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ width: "100%", padding: "14px", backgroundColor: submitting ? "#334155" : "#2563EB", color: "#FFF", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "800", cursor: submitting ? "not-allowed" : "pointer", fontFamily: font }}>
            {submitting ? "⏳ 처리 중..." : "✅ 회원가입 완료"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94A3B8", fontFamily: FONT }}>로딩 중...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
