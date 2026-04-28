"use client";
import { useEffect, useRef, useState } from "react";
import {
  getAllConsultations,
  getAllAdmins,
  FONT,
  LOGO_B64,
  CONSULT_STATUS_LIST,
} from "@/lib/store";

const font = FONT;

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type DocStatus = "idle" | "sending" | "done" | "error";

interface DocItem {
  key: string;
  label: string;
  icon: string;
  status: DocStatus;
}

interface ExtraDoc {
  id: string;
  name: string;
  file: File | null;
  status: DocStatus;
}

// ─────────────────────────────────────────────
// 진행 단계 (타임라인 표시용)
// ─────────────────────────────────────────────
const PORTAL_STEPS = [
  "접수완료",
  "상담중",
  "서류진행",
  "심사중",
  "승인완료",
  "집행중",
  "사후관리",
];

// 승인 완료 이상 단계 (자금 카드 표시 기준)
const APPROVED_STEPS = ["승인완료", "집행중", "사후관리"];

function getStepIndex(status: string): number {
  const idx = PORTAL_STEPS.indexOf(status);
  if (idx !== -1) return idx;
  // legacy 매핑
  if (status === "서류요청") return PORTAL_STEPS.indexOf("서류진행");
  if (status === "승인진행") return PORTAL_STEPS.indexOf("승인완료");
  if (status === "자금집행") return PORTAL_STEPS.indexOf("집행중");
  return -1; // 접수대기 or 종결 등
}

// ─────────────────────────────────────────────
// 공통 스타일 상수
// ─────────────────────────────────────────────
const BG = "#0B1120";
const CARD_BG = "#1E293B";
const CARD_BORDER = "#334155";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const TEXT = "#F1F5F9";
const MUTED = "#94A3B8";

