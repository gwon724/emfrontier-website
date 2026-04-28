"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAllConsultations, getAllUsers, upsertUser,
  LOGO_B64, FONT, CONSULT_STATUS_LIST,
  FUND_STATUS_LIST, FUND_STATUS_COLORS,
  Consultation, ConsultStatus,
} from "@/lib/store";

const font = FONT;

// 상담 진행단계 8단계
const PROGRESS_STEPS = ["접수대기", "접수완료", "상담중", "서류진행", "심사중", "승인완료", "집행중", "종결"];

// 자금별 진행단계 8단계
const FUND_PROGRESS_STEPS = ["접수대기", "접수완료", "심사대기", "심사중", "실사중", "승인", "부결", "보완"];

function getStepIndex(status: string) {
  const idx = PROGRESS_STEPS.indexOf(status);
  return idx; // -1 이면 해당 없음
}

function LoginView({ onLogin }: { onLogin: (name: string) => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState(""); // 이름은 비번찾기용으로만 사용
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 비밀번호 찾기
  const [showReset, setShowReset] = useState(false);
  const [resetName, setResetName] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");

  const handleReset = async () => {
    setResetError(""); setResetMsg("");
    if (!resetName || !resetPhone) { setResetError("이름과 연락처를 입력해주세요."); return; }
    setResetLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resetName, phone: resetPhone }),
      });
      const data = await res.json();
      if (data.ok) setResetMsg(`✅ ${data.email}로 임시 비밀번호를 발송했습니다.`);
      else setResetError(data.error || "오류가 발생했습니다.");
    } catch {
      setResetError("네트워크 오류가 발생했습니다.");
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 서버 DB 먼저 조회, 없으면 localStorage 폴백
      let users: Array<{name: string; phone?: string; password: string}> = [];
      try {
        const dbRes = await fetch("/api/db?key=clientUsers").then(r => r.json());
        users = dbRes.value || [];
        // localStorage도 동기화
        if (users.length > 0) localStorage.setItem("clientUsers", JSON.stringify(users));
      } catch {
        users = JSON.parse(localStorage.getItem("clientUsers") || "[]");
      }
      const user = users.find((u) => u.phone?.replace(/-/g,"") === phone.trim().replace(/-/g,"") && u.password === password.trim());
      if (!user) {
        setError("전화번호 또는 비밀번호가 올바르지 않습니다");
        setLoading(false);
        return;
      }
      localStorage.setItem("clientSession", JSON.stringify({ name: user.name, phone: user.phone || "" }));
      onLogin(user.name);
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
      <div style={{ backgroundColor: "#1E293B", borderRadius: "24px", padding: "40px 28px 36px", maxWidth: "400px", width: "100%", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", marginBottom: "16px" }}>
            <img src={LOGO_B64} alt="엠프론티어" style={{ width: "72px", height: "72px", objectFit: "contain" }} />
          </div>
          <p style={{ fontSize: "20px", fontWeight: "800", color: "#F1F5F9", margin: 0 }}>고객 포털</p>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "6px" }}>진행 현황을 확인하세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>전화번호</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="전화번호 입력 (예: 01012345678)"
              required
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
            />
          </div>
          {error && (
            <div style={{ backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
              <p style={{ fontSize: "13px", color: "#FCA5A5" }}>{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px", backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "800", cursor: "pointer", fontFamily: font }}>
            {loading ? "⏳ 로그인 중..." : "🔐 로그인"}
          </button>
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => { setShowReset(p => !p); setResetMsg(""); setResetError(""); }}
              style={{ background: "none", border: "none", fontSize: "12px", color: "#64748B", cursor: "pointer", fontFamily: font }}
            >
              비밀번호를 잊으셨나요? &nbsp;<span style={{ color: "#3B82F6", fontWeight: "700" }}>비밀번호 찾기</span>
            </button>
          </div>

          {/* 비밀번호 찾기 폼 */}
          {showReset && (
            <div style={{ marginTop: "16px", borderTop: "1px solid #334155", paddingTop: "16px" }}>
              <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "12px", textAlign: "center" }}>등록하신 이름과 연락처를 입력하세요.<br/>가입 시 등록한 이메일로 임시 비밀번호를 발송해드립니다.</p>
              <div style={{ marginBottom: "10px" }}>
                <input
                  value={resetName}
                  onChange={e => setResetName(e.target.value)}
                  placeholder="이름"
                  style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <input
                  value={resetPhone}
                  onChange={e => setResetPhone(e.target.value)}
                  placeholder="연락처 (010-0000-0000)"
                  style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              {resetError && <p style={{ color: "#EF4444", fontSize: "12px", marginBottom: "8px" }}>{resetError}</p>}
              {resetMsg && <p style={{ color: "#10B981", fontSize: "12px", marginBottom: "8px" }}>{resetMsg}</p>}
              <button
                onClick={handleReset}
                disabled={resetLoading}
                style={{ width: "100%", padding: "11px", backgroundColor: "#334155", color: "#F1F5F9", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: font }}
              >
                {resetLoading ? "⏳ 발송 중..." : "📧 임시 비밀번호 발송"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function PortalView({ clientName, onLogout }: { clientName: string; onLogout: () => void }) {
  const [consult, setConsult] = useState<Consultation | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, "idle"|"sending"|"done"|"error">>({});
  const [extraDocs, setExtraDocs] = useState<{id: string; name: string}[]>([]);
  const [extraDocName, setExtraDocName] = useState("");
  const [showFinance, setShowFinance] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  // 비밀번호 변경
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePwChange = () => {
    setPwError("");
    const users = JSON.parse(localStorage.getItem("clientUsers") || "[]");
    const consults = JSON.parse(localStorage.getItem("consultations") || "[]");
    const myConsult = consults.find((c: {name: string}) => c.name === clientName);
    const phone = myConsult?.phone || "";
    const idx = users.findIndex((u: {name: string; phone: string; password: string}) =>
      u.name === clientName && u.phone === phone
    );
    if (idx === -1) { setPwError("회원 정보를 찾을 수 없습니다."); return; }
    // 현재 비밀번호 없으면(처음 설정) 생략 가능
    if (users[idx].password && users[idx].password !== currentPw) {
      setPwError("현재 비밀번호가 일치하지 않습니다."); return;
    }
    if (newPw.length < 4) { setPwError("비밀번호는 4자 이상이어야 합니다."); return; }
    if (newPw !== confirmPw) { setPwError("새 비밀번호가 일치하지 않습니다."); return; }
    users[idx].password = newPw;
    localStorage.setItem("clientUsers", JSON.stringify(users));
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => { setPwSuccess(false); setShowPwChange(false); }, 2000);
  };

  // 담당자 telegramChatId 조회
  const [chatId, setChatId] = useState("");

  // 회원 정보 (users DB)
  const [userRecord, setUserRecord] = useState<import("@/lib/store").UserRecord | null>(null);

  useEffect(() => {
    // 서버에서 최신 데이터 로드 (localStorage 캐시 무효화)
    localStorage.removeItem("consultations");
    fetch("/api/db?key=consultations").then(r => r.json()).then(j => {
      if (j.value) {
        localStorage.setItem("consultations", JSON.stringify(j.value));
        const matched = (j.value as import("@/lib/store").Consultation[]).filter(c => c.name === clientName);
        const found = matched.sort((a,b) => b.id.localeCompare(a.id))[0] || null;
        setConsult(found);
      } else {
        setConsult(null);
      }
    }).catch(() => {
      setConsult(null);
    });
    // users DB에서 회원 정책자금 로드
    fetch("/api/db?key=users").then(r => r.json()).then(j => {
      if (j.value) {
        const clientPhone = (() => { try { return JSON.parse(localStorage.getItem("clientSession") || "{}").phone || ""; } catch { return ""; } })();
        const u = j.value.find((x: import("@/lib/store").UserRecord & {name?:string; phone?:string}) => clientPhone ? x.phone?.replace(/-/g,"") === clientPhone.replace(/-/g,"") : x.name === clientName);
        if (u) setUserRecord(u);
      }
    }).catch(() => {});
    fetch("/api/db?key=adminAccounts").then(r => r.json()).then(j => {
      if (j.value) {
        const admins: Array<{username: string; telegramChatId?: string}> = j.value;
        const c = getAllConsultations().find(c => c.name === clientName);
        if (c?.assignedTo) {
          const adm = admins.find(a => a.username === c.assignedTo);
          if (adm?.telegramChatId) setChatId(adm.telegramChatId);
        }
      }
    }).catch(() => {});
  }, [clientName]);

  const stepIdx = consult ? getStepIndex(consult.status) : -1;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleCancelConsult = async () => {
    if (!consult) return;
    setCancelLoading(true);
    try {
      const all = getAllConsultations();
      const updated = all.map(c => c.id === consult.id ? { ...c, status: "상담취소" as ConsultStatus } : c);
      await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "consultations", value: updated }) });
      localStorage.setItem("consultations", JSON.stringify(updated));
      setConsult(updated.find(c => c.id === consult.id) || null);
      setShowCancelModal(false);
      setCancelReason("");
    } catch { /* ignore */ }
    setCancelLoading(false);
  };

  const sendDoc = async (docName: string, file: File) => {
    setDocStatuses(p => ({ ...p, [docName]: "sending" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("chatId", chatId || "");
      fd.append("clientName", clientName);
      fd.append("consultationId", consult?.id || "");
      fd.append("docName", docName);
      const res = await fetch("/api/telegram-file", { method: "POST", body: fd });
      const data = await res.json();
      setDocStatuses(p => ({ ...p, [docName]: data.ok ? "done" : "error" }));
    } catch {
      setDocStatuses(p => ({ ...p, [docName]: "error" }));
    }
  };

  const handleDocClick = (docName: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await sendDoc(docName, file);
    };
    input.click();
  };

  const docBtn = (docName: string, icon: string) => {
    const st = docStatuses[docName] || "idle";
    return (
      <button
        key={docName}
        onClick={() => { if (st !== "sending") handleDocClick(docName); }}
        style={{
          padding: "12px 10px", backgroundColor: st === "done" ? "#052E1C" : st === "error" ? "#450A0A" : "#1E293B",
          border: `1px solid ${st === "done" ? "#10B981" : st === "error" ? "#EF4444" : "#334155"}`,
          borderRadius: "10px", color: st === "done" ? "#34D399" : st === "error" ? "#FCA5A5" : "#CBD5E1",
          fontSize: "12px", fontWeight: "700", cursor: st === "sending" ? "not-allowed" : "pointer",
          textAlign: "center" as const, fontFamily: font, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "4px",
        }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ fontSize: "11px" }}>
          {st === "sending" ? "⏳ 전송중..." : st === "done" ? "✅ 전송완료" : st === "error" ? "❌ 재시도" : docName}
        </span>
      </button>
    );
  };

  const fundProgressWidth = (status: string) => {
    if (status === "부결" || status === "승인" || status === "자금집행") return "100%";
    const idx = FUND_PROGRESS_STEPS.indexOf(status);
    if (idx < 0) return "0%";
    return `${Math.round((idx / (FUND_PROGRESS_STEPS.length - 1)) * 100)}%`;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", fontFamily: font }}>
      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "28px 24px", maxWidth: "360px", width: "100%", border: "1px solid #EF4444" }}>
            <p style={{ fontSize: "20px", marginBottom: "8px", textAlign: "center" }}>🚫</p>
            <p style={{ fontSize: "16px", fontWeight: "800", color: "#F1F5F9", textAlign: "center", marginBottom: "8px" }}>상담 취소 신청</p>
            <p style={{ fontSize: "13px", color: "#94A3B8", textAlign: "center", marginBottom: "20px", lineHeight: "1.6" }}>상담를 취소하면 진행 중인 자산 교섭이 충단됩니다.<br/>정말 취소하시겠습니까?</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="취소 사유 (선택 사항)"
              rows={3}
              style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", resize: "none", outline: "none", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                style={{ flex: 1, padding: "11px 0", backgroundColor: "transparent", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: font }}>
                돌아가기
              </button>
              <button onClick={handleCancelConsult} disabled={cancelLoading}
                style={{ flex: 1, padding: "11px 0", backgroundColor: "#EF4444", border: "none", borderRadius: "8px", color: "#FFF", fontSize: "13px", fontWeight: "800", cursor: "pointer", fontFamily: font, opacity: cancelLoading ? 0.6 : 1 }}>
                {cancelLoading ? "요청중..." : "취소 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <div style={{ backgroundColor: "#0F172A", borderBottom: "1px solid #1E293B", padding: "0 16px" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={LOGO_B64} alt="엠프론티어" style={{ height: "28px", objectFit: "contain" }} />
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#64748B" }}>고객 포털</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "#94A3B8" }}>{clientName} 님</span>
            <button onClick={onLogout}
              style={{ padding: "6px 12px", backgroundColor: "#1E293B", color: "#94A3B8", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontFamily: font }}>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px" }}>
        {!consult ? (
          <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "32px 20px", textAlign: "center", border: "1px solid #334155", marginTop: "20px" }}>
            <p style={{ fontSize: "32px", marginBottom: "12px" }}>📋</p>
            <p style={{ fontSize: "16px", fontWeight: "700", color: "#F1F5F9", marginBottom: "8px" }}>상담 내역이 없습니다</p>
            <p style={{ fontSize: "13px", color: "#64748B" }}>담당 매니저에게 상담을 신청해주세요.</p>
          </div>
        ) : (
          <>
            {/* 내 상담 정보 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "12px" }}>📋 내 상담 정보</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "접수번호", value: consult.id },
                  { label: "업종", value: consult.businessType || "-" },
                  { label: "희망금액", value: consult.desiredAmount || "-" },
                  { label: "현재 상태", value: consult.status },
                  { label: "담당 매니저", value: consult.assignedName || "배정 중" },
                ].map(item => (
                  <div key={item.label} style={{ backgroundColor: "#0F172A", borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "3px" }}>{item.label}</p>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#E2E8F0" }}>{item.value}</p>
                  </div>
                ))}
              </div>

            </div>

            {/* 회원 정책자금 목록 (admin에서 추가한 자금) */}
            {userRecord && ((userRecord as typeof userRecord & {funds?: Array<{id:string;fundName:string;amount:string;status:string;addedAt:string}>}).funds || []).filter(f => f.status !== "승인" && f.status !== "부결" && f.status !== "보완").length > 0 && (
              <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #1E3A8A" }}>
                <p style={{ fontSize: "14px", fontWeight: "800", color: "#60A5FA", marginBottom: "14px" }}>🏦 진행중인 정책자금</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {((userRecord as typeof userRecord & {funds?: Array<{id:string;fundName:string;amount:string;status:string;addedAt:string}>}).funds || []).filter(f => f.status !== "승인" && f.status !== "부결" && f.status !== "보완").map(f => (
                    <div key={f.id} style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px 14px", border: "1px solid #334155" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9" }}>{f.fundName}</p>
                          <p style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{f.amount}</p>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px",
                          backgroundColor: f.status === "승인완료" ? "#052E1C" : f.status === "부결" ? "#450A0A" : "#0F172A",
                          color: f.status === "승인완료" ? "#34D399" : f.status === "부결" ? "#EF4444" : "#60A5FA",
                          border: `1px solid ${f.status === "승인완료" ? "#166534" : f.status === "부결" ? "#DC2626" : "#1E3A8A"}` }}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 자금 현황 */}
            {(() => {
              type UF = {id:string;fundName:string;amount:string;status:string;addedAt:string};
              const approvedUser = ((userRecord as typeof userRecord & {funds?: UF[]})?.funds || []).filter(f => f.status === "승인");
              const approvedConsult = (consult.funds || []).filter(f => (f.status as string) === "승인");
              const allApproved = [...approvedUser, ...approvedConsult];
              if (allApproved.length === 0) return null;
              return (
                <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
                  <p style={{ fontSize: "14px", fontWeight: "800", color: "#94A3B8", marginBottom: "14px" }}>🏦 집행완료 정책자금</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {allApproved.map(fund => (
                      <div key={fund.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px 14px", border: "1px solid #334155" }}>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: "800", color: "#F1F5F9", marginBottom: "2px" }}>{fund.fundName}</p>
                          {fund.amount && <p style={{ fontSize: "12px", color: "#94A3B8" }}>{fund.amount}만원</p>}
                        </div>
                        <span style={{ padding: "4px 12px", borderRadius: "999px", backgroundColor: "#0F172A", color: "#94A3B8", fontSize: "12px", fontWeight: "800", flexShrink: 0, border: "1px solid #334155" }}>
                          집행완료
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 서류 제출 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "14px" }}>📁 서류 제출</p>

              {/* [필수] 8종 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                {docBtn("사업자등록증", "📄")}
                {docBtn("사업자등록증명", "📋")}
                {docBtn("신분증 사본", "🪪")}
                {docBtn("재무제표", "📊")}
                {docBtn("부가세 자료", "🧾")}
                {docBtn("통장내역", "🏦")}
                {docBtn("거래처 계약서/발주서", "🤝")}
                {docBtn("4대보험 가입자 명부", "🏢")}
              </div>

              {/* [필수 추가] */}
              <button onClick={() => setShowFinance(p => !p)}
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "left", fontFamily: font, marginBottom: "6px" }}>
                📋 증명서류 {showFinance ? "▲" : "▼"}
              </button>
              {showFinance && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                  {docBtn("국세 완납증명서", "🏛️")}
                  {docBtn("지방세 완납증명서", "🏛️")}
                  {docBtn("매출증빙", "📈")}
                  {docBtn("세금신고서", "📋")}
                  {docBtn("대출내역서(개인)", "💳")}
                  {docBtn("대출내역서(사업자)", "💳")}
                  {docBtn("KCB/NICE 점수", "📊")}
                </div>
              )}

              {/* 사업 아코디언 */}
              <button onClick={() => setShowBusiness(p => !p)}
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "left", fontFamily: font, marginBottom: "6px" }}>
                💼 사업 서류 {showBusiness ? "▲" : "▼"}
              </button>
              {showBusiness && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                  {docBtn("사업계획서", "📝")}
                  {docBtn("자금사용계획", "💰")}
                  {docBtn("공동인증서(개인/범용)", "🔐")}
                  {docBtn("계약서", "📑")}
                </div>
              )}

              {/* 추가 서류 */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    value={extraDocName}
                    onChange={e => setExtraDocName(e.target.value)}
                    placeholder="서류명 직접 입력"
                    style={{ flex: 1, padding: "10px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", fontFamily: font, outline: "none" }}
                  />
                  <button
                    onClick={() => {
                      if (!extraDocName.trim()) return;
                      setExtraDocs(p => [...p, { id: Date.now().toString(), name: extraDocName.trim() }]);
                      setExtraDocName("");
                    }}
                    style={{ padding: "10px 14px", backgroundColor: "#334155", color: "#CBD5E1", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}>
                    + 추가서류
                  </button>
                </div>
                {extraDocs.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {extraDocs.map(d => docBtn(d.name, "📎"))}
                  </div>
                )}
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginTop: "14px", border: "1px solid #334155" }}>
              <button
                onClick={() => { setShowPwChange(p => !p); setPwError(""); setPwSuccess(false); }}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#94A3B8", fontFamily: font }}>🔒 비밀번호 변경</span>
                <span style={{ color: "#64748B", fontSize: "12px" }}>{showPwChange ? "▲" : "▼"}</span>
              </button>
              {showPwChange && (
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "현재 비밀번호", value: currentPw, setter: setCurrentPw, placeholder: "현재 비밀번호 입력 (처음 설정이면 비워두세요)" },
                    { label: "새 비밀번호", value: newPw, setter: setNewPw, placeholder: "새 비밀번호 (4자 이상)" },
                    { label: "비밀번호 확인", value: confirmPw, setter: setConfirmPw, placeholder: "새 비밀번호 재입력" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "4px", fontFamily: font }}>{f.label}</label>
                      <input
                        type="password"
                        value={f.value}
                        onChange={e => f.setter(e.target.value)}
                        placeholder={f.placeholder}
                        onKeyDown={e => e.key === "Enter" && handlePwChange()}
                        style={{ width: "100%", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", color: "#F1F5F9", fontSize: "14px", fontFamily: font, boxSizing: "border-box", outline: "none" }}
                      />
                    </div>
                  ))}
                  {pwError && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{pwError}</p>}
                  {pwSuccess && <p style={{ color: "#10B981", fontSize: "12px", margin: 0 }}>✅ 비밀번호가 변경되었습니다!</p>}
                  <button
                    onClick={handlePwChange}
                    style={{ width: "100%", padding: "11px 0", backgroundColor: "#3B82F6", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: font }}
                  >
                    비밀번호 변경
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClientPortal() {
  const router = useRouter();
  const [clientName, setClientName] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("clientSession");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.name) setClientName(s.name);
      } catch { /* ignore */ }
    }
    setChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("clientSession");
    setClientName(null);
    router.refresh();
  };

  if (!checked) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94A3B8", fontFamily: FONT }}>로딩 중...</p>
      </div>
    );
  }

  if (!clientName) {
    return <LoginView onLogin={name => setClientName(name)} />;
  }

  return <PortalView clientName={clientName} onLogout={handleLogout} />;
}
