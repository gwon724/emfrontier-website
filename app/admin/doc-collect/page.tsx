"use client";
import { useState, useRef } from "react";
import { getAllConsultations, getAllAdmins, FONT } from "@/lib/store";

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

export default function DocCollectPage() {
  const [phone, setPhone] = useState("");
  const [clientInfo, setClientInfo] = useState<{ name: string; consultId: string; assignedTo: string; assignedName: string } | null>(null);
  const [chatId, setChatId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [docStatuses, setDocStatuses] = useState<Record<string, DocStatus>>({});
  const [extraDocName, setExtraDocName] = useState("");
  const [extraDocs, setExtraDocs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDoc, setPendingDoc] = useState("");

  const searchClient = async () => {
    setSearchError("");
    setSearching(true);
    setClientInfo(null);
    setChatId("");
    try {
      const consultations = getAllConsultations();
      const clean = phone.replace(/-/g, "");
      const found = consultations.find(c => c.phone?.replace(/-/g, "") === clean);
      if (!found) { setSearchError("해당 번호로 등록된 고객이 없습니다."); setSearching(false); return; }

      const adminsRes = await fetch("/api/db?key=adminAccounts").then(r => r.json()).catch(() => ({ value: [] }));
      const admins: Array<{ username: string; name: string; telegramChatId?: string }> = adminsRes.value || [];
      const adm = admins.find(a => a.username === found.assignedTo);

      setClientInfo({
        name: found.name,
        consultId: found.id,
        assignedTo: found.assignedTo || "",
        assignedName: found.assignedName || adm?.name || "미배정",
      });
      if (adm?.telegramChatId) setChatId(adm.telegramChatId);
      else setSearchError("⚠️ 담당자 텔레그램이 설정되지 않았습니다. 설정 페이지에서 등록해주세요.");
    } finally {
      setSearching(false);
    }
  };

  const handleDocClick = (docName: string) => {
    if (!chatId) { alert("담당자 텔레그램 ID가 없습니다. 설정 페이지에서 등록해주세요."); return; }
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

  const statusColor = (s: DocStatus) => s === "done" ? "#10B981" : s === "sending" ? "#F59E0B" : s === "error" ? "#EF4444" : "#334155";
  const statusIcon = (s: DocStatus) => s === "done" ? "✅" : s === "sending" ? "⏳" : s === "error" ? "❌" : "";

  const DocButton = ({ name, icon }: { name: string; icon: string }) => {
    const st = docStatuses[name] || "idle";
    return (
      <button onClick={() => handleDocClick(name)} disabled={st === "sending"}
        style={{
          padding: "16px 8px", backgroundColor: st === "done" ? "#052E1C" : st === "error" ? "#450A0A" : "#1E293B",
          border: `1px solid ${statusColor(st)}`, borderRadius: "12px", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          fontFamily: font, transition: "all 0.15s",
        }}>
        <span style={{ fontSize: "24px" }}>{statusIcon(st) || icon}</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color: st === "done" ? "#34D399" : st === "error" ? "#FCA5A5" : "#CBD5E1", textAlign: "center", lineHeight: "1.3" }}>{name}</span>
      </button>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", fontFamily: font, padding: "20px 16px", color: "#F1F5F9" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <a href="/admin/dashboard" style={{ color: "#64748B", textDecoration: "none", fontSize: "20px" }}>←</a>
          <div>
            <p style={{ fontSize: "18px", fontWeight: "900", color: "#F1F5F9" }}>📁 서류 수집</p>
            <p style={{ fontSize: "11px", color: "#64748B" }}>고객 전화번호로 조회 후 서류를 제출하세요</p>
          </div>
        </div>

        {/* 전화번호 검색 */}
        <div style={{ backgroundColor: "#1E293B", borderRadius: "14px", border: "1px solid #334155", padding: "16px", marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "10px" }}>📞 고객 조회</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchClient()}
              placeholder="010-0000-0000"
              style={{ flex: 1, padding: "12px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "15px", color: "#F1F5F9", fontFamily: font, outline: "none" }}
            />
            <button onClick={searchClient} disabled={searching || !phone.trim()}
              style={{ padding: "12px 18px", backgroundColor: "#1D4ED8", color: "#FFF", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
              {searching ? "조회중..." : "조회"}
            </button>
          </div>
          {searchError && <p style={{ fontSize: "12px", color: "#FCA5A5", marginTop: "8px" }}>{searchError}</p>}
        </div>

        {/* 고객 정보 확인 */}
        {clientInfo && (
          <div style={{ backgroundColor: "#1E293B", borderRadius: "14px", border: "1px solid #334155", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "16px", fontWeight: "900", color: "#F1F5F9" }}>{clientInfo.name} 대표님</p>
                <p style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>담당: {clientInfo.assignedName}</p>
              </div>
              {chatId
                ? <span style={{ fontSize: "11px", fontWeight: "700", color: "#34D399", backgroundColor: "#052E1C", padding: "4px 10px", borderRadius: "999px", border: "1px solid #34D399" }}>✓ 텔레그램 연결됨</span>
                : <span style={{ fontSize: "11px", fontWeight: "700", color: "#FCA5A5", backgroundColor: "#450A0A", padding: "4px 10px", borderRadius: "999px" }}>⚠️ 텔레그램 미설정</span>
              }
            </div>
          </div>
        )}

        {/* 서류 제출 */}
        {clientInfo && (
          <div style={{ backgroundColor: "#1E293B", borderRadius: "14px", border: "1px solid #334155", padding: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#64748B", marginBottom: "16px" }}>📁 서류 제출</p>

            {DOC_GROUPS.map(group => (
              <div key={group.section} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: group.color, marginBottom: "10px" }}>{group.section}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {group.items.map(item => <DocButton key={item.name} name={item.name} icon={item.icon} />)}
                </div>
              </div>
            ))}

            {/* 직접 추가 */}
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input value={extraDocName} onChange={e => setExtraDocName(e.target.value)}
                  placeholder="서류명 직접 입력"
                  style={{ flex: 1, padding: "10px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", fontFamily: font, outline: "none" }} />
                <button onClick={() => {
                  if (!extraDocName.trim()) return;
                  setExtraDocs(p => [...p, extraDocName.trim()]);
                  setExtraDocName("");
                }} style={{ padding: "10px 14px", backgroundColor: "#334155", color: "#CBD5E1", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
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
        )}

        {/* 숨겨진 파일 입력 */}
        <input ref={fileInputRef} type="file" accept="*/*" style={{ display: "none" }} onChange={handleFileChange} />
      </div>
    </div>
  );
}
