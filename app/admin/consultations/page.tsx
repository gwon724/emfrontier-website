"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LOGO_B64,
  getAllConsultations, updateConsultation, deleteConsultation,
  CONSULT_STATUS_LIST, CONSULT_STATUS_COLORS, FONT,
  Consultation, ConsultStatus, getAllFunds, FundProduct,
  convertConsultationToMember,
} from "@/lib/store";

const font = FONT;

const inp: React.CSSProperties = {
  padding: "9px 12px", fontSize: "13px", border: "1.5px solid #334155",
  borderRadius: "8px", backgroundColor: "#1E293B", color: "#F1F5F9",
  outline: "none", fontFamily: font, boxSizing: "border-box", width: "100%",
};

const GRADE_COLOR: Record<string, { bg: string; text: string }> = {
  A: { bg: "#052E1C", text: "#34D399" }, B: { bg: "#1E3A8A", text: "#60A5FA" },
  C: { bg: "#3B2A00", text: "#FBBF24" }, D: { bg: "#450A0A", text: "#FCA5A5" },
};

function calcGrade(c: Consultation) {
  let s = 0;
  const nice = Number(c.nice_score) || 0;
  const rev = Number(c.annual_revenue) || 0;
  const debt = Number(c.currentDebt) || 0;
  if (nice >= 900) s += 40; else if (nice >= 800) s += 30; else if (nice >= 700) s += 20; else if (nice >= 600) s += 10;
  if (rev >= 500000000) s += 30; else if (rev >= 200000000) s += 20; else if (rev >= 100000000) s += 15; else if (rev >= 50000000) s += 8;
  if (debt === 0) s += 20; else if (debt < 50000000) s += 15; else if (debt < 100000000) s += 10; else if (debt < 200000000) s += 5;
  return s >= 75 ? "A" : s >= 55 ? "B" : s >= 35 ? "C" : "D";
}
const gc = (g: string) => g === "A" ? "#16A34A" : g === "B" ? "#3B82F6" : g === "C" ? "#D97706" : "#EF4444";

