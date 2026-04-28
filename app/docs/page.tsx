"use client";
import { useState, useRef } from "react";
import { getAllConsultations, FONT } from "@/lib/store";

const font = FONT;

const DOC_GROUPS = [
  {
    section: "📋 필수 서류",
    color: "#3B82F6",
    items: [
      { name: "사업자등록증", icon: "📄" },
      { name: "사업자등록증명", icon: "📋" },
      { name: "신분증 사본", icon: "🪪" },
      { name: "재무제표", icon: "📊" },
      { name: "부가세 자료", icon: "🧾" },
      { name: "통장내역", icon: "🏦" },
      { name: "거래처 계약서/발주서", icon: "🤝" },
      { name: "4대보험 가입자 명부", icon: "🏢" },
      { name: "국세 완납증명서", icon: "🏛️" },
      { name: "지방세 완납증명서", icon: "🏛️" },
    ],
  },
  {
    section: "📈 재무 서류",
    color: "#F59E0B",
    items: [
      { name: "매출증빙", icon: "📈" },
      { name: "세금신고서", icon: "📋" },
      { name: "대출내역서(개인)", icon: "💳" },
      { name: "대출내역서(사업자)", icon: "💳" },
      { name: "KCB/NICE 점수", icon: "📊" },
    ],
  },
  {
    section: "💼 사업 서류",
    color: "#10B981",
    items: [
      { name: "사업계획서", icon: "📝" },
      { name: "자금사용계획", icon: "💰" },
    ],
  },
  {
    section: "🔐 추가 서류",
    color: "#A78BFA",
    items: [
      { name: "공동인증서(개인/범용)", icon: "🔐" },
      { name: "계약서", icon: "📑" },
    ],
  },
];

type DocStatus = "idle" | "sending" | "done" | "error";

