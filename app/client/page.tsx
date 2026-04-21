"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAllConsultations, getAllUsers, upsertUser,
  LOGO_B64, FONT, CONSULT_STATUS_LIST,
  FUND_STATUS_LIST, FUND_STATUS_COLORS,
  Consultation,
} from "@/lib/store";

const font = FONT;

// 진행 단계 (접수대기/종결 제외)
const PROGRESS_STEPS = ["접수완료", "상담중", "서류진행", "심사중", "승인완료", "집행중", "사후관리"];

// 8단계 프로그레스 (부결/승인 = 최종)
const FUND_PROGRESS_STEPS = ["준비", "접수완료", "심사대기", "심사중", "심사완료", "자금집행"];

function getStepIndex(status: string) {
  const idx = PROGRESS_STEPS.indexOf(status);
  return idx; // -1 이면 해당 없음
}

function LoginView({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const users = getAllUsers();
      const user = users.find(u => u.name === name.trim() && u.password === password);
      if (!user) {
        setError("이름 또는 비밀번호가 올바르지 않습니다");
        setLoading(false);
        return;
      }
      localStorage.setItem("clientSession", JSON.stringify({ name: user.name }));
      onLogin(user.name);
    } catch {
      setError("로그인 중 오류가 발생했습니다");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
      <div style={{ backgroundColor: "#1E293B", borderRadius: "20px", padding: "36px 28px", maxWidth: "400px", width: "100%", border: "1px solid #334155", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src={LOGO_B64} alt="엠프론티어" style={{ height: "40px", objectFit: "contain" }} />
          <p style={{ fontSize: "16px", fontWeight: "800", color: "#F1F5F9", marginTop: "12px" }}>고객 포털</p>
          <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px" }}>진행 현황을 확인하세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "#94A3B8", display: "block", marginBottom: "6px" }}>이름</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름 입력"
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

  useEffect(() => {
    // 서버에서 최신 데이터 로드
    fetch("/api/db?key=consultations").then(r => r.json()).then(j => {
      if (j.value) localStorage.setItem("consultations", JSON.stringify(j.value));
    }).catch(() => {}).finally(() => {
      const all = getAllConsultations();
      const found = all.find(c => c.name === clientName);
      setConsult(found || null);
    });
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

            {/* 진행 단계 타임라인 — 자금별 */}
            {consult.funds && consult.funds.length > 0 ? (
              consult.funds.map(fund => {
                // 자금 상태 맵핑 → PROGRESS_STEPS 인덱스
                const FUND_TO_STEP: Record<string, number> = {
                  "준비":    -1, // 아무것도 도달하지 않음
                  "접수완료": 0,  // 접수완료
                  "심사대기": 3,  // 심사중
                  "심사중":  3,  // 심사중
                  "심사완료": 4,  // 승인완료
                  "자금집행": 5,  // 집행중
                  "승인":    4,  // 승인완료
                  "부결":    -2, // 부결(특수 표시)
                };
                const fundStepIdx = FUND_TO_STEP[fund.status] ?? -1;
                const isRejected = fund.status === "부결";
                return (
                  <div key={fund.id} style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
                    {/* 자금명 + 금액 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "800", color: "#F1F5F9", marginBottom: "2px" }}>{fund.fundName}</p>
                        {fund.amount && <p style={{ fontSize: "12px", color: "#94A3B8" }}>{fund.amount}만원</p>}
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", backgroundColor: `${FUND_STATUS_COLORS[fund.status] || "#94A3B8"}20`, color: FUND_STATUS_COLORS[fund.status] || "#94A3B8", fontSize: "11px", fontWeight: "800", border: `1px solid ${FUND_STATUS_COLORS[fund.status] || "#94A3B8"}40`, flexShrink: 0 }}>
                        {fund.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", marginBottom: "12px" }}>📍 진행 단계</p>
                    {isRejected ? (
                      <div style={{ backgroundColor: "#450A0A", borderRadius: "8px", padding: "10px 14px" }}>
                        <p style={{ fontSize: "13px", color: "#FCA5A5", fontWeight: "700" }}>❌ 이 자금은 부결 처리되었습니다</p>
                      </div>
                    ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: "4px" }}>
                      {PROGRESS_STEPS.map((step, i) => {
                        const done = fundStepIdx > i;
                        const current = fundStepIdx === i;
                        const color = done ? "#10B981" : current ? "#3B82F6" : "#334155";
                        return (
                          <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#FFF", fontWeight: "800", flexShrink: 0 }}>
                                {done ? "✓" : i + 1}
                              </div>
                              <span style={{ fontSize: "9px", color: current ? "#60A5FA" : done ? "#10B981" : "#475569", fontWeight: current ? "800" : "500", whiteSpace: "nowrap" }}>{step}</span>
                            </div>
                            {i < PROGRESS_STEPS.length - 1 && (
                              <div style={{ width: "20px", height: "2px", backgroundColor: done ? "#10B981" : "#1E293B", borderRadius: "1px", margin: "0 2px", marginBottom: "14px", flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })
            ) : (
              // 자금 없으면 기존 방식 (상담 전체 진행단계)
              <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", marginBottom: "12px" }}>📍 진행 단계</p>
                <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: "4px" }}>
                  {PROGRESS_STEPS.map((step, i) => {
                    const done = stepIdx > i;
                    const current = stepIdx === i;
                    const color = done ? "#10B981" : current ? "#3B82F6" : "#334155";
                    return (
                      <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#FFF", fontWeight: "800", flexShrink: 0 }}>
                            {done ? "✓" : i + 1}
                          </div>
                          <span style={{ fontSize: "9px", color: current ? "#60A5FA" : done ? "#10B981" : "#475569", fontWeight: current ? "800" : "500", whiteSpace: "nowrap" }}>{step}</span>
                        </div>
                        {i < PROGRESS_STEPS.length - 1 && (
                          <div style={{ width: "20px", height: "2px", backgroundColor: done ? "#10B981" : "#1E293B", borderRadius: "1px", margin: "0 2px", marginBottom: "14px", flexShrink: 0 }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 서류 제출 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", marginBottom: "14px", border: "1px solid #334155" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "14px" }}>📁 서류 제출</p>

              {/* 공통 서류 2열 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                {docBtn("사업자등록증", "📄")}
                {docBtn("재무제표", "📊")}
                {docBtn("부가세 자료", "🧾")}
                {docBtn("통장내역", "🏦")}
              </div>

              {/* 재무 아코디언 */}
              <button onClick={() => setShowFinance(p => !p)}
                style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "12px", fontWeight: "700", cursor: "pointer", textAlign: "left", fontFamily: font, marginBottom: "6px" }}>
                📈 재무 서류 {showFinance ? "▲" : "▼"}
              </button>
              {showFinance && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                  {docBtn("매출증빙", "📈")}
                  {docBtn("세금신고서", "📋")}
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
                </div>
              )}

              {/* 추가 서류 */}
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    value={extraDocName}
                    onChange={e => setExtraDocName(e.target.value)}
                    placeholder="서류명 입력"
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