export default function AdminConsultationsPage() {
  const router = useRouter();
  const [list, setList] = useState<Consultation[]>([]);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [statusFilter, setStatusFilter] = useState<ConsultStatus | "">("");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [memo, setMemo] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [consultDate, setConsultDate] = useState("");
  const [newStatus, setNewStatus] = useState<ConsultStatus>("접수대기");
  const [saved, setSaved] = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [allFunds, setAllFunds] = useState<FundProduct[]>([]);
  const [detailTab, setDetailTab] = useState<"info" | "analysis" | "funds">("info");
  const [aiReport, setAiReport] = useState("");
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  // 회원 전환 알림
  const [memberConvertToast, setMemberConvertToast] = useState<{ show: boolean; name: string; pw: string }>({ show: false, name: "", pw: "" });

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("adminLoggedIn")) { router.replace("/admin/login"); return; }
    setList(getAllConsultations());
    setAllFunds(getAllFunds());
  }, [router]);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  // 회원 전환 토스트 자동 숨김
  useEffect(() => {
    if (memberConvertToast.show) {
      const t = setTimeout(() => setMemberConvertToast({ show: false, name: "", pw: "" }), 5000);
      return () => clearTimeout(t);
    }
  }, [memberConvertToast.show]);

  const filtered = list.filter(c => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchGrade = !gradeFilter || calcGrade(c) === gradeFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    return matchStatus && matchGrade && matchSearch;
  });

  const openDetail = (c: Consultation) => {
    setSelected(c);
    setMemo(c.adminMemo || "");
    setAssignedTo(c.assignedTo || "");
    setConsultDate(c.consultDate || "");
    setNewStatus(c.status);
    setSaved(false); setDelConfirm(false);
    setDetailTab("info");
    setShowDetail(true);
    setShowAiReport(false);
    setAiReport("");
  };

  const handleSave = () => {
    if (!selected) return;
    const prevAssigned = selected.assignedTo || "";
    const isNewAssignment = assignedTo.trim() && !prevAssigned;

    updateConsultation(selected.id, { status: newStatus, adminMemo: memo, assignedTo, consultDate });
    setSaved(true); setTimeout(() => setSaved(false), 2500);

    // ── 담당자 신규 배정 시 자동 회원 전환 ──
    if (isNewAssignment) {
      const freshList = getAllConsultations();
      const freshConsult = freshList.find(c => c.id === selected.id);
      if (freshConsult) {
        const result = convertConsultationToMember(freshConsult);
        if (result.created) {
          const phone = freshConsult.phone.replace(/-/g, "");
          setMemberConvertToast({ show: true, name: freshConsult.name, pw: phone.slice(-4) });
        }
      }
    }

    const updated = getAllConsultations();
    setList(updated);
    const fresh = updated.find(c => c.id === selected.id);
    if (fresh) setSelected(fresh);
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteConsultation(selected.id);
    setList(getAllConsultations());
    setSelected(null); setDelConfirm(false); setShowDetail(false);
  };

  const total = list.length;
  const waiting = list.filter(c => c.status === "접수대기").length;
  const inProgress = list.filter(c => ["상담중", "서류진행", "심사중", "상담예약", "서류요청", "신청진행"].includes(c.status)).length;
  const completed = list.filter(c => c.status === "승인완료" || c.status === "상담완료" || c.status === "종결" || c.status === "집행중" || c.status === "사후관리").length;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .cp-header {
          background-color:#1E293B; border-bottom:1px solid #334155;
          padding:10px 14px; position:sticky; top:0; z-index:50;
        }
        .cp-header-inner {
          max-width:1400px; margin:0 auto;
          display:flex; justify-content:space-between; align-items:center; gap:8px;
        }
        .cp-brand { text-decoration:none; display:flex; align-items:center; gap:8px; }
        .cp-brand .t1 { font-size:15px; font-weight:800; color:#F1F5F9; white-space:nowrap; }
        .cp-brand .t2 { font-size:10px; color:#64748B; }
        .cp-nav { display:flex; gap:10px; align-items:center; }
        .cp-nav a { font-size:12px; color:#94A3B8; text-decoration:none; font-family:${font}; white-space:nowrap; }
        .hamburger { display:none; background:none; border:none; cursor:pointer; padding:6px; }
        .hamburger span { display:block; width:20px; height:2px; background:#CBD5E1; border-radius:2px; margin:4px 0; }

        .mob-nav {
          display:none; position:fixed; inset:0;
          background:rgba(15,23,42,0.97); z-index:100;
          flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:20px;
        }
        .mob-nav.open { display:flex; }
        .mob-nav a {
          width:100%; max-width:300px; text-align:center;
          padding:13px 20px; font-size:14px; font-weight:600;
          border-radius:8px; text-decoration:none; background:#334155; color:#CBD5E1; display:block;
        }
        .mob-close { position:absolute; top:14px; right:14px; background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; padding:8px; }

        /* Stats */
        .cp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }

        /* Layout: list + detail side by side on large screens */
        .cp-body { max-width:1400px; width:100%; margin:0 auto; padding:12px 10px; }
        .cp-layout { display:flex; gap:14px; align-items:flex-start; }
        .cp-list-col { flex:1; min-width:0; display:flex; flex-direction:column; gap:10px; }
        .cp-list-col.has-detail { flex:0 0 380px; }
        .cp-detail-col { flex:1; min-width:0; display:flex; flex-direction:column; gap:10px; }

        /* Detail overlay for mobile */
        .detail-overlay {
          display:none; position:fixed; inset:0; background:#0F172A;
          z-index:80; overflow-y:auto; padding:12px;
        }
        .detail-overlay.open { display:block; }

        /* Info grid */
        .cp-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .cp-swot-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }

        /* Filter row */
        .filter-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }

        /* Table */
        .tbl-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; max-height:calc(100vh - 320px); overflow-y:auto; }
        .tbl-scroll table { width:100%; border-collapse:collapse; min-width:420px; }

        /* Detail tab buttons */
        .dtab { padding:8px 12px; border:none; cursor:pointer; font-family:${font}; font-size:12px; font-weight:700; border-radius:8px 8px 0 0; border-bottom:2px solid transparent; background:transparent; color:#64748B; }
        .dtab.active { background:#0F172A; color:#60A5FA; border-bottom:2px solid #2563EB; }

        /* AI 보고서 마크다운 스타일 */
        .ai-report-body h1 { font-size:16px; font-weight:900; color:#A78BFA; margin:16px 0 8px; }
        .ai-report-body h2 { font-size:14px; font-weight:800; color:#818CF8; margin:14px 0 6px; border-left:3px solid #4F46E5; padding-left:8px; }
        .ai-report-body h3 { font-size:13px; font-weight:700; color:#60A5FA; margin:10px 0 4px; }
        .ai-report-body p { font-size:12px; color:#CBD5E1; line-height:1.8; margin:4px 0; }
        .ai-report-body ul, .ai-report-body ol { margin:4px 0 8px 16px; }
        .ai-report-body li { font-size:12px; color:#CBD5E1; line-height:1.8; }
        .ai-report-body strong { color:#F1F5F9; font-weight:700; }
        .ai-report-body hr { border:none; border-top:1px solid #334155; margin:12px 0; }
        .ai-report-body .section-box { background:#1E293B; border-radius:10px; border:1px solid #334155; padding:12px; margin:8px 0; }
        .ai-report-body .swot-s { border-left:3px solid #34D399; }
        .ai-report-body .swot-w { border-left:3px solid #FBBF24; }
        .ai-report-body .swot-o { border-left:3px solid #60A5FA; }
        .ai-report-body .swot-t { border-left:3px solid #F87171; }
        .ai-report-body .highlight { background:#1E3A5F; border-radius:6px; padding:8px 12px; font-size:12px; color:#93C5FD; margin:6px 0; }

        /* 회원 전환 토스트 */
        .member-toast {
          position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
          background:#052E1C; border:1.5px solid #16A34A; border-radius:12px;
          padding:14px 20px; z-index:9999; min-width:280px; max-width:90vw;
          box-shadow:0 8px 32px rgba(0,0,0,0.4);
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        @media (max-width:1024px) {
          .cp-list-col.has-detail { flex:none; max-width:100%; }
          .cp-layout { flex-direction:column; }
          .cp-detail-col { display:none; }
        }
        @media (max-width:768px) {
          .cp-stats { grid-template-columns:repeat(2,1fr); }
          .cp-nav { display:none; }
          .hamburger { display:block; }
          .cp-info-grid { grid-template-columns:1fr; }
          .cp-swot-grid { grid-template-columns:1fr; }
        }
        @media (max-width:480px) {
          .cp-brand .t1 { font-size:13px; }
          .cp-body { padding:8px; }
          .detail-overlay { padding:8px; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", fontFamily: font, display: "flex", flexDirection: "column" }}>

        {/* 회원 전환 토스트 */}
        {memberConvertToast.show && (
          <div className="member-toast">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "22px" }}>✅</span>
              <div>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#34D399", marginBottom: "4px" }}>
                  회원 자동 전환 완료
                </p>
                <p style={{ fontSize: "12px", color: "#CBD5E1" }}>
                  <strong style={{ color: "#F1F5F9" }}>{memberConvertToast.name}</strong> 님이 고객 포털 회원으로 등록되었습니다.
                </p>
                <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                  임시 비밀번호: <strong style={{ color: "#FCD34D", letterSpacing: "2px" }}>{memberConvertToast.pw}</strong> (연락처 뒤 4자리)
                </p>
              </div>
              <button onClick={() => setMemberConvertToast({ show: false, name: "", pw: "" })}
                style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "16px", marginLeft: "auto", flexShrink: 0 }}>
                ×
              </button>
            </div>
          </div>
        )}

        {/* Mobile nav overlay */}
        <div className={`mob-nav ${mobileNav ? "open" : ""}`}>
          <button className="mob-close" onClick={() => setMobileNav(false)}>✕</button>
          <Link href="/admin/dashboard" onClick={() => setMobileNav(false)}>📊 대시보드</Link>
          <Link href="/admin/funds" onClick={() => setMobileNav(false)}>💰 자금 관리</Link>
          <Link href="/admin/consultations" onClick={() => setMobileNav(false)}>💬 상담 관리</Link>
          <Link href="/admin/accounts" onClick={() => setMobileNav(false)}>🔑 계정 관리</Link>
        </div>

        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-inner">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, overflow: "hidden" }}>
              <Link href="/admin/dashboard" className="cp-brand">
                <img src={LOGO_B64} alt="EF" width={28} height={28} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p className="t1">엠프론티어</p>
                  <p className="t2">상담 관리</p>
                </div>
              </Link>
              <span style={{ color: "#475569", fontSize: "13px" }}>/</span>
              <span style={{ fontSize: "13px", color: "#60A5FA", fontWeight: "700", whiteSpace: "nowrap" }}>💬 상담 관리</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              <div className="cp-nav">
                <span style={{ fontSize: "11px", color: "#10B981" }}>● 실시간</span>
                <Link href="/admin/dashboard">대시보드</Link>
                <Link href="/admin/funds">자금관리</Link>
              </div>
              <button className="hamburger" onClick={() => setMobileNav(true)}>
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>

        <div className="cp-body">
          {/* Stats */}
          <div className="cp-stats" style={{ marginBottom: "12px" }}>
            {[
              { label: "전체", value: total, color: "#60A5FA", bg: "#1E3A8A" },
              { label: "접수대기", value: waiting, color: "#FCD34D", bg: "#1C1A09" },
              { label: "진행중", value: inProgress, color: "#A78BFA", bg: "#1C1035" },
              { label: "완료/종결", value: completed, color: "#34D399", bg: "#052E1C" },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: "10px", color: "#94A3B8" }}>{s.label}</p>
                <p style={{ fontSize: "22px", fontWeight: "900", color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="cp-layout">
            {/* List Column */}
            <div className={`cp-list-col ${selected ? "has-detail" : ""}`}>
              {/* Filter */}
              <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", border: "1px solid #334155", padding: "10px 12px" }} className="filter-row">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 이름 / 연락처 / 이메일"
                  style={{ ...inp, backgroundColor: "#0F172A", flex: 1, minWidth: "120px" }} />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ConsultStatus | "")}
                  style={{ ...inp, cursor: "pointer", backgroundColor: "#0F172A", flex: "0 0 auto", width: "auto" }}>
                  <option value="">전체 상태</option>
                  {CONSULT_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
                  style={{ ...inp, cursor: "pointer", backgroundColor: "#0F172A", flex: "0 0 auto", width: "auto" }}>
                  <option value="">전체 등급</option>
                  {["A", "B", "C", "D"].map(g => <option key={g} value={g}>{g}등급</option>)}
                </select>
                <span style={{ fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{filtered.length}건</span>
              </div>

              {/* List */}
              <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center" }}>
                    <p style={{ fontSize: "32px", marginBottom: "10px" }}>📭</p>
                    <p style={{ fontSize: "14px", color: "#94A3B8" }}>상담 신청 내역이 없습니다</p>
                    <Link href="/consult" target="_blank" style={{ fontSize: "13px", color: "#60A5FA", textDecoration: "none" }}>→ 상담 신청 페이지</Link>
                  </div>
                ) : (
                  <div className="tbl-scroll">
                    <table>
                      <thead>
                        <tr style={{ backgroundColor: "#0F172A", borderBottom: "1px solid #334155" }}>
                          {["접수번호", "신청자", "연락처", "연매출", "등급", "상태", "담당자", "신청일", ""].map(h => (
                            <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#64748B", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(c => {
                          const sc = CONSULT_STATUS_COLORS[c.status];
                          const isSelected = selected?.id === c.id;
                          const grade = calcGrade(c);
                          const gc2 = gc(grade);
                          return (
                            <tr key={c.id}
                              style={{ borderBottom: "1px solid #1E293B", backgroundColor: isSelected ? "#0F2540" : "transparent", cursor: "pointer" }}
                              onClick={() => openDetail(c)}>
                              <td style={{ padding: "10px 10px", fontSize: "11px", color: "#60A5FA", fontWeight: "700", whiteSpace: "nowrap" }}>{c.id}</td>
                              <td style={{ padding: "10px 10px" }}>
                                <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9" }}>{c.name}</p>
                                <p style={{ fontSize: "10px", color: "#64748B" }}>{c.email}</p>
                              </td>
                              <td style={{ padding: "10px 10px", fontSize: "12px", color: "#CBD5E1", whiteSpace: "nowrap" }}>{c.phone}</td>
                              <td style={{ padding: "10px 10px", fontSize: "12px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                                {Number(c.annual_revenue) >= 100000000
                                  ? `${(Number(c.annual_revenue)/100000000).toFixed(1)}억`
                                  : `${(Number(c.annual_revenue)/10000).toFixed(0)}만`}원
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <span style={{ padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "900", backgroundColor: GRADE_COLOR[grade]?.bg, color: gc2, border: `1px solid ${gc2}33` }}>{grade}</span>
                              </td>
                              <td style={{ padding: "10px 10px" }}>
                                <span style={{ padding: "3px 7px", borderRadius: "999px", fontSize: "10px", fontWeight: "700", backgroundColor: sc.darkBg, color: sc.darkText, border: `1px solid ${sc.border}33`, whiteSpace: "nowrap" }}>
                                  {c.status}
                                </span>
                              </td>
                              <td style={{ padding: "10px 10px", fontSize: "11px", color: c.assignedTo ? "#34D399" : "#475569", whiteSpace: "nowrap" }}>
                                {c.assignedTo || <span style={{ color: "#475569" }}>미배정</span>}
                              </td>
                              <td style={{ padding: "10px 10px", fontSize: "10px", color: "#64748B", whiteSpace: "nowrap" }}>{c.createdAt.slice(0, 10)}</td>
                              <td style={{ padding: "10px 10px" }}>
                                <button onClick={e => { e.stopPropagation(); openDetail(c); }}
                                  style={{ padding: "4px 9px", backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                                  상세
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Column — desktop only inline */}
            {selected && (
              <div className="cp-detail-col">
                <DetailPanel
                  selected={selected} detailTab={detailTab} setDetailTab={setDetailTab}
                  allFunds={allFunds} newStatus={newStatus} setNewStatus={setNewStatus}
                  memo={memo} setMemo={setMemo} assignedTo={assignedTo} setAssignedTo={setAssignedTo}
                  consultDate={consultDate} setConsultDate={setConsultDate}
                  saved={saved} handleSave={handleSave} delConfirm={delConfirm} setDelConfirm={setDelConfirm}
                  handleDelete={handleDelete}
                  onClose={() => { setSelected(null); setShowDetail(false); }}
                  onUpdateSelected={c => setSelected(c)}
                  aiReport={aiReport} aiReportLoading={aiReportLoading} showAiReport={showAiReport}
                  setAiReport={setAiReport} setAiReportLoading={setAiReportLoading} setShowAiReport={setShowAiReport}
                  GRADE_COLOR={GRADE_COLOR} inp={inp}
                />
              </div>
            )}
          </div>
        </div>

        {/* Detail overlay — mobile */}
        {selected && (
          <div className={`detail-overlay ${showDetail ? "open" : ""}`}>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
              <DetailPanel
                selected={selected} detailTab={detailTab} setDetailTab={setDetailTab}
                allFunds={allFunds} newStatus={newStatus} setNewStatus={setNewStatus}
                memo={memo} setMemo={setMemo} assignedTo={assignedTo} setAssignedTo={setAssignedTo}
                consultDate={consultDate} setConsultDate={setConsultDate}
                saved={saved} handleSave={handleSave} delConfirm={delConfirm} setDelConfirm={setDelConfirm}
                handleDelete={handleDelete}
                onClose={() => { setSelected(null); setShowDetail(false); }}
                onUpdateSelected={c => setSelected(c)}
                aiReport={aiReport} aiReportLoading={aiReportLoading} showAiReport={showAiReport}
                setAiReport={setAiReport} setAiReportLoading={setAiReportLoading} setShowAiReport={setShowAiReport}
                GRADE_COLOR={GRADE_COLOR} inp={inp}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Extracted Detail Panel component ── */
function DetailPanel({
  selected, detailTab, setDetailTab,
  allFunds, newStatus, setNewStatus,
  memo, setMemo, assignedTo, setAssignedTo,
  consultDate, setConsultDate,
  saved, handleSave, delConfirm, setDelConfirm, handleDelete,
  onClose, onUpdateSelected,
  aiReport, aiReportLoading, showAiReport, setAiReport, setAiReportLoading, setShowAiReport,
  GRADE_COLOR, inp,
}: {
  selected: Consultation;
  detailTab: "info" | "analysis" | "funds";
  setDetailTab: (t: "info" | "analysis" | "funds") => void;
  allFunds: FundProduct[];
  newStatus: ConsultStatus; setNewStatus: (s: ConsultStatus) => void;
  memo: string; setMemo: (v: string) => void;
  assignedTo: string; setAssignedTo: (v: string) => void;
  consultDate: string; setConsultDate: (v: string) => void;
  saved: boolean; handleSave: () => void;
  delConfirm: boolean; setDelConfirm: (v: boolean) => void;
  handleDelete: () => void;
  onClose: () => void;
  onUpdateSelected: (c: Consultation) => void;
  aiReport: string; aiReportLoading: boolean; showAiReport: boolean;
  setAiReport: (v: string) => void; setAiReportLoading: (v: boolean) => void; setShowAiReport: (v: boolean) => void;
  GRADE_COLOR: Record<string, { bg: string; text: string }>;
  inp: React.CSSProperties;
}) {
  const font = FONT;
  const selectedFundObjects = allFunds.filter(f => (selected.selectedFundIds || []).includes(f.id));
  const ai = selected.aiAnalysis;
  const grade = calcGrade(selected) as string;
  const gradeC = gc(grade);

  // AI 보고서 마크다운 → HTML 변환
  function renderAiReport(text: string): string {
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // 제목
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      // 굵게
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // 가로선
      .replace(/^---+$/gm, "<hr/>")
      // 리스트
      .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      // 번호 리스트
      .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
      // 하이라이트 박스 (> 인용)
      .replace(/^&gt;\s+(.+)$/gm, "<div class=\"highlight\">$1</div>")
      // 줄바꿈
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");
    return `<p>${html}</p>`;
  }

  // PDF 출력
  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    const printHtml = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${selected.name} AI 기업 분석 보고서</title>
<style>
  body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;max-width:860px;margin:40px auto;padding:0 28px;color:#1a1a1a;line-height:1.9;font-size:13px}
  .report-header{background:linear-gradient(135deg,#1e3a8a,#4f46e5);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:28px}
  .report-header h1{font-size:20px;margin:0 0 8px;font-weight:900}
  .report-header .meta{font-size:12px;opacity:0.85;display:flex;gap:20px;flex-wrap:wrap}
  h2{color:#1d4ed8;border-left:4px solid #3b82f6;padding-left:12px;margin-top:28px;font-size:15px}
  h3{color:#374151;font-size:13px;margin-top:16px;font-weight:700}
  strong{color:#059669}
  .swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0}
  .swot-box{padding:14px;border-radius:8px;border:1px solid #e5e7eb}
  .swot-s{background:#f0fdf4;border-color:#86efac}.swot-w{background:#fefce8;border-color:#fde047}
  .swot-o{background:#eff6ff;border-color:#93c5fd}.swot-t{background:#fef2f2;border-color:#fca5a5}
  .swot-box h3{margin:0 0 8px;font-size:12px}
  ul{margin:6px 0 6px 16px}li{margin:3px 0}
  hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
  .highlight{background:#f0f9ff;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:4px;margin:8px 0;font-size:12px}
  @media print{body{margin:0;padding:20px}}
</style>
</head>
<body>
<div class="report-header">
  <h1>📊 AI 기업 분석 보고서</h1>
  <div class="meta">
    <span>고객명: ${selected.name}</span>
    <span>업종: ${selected.businessType || "-"}</span>
    <span>SOHO 등급: ${grade}등급</span>
    <span>담당: ${selected.assignedTo || "미배정"}</span>
    <span>작성일: ${new Date().toLocaleDateString("ko-KR")}</span>
  </div>
</div>
${aiReport
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/^### (.+)$/gm, "<h3>$1</h3>")
  .replace(/^## (.+)$/gm, "<h2>$1</h2>")
  .replace(/^# (.+)$/gm, "<h1>$1</h1>")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/^---+$/gm, "<hr/>")
  .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
  .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
  .replace(/^&gt;\s+(.+)$/gm, "<div class=\"highlight\">$1</div>")
  .replace(/\n\n/g, "</p><p>")
  .replace(/\n/g, "<br/>")}
</body></html>`;
    win.document.write(printHtml);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Card header */}
      <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div>
            <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "2px" }}>접수번호</p>
            <p style={{ fontSize: "16px", fontWeight: "900", color: "#60A5FA" }}>{selected.id}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* 담당자 배정 여부 뱃지 */}
            <span style={{
              padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700",
              backgroundColor: selected.assignedTo ? "#052E1C" : "#1C1A09",
              color: selected.assignedTo ? "#34D399" : "#FCD34D",
              border: `1px solid ${selected.assignedTo ? "#16A34A" : "#D97706"}44`,
            }}>
              {selected.assignedTo ? `👤 ${selected.assignedTo}` : "⏳ 미배정"}
            </span>
            <span style={{ padding: "5px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", backgroundColor: CONSULT_STATUS_COLORS[selected.status].darkBg, color: CONSULT_STATUS_COLORS[selected.status].darkText, border: `1px solid ${CONSULT_STATUS_COLORS[selected.status].border}44` }}>
              {selected.status}
            </span>
            <button onClick={onClose}
              style={{ width: "28px", height: "28px", backgroundColor: "#334155", border: "none", borderRadius: "50%", color: "#94A3B8", cursor: "pointer", fontSize: "14px" }}>×</button>
          </div>
        </div>

        {/* 회원 여부 표시 */}
        {selected.assignedTo && (
          <div style={{ marginBottom: "10px", padding: "6px 10px", backgroundColor: "#052E1C", borderRadius: "7px", border: "1px solid #16A34A33", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px" }}>✅</span>
            <span style={{ fontSize: "11px", color: "#34D399" }}>고객 포털 회원 전환 완료 — 임시 비밀번호: <strong style={{ color: "#FCD34D", letterSpacing: "1px" }}>{selected.phone.replace(/-/g,"").slice(-4)}</strong></span>
          </div>
        )}

        {/* Tab menu */}
        <div style={{ display: "flex", gap: "3px", borderBottom: "1px solid #334155" }}>
          {([
            { key: "info", label: "📋 기본정보" },
            { key: "analysis", label: "🏢 기업분석" },
            { key: "funds", label: `💰 자금(${selectedFundObjects.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setDetailTab(t.key)}
              className={`dtab ${detailTab === t.key ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ───── Info Tab ───── */}
      {detailTab === "info" && (
        <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
          {/* SOHO 등급 카드 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", padding: "10px 14px", backgroundColor: "#0F172A", borderRadius: "10px", border: `1px solid ${gradeC}33` }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "50%", backgroundColor: GRADE_COLOR[grade]?.bg || "#1E293B", border: `3px solid ${gradeC}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "20px", fontWeight: "900", color: gradeC }}>{grade}</span>
            </div>
            <div>
              <p style={{ fontSize: "12px", fontWeight: "800", color: "#F1F5F9" }}>SOHO {grade}등급</p>
              <p style={{ fontSize: "10px", color: "#94A3B8" }}>신용: {selected.nice_score}점 · 매출: {Number(selected.annual_revenue) >= 100000000 ? `${(Number(selected.annual_revenue)/100000000).toFixed(1)}억` : `${(Number(selected.annual_revenue)/10000).toFixed(0)}만`}원 · 기대출: {Number(selected.currentDebt) > 0 ? `${(Number(selected.currentDebt)/10000).toFixed(0)}만원` : "없음"}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              ["신청자", `${selected.name} (${selected.gender}, ${selected.age}세)`],
              ["연락처", selected.phone], ["이메일", selected.email],
              ["업종", `${selected.businessType} · ${selected.businessPeriod}`],
              ["연매출액", `${Number(selected.annual_revenue).toLocaleString()}원`],
              ["희망금액", `${Number(selected.desiredAmount).toLocaleString()}원`],
              ["기대출", `${Number(selected.currentDebt).toLocaleString()}원`],
              ["NICE/KCB", `${selected.nice_score}점 / ${selected.kcb_score}점`],
              ["신청일", selected.createdAt],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: "7px 10px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                <p style={{ fontSize: "10px", color: "#64748B" }}>{k}</p>
                <p style={{ fontSize: "12px", color: "#CBD5E1", fontWeight: "600", marginTop: "2px", wordBreak: "break-word" }}>{v}</p>
              </div>
            ))}
          </div>

          {/* 기대출 상세 */}
          {selected.debtDetail && (
            <div style={{ marginTop: "10px", padding: "10px 12px", backgroundColor: "#0F172A", borderRadius: "8px", border: "1px solid #334155" }}>
              <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "8px", fontWeight: "700" }}>📋 기대출 상세 (금융권별)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {[
                  ["1금융권", selected.debtDetail.first],
                  ["2금융권", selected.debtDetail.second],
                  ["카드론", selected.debtDetail.cardLoan],
                  ["캐피탈", selected.debtDetail.capital],
                  ["정책자금", selected.debtDetail.policy],
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: "5px 8px", backgroundColor: "#1E293B", borderRadius: "6px" }}>
                    <p style={{ fontSize: "9px", color: "#64748B" }}>{k}</p>
                    <p style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: "600" }}>
                      {Number(v) > 0 ? `${Number(v).toLocaleString()}원` : "-"}
                    </p>
                  </div>
                ))}
                <div style={{ padding: "5px 8px", backgroundColor: "#1E3A5F", borderRadius: "6px", border: "1px solid #2563EB33" }}>
                  <p style={{ fontSize: "9px", color: "#64748B" }}>합계</p>
                  <p style={{ fontSize: "11px", color: "#60A5FA", fontWeight: "800" }}>
                    {Number(selected.currentDebt).toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          )}

          {selected.inquiryContent && (
            <div style={{ marginTop: "10px", padding: "10px 12px", backgroundColor: "#0F172A", borderRadius: "8px", border: "1px solid #334155" }}>
              <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "5px" }}>문의 내용</p>
              <p style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{selected.inquiryContent}</p>
            </div>
          )}
        </div>
      )}

      {/* ───── AI 기업 분석 Tab ───── */}
      {detailTab === "analysis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* 버튼 행 */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={async () => {
                setAiReportLoading(true); setShowAiReport(true); setAiReport("");
                const grade2 = calcGrade(selected) as string;
                const nice = Number(selected.nice_score) || 0;
                const rev = Number(selected.annual_revenue) || 0;
                const debt = Number(selected.currentDebt) || 0;
                const recFunds = allFunds.filter(f => {
                  if (!f.active) return false;
                  if (!f.eligibleGrades.includes(grade2)) return false;
                  if (Number(f.minRevenue) > 0 && rev < Number(f.minRevenue)) return false;
                  if (Number(f.minCreditScore) > 0 && nice < Number(f.minCreditScore)) return false;
                  if ((f as FundProduct & {maxCreditScore?:string}).maxCreditScore && Number((f as FundProduct & {maxCreditScore?:string}).maxCreditScore) > 0 && nice > Number((f as FundProduct & {maxCreditScore?:string}).maxCreditScore)) return false;
                  if (Number(f.maxDebt) > 0 && debt > Number(f.maxDebt)) return false;
                  return true;
                }).slice(0, 6);
                try {
                  const res = await fetch("/api/ai-report", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ client: {
                      name: selected.name,
                      businessType: selected.businessType || "",
                      businessPeriod: selected.businessPeriod || "",
                      annual_revenue: selected.annual_revenue,
                      nice_score: selected.nice_score,
                      kcb_score: selected.kcb_score || "",
                      currentDebt: selected.currentDebt || "0",
                      desiredAmount: selected.desiredAmount || "",
                      grade: grade2,
                      assignedName: selected.assignedTo || "",
                      funds: recFunds,
                    }})
                  });
                  const data = await res.json();
                  setAiReport(data.report || data.error || "오류 발생");
                } catch(e) { setAiReport("오류: " + e); }
                setAiReportLoading(false);
              }}
              style={{ flex: 1, padding: "12px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", background: "linear-gradient(135deg, #7C3AED, #4F46E5)", color: "#FFF" }}>
              🏢 AI 기업 분석 보고서 생성
            </button>
            {!aiReportLoading && aiReport && (
              <button
                onClick={handlePrint}
                style={{ padding: "12px 16px", backgroundColor: "#059669", color: "#FFF", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                📄 PDF
              </button>
            )}
          </div>

          {/* AI 보고서 결과 */}
          {showAiReport && (
            <div style={{ backgroundColor: "#0A0F1E", border: "1px solid #4F46E5", borderRadius: "12px", overflow: "hidden" }}>
              {/* 헤더 */}
              <div style={{ padding: "12px 16px", background: "linear-gradient(135deg, #1e1b4b, #1e3a8a)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🏢</span>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "800", color: "#A5B4FC" }}>AI 기업 분석 보고서</p>
                    <p style={{ fontSize: "10px", color: "#6366F1" }}>{selected.name} · {selected.businessType || "업종 미입력"} · {grade}등급</p>
                  </div>
                </div>
                <button onClick={() => setShowAiReport(false)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "18px" }}>×</button>
              </div>

              {/* 본문 */}
              <div style={{ padding: "16px" }}>
                {aiReportLoading ? (
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px", animation: "spin 2s linear infinite", display: "inline-block" }}>⚙️</div>
                    <p style={{ fontSize: "14px", color: "#A78BFA", fontWeight: "700" }}>AI 분석 중...</p>
                    <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>동종업계 분석 · SWOT · 전망 포함 (15~30초)</p>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : (
                  <div
                    className="ai-report-body"
                    style={{ maxHeight: "600px", overflowY: "auto" }}
                    dangerouslySetInnerHTML={{ __html: renderAiReport(aiReport) }}
                  />
                )}
              </div>
            </div>
          )}

          {/* 기존 AI 분석 데이터 (설문 기반) */}
          {!ai ? (
            !showAiReport && (
              <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "40px", textAlign: "center" }}>
                <p style={{ fontSize: "28px", marginBottom: "10px" }}>🏢</p>
                <p style={{ fontSize: "13px", color: "#94A3B8" }}>위 버튼을 눌러 AI 기업 분석 보고서를 생성하세요.</p>
                <p style={{ fontSize: "11px", color: "#64748B", marginTop: "6px" }}>동종업계 분석 · SWOT · 향후 전망 · 정책자금 전략 포함</p>
              </div>
            )
          ) : (
            <>
              <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: GRADE_COLOR[ai.sohoGrade]?.bg || "#0F172A", border: `3px solid ${GRADE_COLOR[ai.sohoGrade]?.text || "#475569"}66`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: GRADE_COLOR[ai.sohoGrade]?.text || "#94A3B8" }}>{ai.sohoGrade}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: "800", color: "#F1F5F9", marginBottom: "4px" }}>SOHO {ai.sohoGrade}등급 · {ai.sohoScore}점/90점</p>
                    <p style={{ fontSize: "11px", color: "#94A3B8", lineHeight: "1.6" }}>{ai.summary}</p>
                  </div>
                </div>
                <div style={{ height: "5px", backgroundColor: "#0F172A", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (ai.sohoScore/90)*100)}%`, backgroundColor: GRADE_COLOR[ai.sohoGrade]?.text || "#475569", borderRadius: "999px" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { title: "💪 강점", items: ai.strengths, bg: "#052E1C", border: "#166534", color: "#34D399" },
                  { title: "⚠️ 약점", items: ai.weaknesses, bg: "#1C0A00", border: "#92400E", color: "#FBBF24" },
                  { title: "🚀 기회", items: ai.opportunities, bg: "#0F1E3D", border: "#1D4ED8", color: "#60A5FA" },
                  { title: "🔴 리스크", items: ai.risks, bg: "#450A0A", border: "#DC2626", color: "#FCA5A5" },
                ].map(sw => (
                  <div key={sw.title} style={{ backgroundColor: sw.bg, border: `1px solid ${sw.border}44`, borderRadius: "10px", padding: "10px" }}>
                    <p style={{ fontSize: "11px", fontWeight: "800", color: sw.color, marginBottom: "6px" }}>{sw.title}</p>
                    {sw.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: "4px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "7px", color: sw.color, marginTop: "4px", flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: "10px", color: "#CBD5E1", lineHeight: "1.5" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ───── Funds Tab ───── */}
      {detailTab === "funds" && (
        <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "12px" }}>
            💾 선택 자금 ({selectedFundObjects.length}개)
          </p>
          {/* 자금 추가 드롭다운 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <select
              defaultValue=""
              onChange={e => {
                const fundId = e.target.value;
                if (!fundId) return;
                const current = selected.selectedFundIds || [];
                if (current.includes(fundId)) return;
                const updated = [...current, fundId];
                updateConsultation(selected.id, { selectedFundIds: updated });
                const fresh = getAllConsultations().find(c => c.id === selected.id);
                if (fresh) onUpdateSelected(fresh);
                e.target.value = "";
              }}
              style={{ flex: 1, minWidth: "200px", padding: "8px 10px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9", cursor: "pointer" }}
            >
              <option value="">정책자금 선택하여 추가...</option>
              {allFunds.filter(f => f.active && !(selected.selectedFundIds || []).includes(f.id)).map(f => (
                <option key={f.id} value={f.id}>[{f.category}] {f.name} (최대 {Number(f.maxAmount).toLocaleString()}원)</option>
              ))}
            </select>
          </div>
          {selectedFundObjects.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#64748B", padding: "20px 0", textAlign: "center" }}>위 드롭다운에서 자금을 선택해주세요.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedFundObjects.map(f => (
                <div key={f.id} style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "10px 12px", border: "1px solid #1E3A8A", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#60A5FA" }}>{f.name}</p>
                    <p style={{ fontSize: "11px", color: "#64748B" }}>{f.institution} · {f.category}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: "800", color: "#34D399" }}>
                      최대 {Number(f.maxAmount) >= 100000000 ? (Number(f.maxAmount)/100000000).toFixed(0)+"억" : (Number(f.maxAmount)/10000).toFixed(0)+"만"}원
                    </p>
                    <button
                      onClick={() => {
                        const updated = (selected.selectedFundIds || []).filter(id => id !== f.id);
                        updateConsultation(selected.id, { selectedFundIds: updated });
                        const fresh = getAllConsultations().find(c => c.id === selected.id);
                        if (fresh) onUpdateSelected(fresh);
                      }}
                      style={{ padding: "4px 8px", backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "6px", color: "#EF4444", fontSize: "11px", cursor: "pointer" }}>
                      ✕ 제거
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───── Status management ───── */}
      <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
        <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "10px" }}>📊 상담 상태 관리</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
          {CONSULT_STATUS_LIST.map(s => {
            const sc = CONSULT_STATUS_COLORS[s];
            const isActive = newStatus === s;
            return (
              <button key={s} onClick={() => setNewStatus(s)}
                style={{ padding: "5px 9px", borderRadius: "7px", fontSize: "11px", fontWeight: "700", cursor: "pointer", border: `2px solid ${isActive ? sc.border : "#334155"}`, backgroundColor: isActive ? sc.darkBg : "#0F172A", color: isActive ? sc.darkText : "#64748B" }}>
                {s}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
          <div>
            <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
              담당 매니저
              {!selected.assignedTo && (
                <span style={{ marginLeft: "6px", fontSize: "10px", color: "#F59E0B", fontWeight: "600" }}>
                  ★ 배정 시 자동 회원 전환
                </span>
              )}
            </label>
            <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="담당자 이름"
              style={{ ...inp, backgroundColor: "#0F172A", borderColor: !selected.assignedTo && assignedTo ? "#F59E0B" : "#334155" }} />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>상담 예약일시</label>
            <input value={consultDate} onChange={e => setConsultDate(e.target.value)} placeholder="예: 2026-04-20 14:00" style={{ ...inp, backgroundColor: "#0F172A" }} />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>관리자 메모</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3}
              placeholder="내부 메모..." style={{ ...inp, backgroundColor: "#0F172A", resize: "vertical", lineHeight: "1.7" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleSave}
            style={{ flex: 3, padding: "11px", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", cursor: "pointer", backgroundColor: saved ? "#16A34A" : "#2563EB", color: "#FFF" }}>
            {saved ? "✓ 저장됨" : "💾 저장"}
          </button>
          <button onClick={() => setDelConfirm(true)}
            style={{ flex: 1, padding: "11px", border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", cursor: "pointer", backgroundColor: "#450A0A", color: "#FCA5A5" }}>
            🗑️
          </button>
        </div>
        {delConfirm && (
          <div style={{ marginTop: "10px", backgroundColor: "#1A0505", borderRadius: "8px", padding: "12px", border: "1px solid #7F1D1D" }}>
            <p style={{ fontSize: "12px", color: "#FCA5A5", marginBottom: "10px", textAlign: "center" }}>정말로 삭제하시겠습니까?</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setDelConfirm(false)} style={{ flex: 1, padding: "9px", backgroundColor: "#334155", color: "#CBD5E1", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>취소</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "9px", backgroundColor: "#DC2626", color: "#FFF", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>삭제</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