// ─────────────────────────────────────────────
// 서류 버튼 컴포넌트
// ─────────────────────────────────────────────
function DocButton({
  doc,
  onFileSelected,
}: {
  doc: DocItem;
  onFileSelected: (key: string, file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const bg =
    doc.status === "done"
      ? "#065F46"
      : doc.status === "error"
      ? "#7F1D1D"
      : "#1E293B";
  const border =
    doc.status === "done"
      ? "#10B981"
      : doc.status === "error"
      ? "#EF4444"
      : "#3B82F6";
  const label =
    doc.status === "sending"
      ? "⏳ 전송중..."
      : doc.status === "done"
      ? "✅ 전송완료"
      : doc.status === "error"
      ? "❌ 재시도"
      : `${doc.icon} ${doc.label}`;

  return (
    <>
      <input
        ref={ref}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(doc.key, f);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={doc.status === "sending"}
        style={{
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: "10px",
          color: "#fff",
          padding: "12px 10px",
          fontSize: "13px",
          fontWeight: "700",
          fontFamily: font,
          cursor: doc.status === "sending" ? "not-allowed" : "pointer",
          width: "100%",
          textAlign: "center",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        {label}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────
export default function MyPage() {
  // ── 로그인 상태 ──
  const [loggedIn, setLoggedIn] = useState(false);
  const [inputId, setInputId] = useState("");
  const [inputName, setInputName] = useState("");
  const [loginErr, setLoginErr] = useState("");

  // ── 상담 데이터 ──
  const [consultation, setConsultation] = useState<ReturnType<typeof getAllConsultations>[0] | null>(null);
  const [chatId, setChatId] = useState<string>("");

  // ── 서류 버튼 상태 ──
  const [docs, setDocs] = useState<DocItem[]>([
    { key: "사업자등록증", label: "사업자등록증", icon: "📄", status: "idle" },
    { key: "재무제표",     label: "재무제표",     icon: "📊", status: "idle" },
    { key: "부가세자료",   label: "부가세 자료",  icon: "🧾", status: "idle" },
    { key: "통장내역",     label: "통장내역",     icon: "🏦", status: "idle" },
  ]);
  const [financeDocs, setFinanceDocs] = useState<DocItem[]>([
    { key: "매출증빙",   label: "매출증빙",   icon: "📈", status: "idle" },
    { key: "세금신고서", label: "세금신고서", icon: "📋", status: "idle" },
  ]);
  const [bizDocs, setBizDocs] = useState<DocItem[]>([
    { key: "사업계획서",   label: "사업계획서",   icon: "📝", status: "idle" },
    { key: "자금사용계획", label: "자금사용계획", icon: "💰", status: "idle" },
  ]);
  const [extraDocs, setExtraDocs] = useState<ExtraDoc[]>([]);

  // ── 아코디언 ──
  const [financeOpen, setFinanceOpen] = useState(false);
  const [bizOpen, setBizOpen] = useState(false);

  // ── 전송 메시지 ──
  const [sendMsg, setSendMsg] = useState("");

  // ── 세션 복원 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("clientSession");
      if (!raw) return;
      const sess = JSON.parse(raw) as { id: string; name: string };
      if (sess.id && sess.name) restoreSession(sess.id, sess.name);
    } catch { /* ignore */ }
  }, []);

  function restoreSession(id: string, name: string) {
    const c = getAllConsultations().find(
      (x) => x.id === id && x.name === name
    );
    if (!c) return;
    setConsultation(c);
    const admin = getAllAdmins().find((a) => a.username === c.assignedTo);
    setChatId(admin?.telegramChatId || "");
    setLoggedIn(true);
  }

  // ── 로그인 ──
  function handleLogin() {
    setLoginErr("");
    if (!inputId.trim() || !inputName.trim()) {
      setLoginErr("접수번호와 이름을 모두 입력해주세요.");
      return;
    }
    const c = getAllConsultations().find(
      (x) => x.id === inputId.trim() && x.name === inputName.trim()
    );
    if (!c) {
      setLoginErr("일치하는 접수 정보를 찾을 수 없습니다.");
      return;
    }
    localStorage.setItem("clientSession", JSON.stringify({ id: c.id, name: c.name }));
    restoreSession(c.id, c.name);
  }

  // ── 로그아웃 ──
  function handleLogout() {
    localStorage.removeItem("clientSession");
    setLoggedIn(false);
    setConsultation(null);
    setChatId("");
    setInputId("");
    setInputName("");
  }

  // ── 파일 전송 공통 함수 ──
  async function sendFile(file: File, docName: string) {
    if (!consultation) return false;
    if (!chatId) {
      setSendMsg("❗ 담당자 텔레그램이 설정되지 않았습니다. 직접 연락해주세요.");
      setTimeout(() => setSendMsg(""), 4000);
      return false;
    }
    const fd = new FormData();
    fd.append("file", file, file.name);
    fd.append("chatId", chatId);
    fd.append("clientName", consultation.name);
    fd.append("consultationId", consultation.id);
    fd.append("docName", docName);
    try {
      const res = await fetch("/api/telegram-file", { method: "POST", body: fd });
      const json = await res.json();
      return json.ok === true;
    } catch {
      return false;
    }
  }

  // ── 공통/재무/사업 서류 파일 선택 핸들러 ──
  function makeFileHandler(
    setter: React.Dispatch<React.SetStateAction<DocItem[]>>
  ) {
    return async (key: string, file: File) => {
      setter((prev) =>
        prev.map((d) => (d.key === key ? { ...d, status: "sending" } : d))
      );
      const ok = await sendFile(file, key);
      setter((prev) =>
        prev.map((d) =>
          d.key === key ? { ...d, status: ok ? "done" : "error" } : d
        )
      );
      if (ok) {
        setSendMsg(`✅ [${key}] 서류가 담당자에게 전달되었습니다.`);
        setTimeout(() => setSendMsg(""), 3000);
      }
    };
  }

  // ── 추가서류 ──
  function addExtra() {
    setExtraDocs((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", file: null, status: "idle" },
    ]);
  }

  async function sendExtra(id: string) {
    const item = extraDocs.find((e) => e.id === id);
    if (!item || !item.file) return;
    const name = item.name.trim() || "기타서류";
    setExtraDocs((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "sending" } : e))
    );
    const ok = await sendFile(item.file, name);
    setExtraDocs((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: ok ? "done" : "error" } : e
      )
    );
    if (ok) {
      setSendMsg(`✅ [${name}] 서류가 담당자에게 전달되었습니다.`);
      setTimeout(() => setSendMsg(""), 3000);
    }
  }

  // ─────────────────────────────────────
  // 로그인 화면
  // ─────────────────────────────────────
  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font,
          padding: "20px",
        }}
      >
        <div
          style={{
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: "20px",
            padding: "40px 32px",
            width: "100%",
            maxWidth: "420px",
          }}
        >
          {/* 로고 */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_B64} alt="엠프론티어" style={{ height: "48px", objectFit: "contain" }} />
            <p style={{ color: MUTED, fontSize: "13px", marginTop: "8px" }}>고객 포털</p>
          </div>

          <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: "800", marginBottom: "8px", textAlign: "center" }}>
            진행 현황 조회
          </h2>
          <p style={{ color: MUTED, fontSize: "13px", textAlign: "center", marginBottom: "28px" }}>
            접수번호와 성함을 입력해주세요
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: MUTED, display: "block", marginBottom: "6px" }}>
                접수번호
              </label>
              <input
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="예: CON20260101-1234"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0F172A",
                  border: `1.5px solid ${CARD_BORDER}`,
                  borderRadius: "10px",
                  color: TEXT,
                  fontSize: "14px",
                  fontFamily: font,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: MUTED, display: "block", marginBottom: "6px" }}>
                성함
              </label>
              <input
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="신청 시 입력한 이름"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#0F172A",
                  border: `1.5px solid ${CARD_BORDER}`,
                  borderRadius: "10px",
                  color: TEXT,
                  fontSize: "14px",
                  fontFamily: font,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
            {loginErr && (
              <p style={{ color: "#EF4444", fontSize: "13px", fontWeight: "700", margin: 0 }}>
                ⚠️ {loginErr}
              </p>
            )}
            <button
              onClick={handleLogin}
              style={{
                marginTop: "8px",
                padding: "14px",
                background: BLUE,
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "800",
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              조회하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // 메인 화면 (로그인 후)
  // ─────────────────────────────────────
  if (!consultation) return null;

  const stepIdx = getStepIndex(consultation.status);
  const isApproved = APPROVED_STEPS.includes(consultation.status);

  const cardStyle: React.CSSProperties = {
    background: CARD_BG,
    border: `1px solid ${CARD_BORDER}`,
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
  };

  const sectionTitle: React.CSSProperties = {
    color: TEXT,
    fontSize: "15px",
    fontWeight: "800",
    marginBottom: "16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: font }}>
      {/* ── 헤더 ── */}
      <div
        style={{
          background: CARD_BG,
          borderBottom: `1px solid ${CARD_BORDER}`,
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_B64} alt="엠프론티어" style={{ height: "32px", objectFit: "contain" }} />
            <span style={{ color: MUTED, fontSize: "13px" }}>고객 포털</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: "8px",
              color: MUTED,
              fontSize: "12px",
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: font,
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* ── 진행 현황 카드 ── */}
        <div style={cardStyle}>
          <p style={{ color: MUTED, fontSize: "12px", marginBottom: "4px" }}>안녕하세요,</p>
          <p style={{ color: TEXT, fontSize: "20px", fontWeight: "800", marginBottom: "16px" }}>
            {consultation.name} 고객님 👋
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              ["📋 접수번호", consultation.id],
              ["🏢 업종", consultation.businessType],
              ["💰 희망금액", consultation.desiredAmount],
              ["👤 담당자", consultation.assignedName || "배정 대기"],
              ["📞 담당자 연락처", getAllAdmins().find(a => a.username === consultation.assignedTo)?.phone || "-"],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  background: "#0F172A",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <p style={{ color: MUTED, fontSize: "11px", marginBottom: "4px" }}>{label}</p>
                <p style={{ color: TEXT, fontSize: "13px", fontWeight: "700" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 진행 단계 타임라인 ── */}
        <div style={cardStyle}>
          <p style={sectionTitle}>🗺️ 진행 단계</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {PORTAL_STEPS.map((step, i) => {
              const isDone = stepIdx > i;
              const isCurrent = stepIdx === i;
              const isFuture = stepIdx < i;

              return (
                <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  {/* 아이콘 + 선 */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "24px", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "800",
                        flexShrink: 0,
                        background: isDone
                          ? GREEN
                          : isCurrent
                          ? BLUE
                          : "#1E293B",
                        border: isFuture
                          ? `1.5px solid ${CARD_BORDER}`
                          : "none",
                        color: isFuture ? MUTED : "#fff",
                        marginTop: "4px",
                      }}
                    >
                      {isDone ? "✓" : isCurrent ? "●" : "○"}
                    </div>
                    {i < PORTAL_STEPS.length - 1 && (
                      <div
                        style={{
                          width: "2px",
                          height: "32px",
                          background: isDone ? GREEN : CARD_BORDER,
                          marginTop: "2px",
                        }}
                      />
                    )}
                  </div>

                  {/* 텍스트 */}
                  <div style={{ paddingTop: "4px", paddingBottom: i < PORTAL_STEPS.length - 1 ? "6px" : "0" }}>
                    <p
                      style={{
                        fontSize: isCurrent ? "15px" : "13px",
                        fontWeight: isCurrent ? "800" : "500",
                        color: isDone ? GREEN : isCurrent ? BLUE : MUTED,
                        margin: 0,
                      }}
                    >
                      {step}
                      {isCurrent && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            background: BLUE,
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            verticalAlign: "middle",
                          }}
                        >
                          현재
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 접수대기 or 종결 케이스 */}
          {stepIdx === -1 && (
            <p style={{ color: MUTED, fontSize: "13px", marginTop: "12px" }}>
              현재 상태: <strong style={{ color: TEXT }}>{consultation.status}</strong>
            </p>
          )}
        </div>

        {/* ── 자금 정보 카드 (승인완료 이상) ── */}
        {isApproved && (
          <div style={{ ...cardStyle, border: `1px solid ${GREEN}` }}>
            <p style={sectionTitle}>🎉 승인 정보</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                ["📌 현재 단계", consultation.status],
                ["📅 마지막 업데이트", consultation.updatedAt || "-"],
              ].map(([label, val]) => (
                <div key={label} style={{ background: "#0F172A", borderRadius: "10px", padding: "12px" }}>
                  <p style={{ color: MUTED, fontSize: "11px", marginBottom: "4px" }}>{label}</p>
                  <p style={{ color: GREEN, fontSize: "13px", fontWeight: "700" }}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 서류 제출 섹션 ── */}
        <div style={cardStyle}>
          <p style={sectionTitle}>📁 서류 제출</p>

          {/* 전송 결과 알림 */}
          {sendMsg && (
            <div
              style={{
                background: sendMsg.startsWith("✅") ? "#052E1C" : "#450A0A",
                border: `1px solid ${sendMsg.startsWith("✅") ? GREEN : "#EF4444"}`,
                borderRadius: "10px",
                padding: "10px 14px",
                marginBottom: "16px",
                color: sendMsg.startsWith("✅") ? GREEN : "#EF4444",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              {sendMsg}
            </div>
          )}

          {/* 공통 서류 */}
          <p style={{ color: MUTED, fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
            ▪ 공통 서류
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {docs.map((doc) => (
              <DocButton key={doc.key} doc={doc} onFileSelected={makeFileHandler(setDocs)} />
            ))}
          </div>

          {/* 재무 섹션 아코디언 */}
          <button
            onClick={() => setFinanceOpen((v) => !v)}
            style={{
              width: "100%",
              background: "#0F172A",
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: "10px",
              color: TEXT,
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: font,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: financeOpen ? "10px" : "10px",
            }}
          >
            <span>📊 [재무] 서류</span>
            <span style={{ color: MUTED }}>{financeOpen ? "▲" : "▼"}</span>
          </button>
          {financeOpen && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              {financeDocs.map((doc) => (
                <DocButton key={doc.key} doc={doc} onFileSelected={makeFileHandler(setFinanceDocs)} />
              ))}
            </div>
          )}

          {/* 사업 섹션 아코디언 */}
          <button
            onClick={() => setBizOpen((v) => !v)}
            style={{
              width: "100%",
              background: "#0F172A",
              border: `1px solid ${CARD_BORDER}`,
              borderRadius: "10px",
              color: TEXT,
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: font,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: bizOpen ? "10px" : "10px",
            }}
          >
            <span>🏢 [사업] 서류</span>
            <span style={{ color: MUTED }}>{bizOpen ? "▲" : "▼"}</span>
          </button>
          {bizOpen && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              {bizDocs.map((doc) => (
                <DocButton key={doc.key} doc={doc} onFileSelected={makeFileHandler(setBizDocs)} />
              ))}
            </div>
          )}

          {/* 추가서류 섹션 */}
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: MUTED, fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
              ▪ 추가서류
            </p>
            {extraDocs.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#0F172A",
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "10px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    setExtraDocs((prev) =>
                      prev.map((x) =>
                        x.id === item.id ? { ...x, name: e.target.value } : x
                      )
                    )
                  }
                  placeholder="서류명 (비워두면 기타서류)"
                  style={{
                    flex: "1 1 140px",
                    padding: "9px 12px",
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: "8px",
                    color: TEXT,
                    fontSize: "13px",
                    fontFamily: font,
                    outline: "none",
                    minWidth: "0",
                  }}
                />
                <label
                  style={{
                    padding: "9px 14px",
                    background: CARD_BG,
                    border: `1.5px solid ${CARD_BORDER}`,
                    borderRadius: "8px",
                    color: item.file ? GREEN : MUTED,
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.file ? `📎 ${item.file.name.slice(0, 12)}…` : "파일 선택"}
                  <input
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setExtraDocs((prev) =>
                        prev.map((x) =>
                          x.id === item.id ? { ...x, file: f, status: "idle" } : x
                        )
                      );
                    }}
                  />
                </label>
                <button
                  onClick={() => sendExtra(item.id)}
                  disabled={!item.file || item.status === "sending" || item.status === "done"}
                  style={{
                    padding: "9px 16px",
                    background:
                      item.status === "done"
                        ? "#065F46"
                        : item.status === "error"
                        ? "#7F1D1D"
                        : BLUE,
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor:
                      !item.file || item.status === "sending" || item.status === "done"
                        ? "not-allowed"
                        : "pointer",
                    fontFamily: font,
                    whiteSpace: "nowrap",
                    opacity: !item.file ? 0.5 : 1,
                  }}
                >
                  {item.status === "sending"
                    ? "⏳..."
                    : item.status === "done"
                    ? "✅ 완료"
                    : item.status === "error"
                    ? "❌ 재시도"
                    : "전송"}
                </button>
                <button
                  onClick={() =>
                    setExtraDocs((prev) => prev.filter((x) => x.id !== item.id))
                  }
                  style={{
                    padding: "9px 12px",
                    background: "none",
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: "8px",
                    color: MUTED,
                    fontSize: "12px",
                    cursor: "pointer",
                    fontFamily: font,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={addExtra}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                border: `1.5px dashed ${CARD_BORDER}`,
                borderRadius: "10px",
                color: MUTED,
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: font,
              }}
            >
              + 추가서류 첨부
            </button>
          </div>
        </div>

        {/* ── 하단 연락처 ── */}
        <div
          style={{
            textAlign: "center",
            padding: "20px 0",
            color: MUTED,
            fontSize: "13px",
          }}
        >
          {consultation.assignedName && (
            <p style={{ marginBottom: "4px" }}>
              담당자: <strong style={{ color: TEXT }}>{consultation.assignedName}</strong>
            </p>
          )}
          {getAllAdmins().find(a => a.username === consultation.assignedTo)?.phone && (
            <p>
              📞 {getAllAdmins().find(a => a.username === consultation.assignedTo)?.phone}
            </p>
          )}
          <p style={{ marginTop: "12px", fontSize: "11px" }}>
            © 엠프론티어 · emfrontier.team
          </p>
        </div>
      </div>
    </div>
  );
}