export default function DocsPage() {
  const [phone, setPhone] = useState("");
  const [clientInfo, setClientInfo] = useState<{
    name: string; consultId: string; assignedName: string;
  } | null>(null);
  const [chatId, setChatId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>({});
  const [extraDocName, setExtraDocName] = useState("");
  const [extraDocs, setExtraDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDoc, setPendingDoc] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const searchClient = async () => {
    setSearchError("");
    setSearching(true);
    setClientInfo(null);
    setChatId("");
    setDocStatuses({});
    try {
      // 서버에서 최신 상담 데이터 로드
      let consultations = getAllConsultations();
      try {
        const r = await fetch("/api/db?key=consultations").then(res => res.json());
        if (r.value) consultations = r.value;
      } catch {}

      const clean = phone.replace(/-/g, "").trim();
      const found = consultations.find((c: {phone?:string}) => c.phone?.replace(/-/g, "") === clean);
      if (!found) {
        setSearchError("해당 번호로 등록된 고객이 없습니다.");
        setSearching(false);
        return;
      }

      // 담당자 텔레그램 ID 조회
      const adminsRes = await fetch("/api/db?key=adminAccounts").then(r => r.json()).catch(() => ({ value: [] }));
      const admins: Array<{ username: string; name: string; telegramChatId?: string }> = adminsRes.value || [];
      const adm = admins.find(a => a.username === found.assignedTo);

      setClientInfo({
        name: found.name,
        consultId: found.id,
        assignedName: found.assignedName || adm?.name || "담당자",
      });

      if (adm?.telegramChatId) {
        setChatId(adm.telegramChatId);
      } else {
        setSearchError("⚠️ 담당 매니저 연락처를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleDocClick = (docName: string) => {
    if (!chatId) {
      alert("담당 매니저 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setPendingDoc(docName);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDoc || !clientInfo) return;

    setDocStatuses(p => ({ ...p, [pendingDoc]: "sending" }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("chatId", chatId);
      fd.append("clientName", clientInfo.name);
      fd.append("consultationId", clientInfo.consultId);
      fd.append("docName", pendingDoc);
      const res = await fetch("/api/telegram-file", { method: "POST", body: fd });
      const data = await res.json();
      setDocStatuses(p => ({ ...p, [pendingDoc]: data.ok ? "done" : "error" }));
    } catch {
      setDocStatuses(p => ({ ...p, [pendingDoc]: "error" }));
    }
    setPendingDoc("");
  };

  const DocButton = ({ name, icon }: { name: string; icon: string }) => {
    const st = docStatuses[name] || "idle";
    const borderColor = st === "done" ? "#10B981" : st === "error" ? "#EF4444" : st === "sending" ? "#F59E0B" : "#334155";
    const bgColor = st === "done" ? "#052E1C" : st === "error" ? "#450A0A" : "#1E293B";
    const textColor = st === "done" ? "#34D399" : st === "error" ? "#FCA5A5" : "#CBD5E1";
    const displayIcon = st === "done" ? "✅" : st === "error" ? "❌" : st === "sending" ? "⏳" : icon;

    return (
      <button
        onClick={() => handleDocClick(name)}
        disabled={st === "sending"}
        style={{
          padding: "18px 8px",
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "14px",
          cursor: st === "sending" ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          fontFamily: font,
          transition: "all 0.15s",
          WebkitTapHighlightColor: "transparent",
        }}
        onMouseEnter={e => { if (st === "idle") e.currentTarget.style.borderColor = "#60A5FA"; }}
        onMouseLeave={e => { if (st === "idle") e.currentTarget.style.borderColor = "#334155"; }}
      >
        <span style={{ fontSize: "26px" }}>{displayIcon}</span>
        <span style={{ fontSize: "12px", fontWeight: "700", color: textColor, textAlign: "center", lineHeight: "1.4" }}>{name}</span>
      </button>
    );
  };

  const toggleSection = (sec: string) => setOpenSections(p => ({ ...p, [sec]: !p[sec] }));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", fontFamily: font, color: "#F1F5F9" }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: "#1E293B", borderBottom: "1px solid #334155", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "32px", height: "32px", backgroundColor: "#1D4ED8", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📁</div>
        <div>
          <p style={{ fontSize: "15px", fontWeight: "900", color: "#F1F5F9", margin: 0 }}>서류 제출</p>
          <p style={{ fontSize: "11px", color: "#64748B", margin: 0 }}>엠프론티어</p>
        </div>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px" }}>

        {/* 전화번호 입력 */}
        {!clientInfo ? (
          <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", border: "1px solid #334155", padding: "24px 20px" }}>
            <p style={{ fontSize: "15px", fontWeight: "800", color: "#F1F5F9", marginBottom: "6px" }}>📞 본인 확인</p>
            <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "20px" }}>등록하신 전화번호를 입력해주세요</p>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchClient()}
              placeholder="010-0000-0000"
              style={{
                width: "100%", padding: "14px 16px", backgroundColor: "#0F172A",
                border: "1px solid #334155", borderRadius: "10px", fontSize: "16px",
                color: "#F1F5F9", fontFamily: font, outline: "none", boxSizing: "border-box",
                marginBottom: "12px",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#3B82F6"}
              onBlur={e => e.currentTarget.style.borderColor = "#334155"}
            />
            {searchError && (
              <p style={{ fontSize: "13px", color: "#FCA5A5", marginBottom: "12px" }}>{searchError}</p>
            )}
            <button
              onClick={searchClient}
              disabled={searching || !phone.trim()}
              style={{
                width: "100%", padding: "14px", backgroundColor: searching ? "#334155" : "#1D4ED8",
                color: "#FFF", border: "none", borderRadius: "10px", fontSize: "15px",
                fontWeight: "700", cursor: searching ? "not-allowed" : "pointer", fontFamily: font,
              }}
            >
              {searching ? "조회 중..." : "확인"}
            </button>
          </div>
        ) : (
          <>
            {/* 고객 확인 카드 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "14px", border: "1px solid #334155", padding: "16px 18px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "16px", fontWeight: "900", color: "#F1F5F9", margin: 0 }}>{clientInfo.name} 대표님</p>
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>담당 매니저: {clientInfo.assignedName}</p>
              </div>
              <button
                onClick={() => { setClientInfo(null); setPhone(""); setDocStatuses({}); setSearchError(""); }}
                style={{ fontSize: "12px", color: "#64748B", background: "none", border: "1px solid #334155", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontFamily: font }}
              >
                변경
              </button>
            </div>

            {/* 서류 제출 */}
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", border: "1px solid #334155", padding: "18px" }}>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#64748B", marginBottom: "16px" }}>📁 서류 제출</p>

              {DOC_GROUPS.map((group, gi) => {
                const isFirst = gi === 0;
                const isOpen = isFirst || !!openSections[group.section];
                return (
                  <div key={group.section} style={{ marginBottom: "14px" }}>
                    {/* 섹션 헤더 (첫번째는 항상 표시) */}
                    {!isFirst && (
                      <button
                        onClick={() => toggleSection(group.section)}
                        style={{
                          width: "100%", padding: "10px 14px", backgroundColor: "#0F172A",
                          border: `1px solid #334155`, borderRadius: "8px",
                          color: group.color, fontSize: "12px", fontWeight: "700",
                          cursor: "pointer", textAlign: "left", fontFamily: font,
                          marginBottom: isOpen ? "10px" : "0", display: "flex", justifyContent: "space-between",
                        }}
                      >
                        <span>{group.section}</span>
                        <span style={{ color: "#64748B" }}>{isOpen ? "▲" : "▼"}</span>
                      </button>
                    )}
                    {(isFirst || isOpen) && (
                      <>
                        {isFirst && (
                          <p style={{ fontSize: "11px", fontWeight: "700", color: group.color, marginBottom: "10px" }}>{group.section}</p>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {group.items.map(item => (
                            <DocButton key={item.name} name={item.name} icon={item.icon} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {/* 직접 추가 */}
              <div style={{ marginTop: "8px", borderTop: "1px solid #334155", paddingTop: "14px" }}>
                <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "8px" }}>기타 서류 직접 추가</p>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    value={extraDocName}
                    onChange={e => setExtraDocName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && extraDocName.trim()) {
                        setExtraDocs(p => [...p, extraDocName.trim()]);
                        setExtraDocName("");
                      }
                    }}
                    placeholder="서류명 입력"
                    style={{
                      flex: 1, padding: "10px 12px", backgroundColor: "#0F172A",
                      border: "1px solid #334155", borderRadius: "8px", fontSize: "13px",
                      color: "#F1F5F9", fontFamily: font, outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!extraDocName.trim()) return;
                      setExtraDocs(p => [...p, extraDocName.trim()]);
                      setExtraDocName("");
                    }}
                    style={{
                      padding: "10px 14px", backgroundColor: "#334155", color: "#CBD5E1",
                      border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700",
                      cursor: "pointer", fontFamily: font, whiteSpace: "nowrap",
                    }}
                  >
                    + 추가
                  </button>
                </div>
                {extraDocs.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {extraDocs.map(d => <DocButton key={d} name={d} icon="📎" />)}
                  </div>
                )}
              </div>
            </div>

            {/* 안내 */}
            <div style={{ backgroundColor: "#1E3A5F", borderRadius: "12px", border: "1px solid #1D4ED8", padding: "14px 16px", marginTop: "14px" }}>
              <p style={{ fontSize: "12px", color: "#93C5FD", lineHeight: "1.6", margin: 0 }}>
                📌 서류 버튼을 클릭하면 파일을 선택할 수 있어요.<br />
                선택된 파일은 담당 매니저에게 즉시 전달됩니다.<br />
                문의: <strong>담당 매니저</strong>에게 연락해주세요.
              </p>
            </div>
          </>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="*/*" style={{ display: "none" }} onChange={handleFileChange} />
    </div>
  );
}
