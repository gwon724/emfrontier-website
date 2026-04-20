"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LOGO_B64, FONT } from "@/lib/store";

const font = FONT;

export default function Home() {
  const [floatVisible, setFloatVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setFloatVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: font, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; }

        /* ─ 헤더 ─ */
        .lp-header { background: #0A1628; padding: 0 20px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #1E2D47; }
        .lp-header-inner { max-width: 1100px; margin: 0 auto; height: 56px; display: flex; justify-content: space-between; align-items: center; }

        /* ─ 히어로 ─ */
        .lp-hero { background: linear-gradient(160deg, #0A1628 0%, #0D2244 50%, #112D5E 100%); padding: 60px 20px 72px; position: relative; overflow: hidden; }
        .lp-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(37,99,235,0.2); border: 1px solid rgba(37,99,235,0.4); border-radius: 999px; padding: 7px 18px; margin-bottom: 24px; }
        .lp-hero-h1 { font-size: clamp(28px, 5.5vw, 52px); font-weight: 900; color: #FFFFFF; line-height: 1.18; margin-bottom: 18px; letter-spacing: -0.5px; }
        .lp-hero-sub { font-size: clamp(15px, 2.5vw, 18px); color: #94A3B8; line-height: 1.7; margin-bottom: 32px; }
        .lp-hero-checklist { display: flex; flex-direction: column; gap: 10px; margin-bottom: 36px; }
        .lp-check-row { display: flex; align-items: center; gap: 10px; }

        /* ─ CTA 버튼 공통 ─ */
        .lp-btn-primary { display: inline-block; background: #EF4444; color: #fff; font-size: clamp(15px, 2.5vw, 18px); font-weight: 900; padding: 16px 36px; border-radius: 12px; text-decoration: none; border: none; cursor: pointer; font-family: inherit; box-shadow: 0 8px 28px rgba(239,68,68,0.45); transition: transform 0.15s, box-shadow 0.15s; letter-spacing: -0.2px; }
        .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(239,68,68,0.5); }
        .lp-btn-secondary { display: inline-block; background: rgba(255,255,255,0.1); color: #E2E8F0; font-size: 15px; font-weight: 700; padding: 15px 28px; border-radius: 12px; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; font-family: inherit; }

        /* ─ 통계 바 ─ */
        .lp-stats { background: #060E1A; padding: 0; }
        .lp-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }

        /* ─ 섹션 공통 ─ */
        .lp-section { padding: 64px 20px; }
        .lp-section-label { font-size: 12px; font-weight: 700; color: #2563EB; letter-spacing: 0.12em; margin-bottom: 10px; text-transform: uppercase; }
        .lp-section-h2 { font-size: clamp(22px, 4vw, 34px); font-weight: 900; color: #0A1628; line-height: 1.25; margin-bottom: 12px; }

        /* ─ 신뢰 3줄 ─ */
        .lp-trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 32px; }

        /* ─ 서비스 카드 ─ */
        .lp-service-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 36px; }

        /* ─ 결과 강조 ─ */
        .lp-result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 32px; }

        /* ─ FAQ ─ */
        .lp-faq-item { border-bottom: 1px solid #E2E8F0; }
        .lp-faq-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 20px 4px; background: transparent; border: none; cursor: pointer; font-family: inherit; text-align: left; }

        /* ─ 하단 CTA ─ */
        .lp-cta-section { background: linear-gradient(160deg, #0A1628 0%, #0D2244 50%, #112D5E 100%); padding: 64px 20px; text-align: center; }

        /* ─ 플로팅 ─ */
        .lp-float { position: fixed; bottom: 24px; right: 24px; z-index: 300; }

        /* ─ 불안 제거 바 ─ */
        .lp-reassure { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 24px 28px; }

        /* ─ 모바일 반응형 ─ */
        @media (max-width: 768px) {
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-trust-grid { grid-template-columns: 1fr; }
          .lp-service-grid { grid-template-columns: 1fr; }
          .lp-result-grid { grid-template-columns: 1fr; gap: 10px; }
          .lp-float { bottom: 16px; right: 16px; }
          .lp-btn-primary { width: 100%; text-align: center; }
        }
        @media (max-width: 480px) {
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-hero { padding: 44px 16px 56px; }
          .lp-section { padding: 48px 16px; }
        }

        /* ─ 펄스 애니메이션 ─ */
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse { animation: pulse-dot 1.8s ease-in-out infinite; }

        /* ─ 배경 데코 ─ */
        .bg-deco-1 { position:absolute;top:-80px;right:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,0.15) 0%,transparent 70%);pointer-events:none; }
        .bg-deco-2 { position:absolute;bottom:-60px;left:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(239,68,68,0.08) 0%,transparent 70%);pointer-events:none; }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          헤더 — 로고 + 상담 버튼만 (메뉴 제거)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="lp-header">
        <div className="lp-header-inner">
          {/* 로고 */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={LOGO_B64} alt="엠프론티어" width={30} height={30} style={{ objectFit: "contain", filter: "invert(1)", flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "0.04em", lineHeight: 1 }}>엠프론티어</p>
              <p style={{ fontSize: "9px", color: "#60A5FA", letterSpacing: "0.06em", marginTop: "2px" }}>정책자금 전문 컨설팅</p>
            </div>
          </div>
          {/* 헤더 CTA — 전화 + 상담 버튼 */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <a href="tel:010-0000-0000" style={{ fontSize: "13px", color: "#94A3B8", textDecoration: "none", fontWeight: "600" }} className="hide-on-mobile">
              📞 무료 전화 상담
            </a>
            <Link href="/consult/survey" style={{
              padding: "9px 18px", background: "#EF4444", color: "#FFFFFF",
              borderRadius: "8px", fontSize: "13px", fontWeight: "900", textDecoration: "none",
              boxShadow: "0 4px 14px rgba(239,68,68,0.4)", whiteSpace: "nowrap",
            }}>
              무료 상담 신청
            </Link>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1️⃣ 히어로 — 헤드라인 + 상단 CTA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-hero">
        <div className="bg-deco-1" /><div className="bg-deco-2" />
        <div style={{ maxWidth: "780px", margin: "0 auto", position: "relative" }}>

          {/* 긴급 뱃지 */}
          <div className="lp-hero-badge">
            <span className="pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
            <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "700" }}>🔥 지금 무료 상담 진행 중</span>
          </div>

          {/* ★ 메인 헤드라인 */}
          <h1 className="lp-hero-h1">
            정책자금 승인,<br />
            <span style={{ color: "#EF4444" }}>전략 없이 하면 떨어집니다.</span>
          </h1>

          {/* 서브헤드 */}
          <p className="lp-hero-sub">
            엠프론티어는 <strong style={{ color: "#FFFFFF" }}>통과되는 구조로 설계</strong>합니다.<br />
            신청 전략 수립부터 자금 집행까지, 전담 컨설턴트가 함께합니다.
          </p>

          {/* 체크리스트 */}
          <div className="lp-hero-checklist">
            {[
              "매출이 낮아도 · 신용점수가 낮아도 신청 가능",
              "사업 기간 짧아도 · 기존 대출 있어도 가능",
              "다른 곳에서 거절당해도 방법이 있습니다",
              "초기 상담비 0원 · 미승인 시 착수금 100% 환불",
            ].map(t => (
              <div className="lp-check-row" key={t}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", fontWeight: "900", color: "#FFF" }}>✓</span>
                <span style={{ fontSize: "clamp(14px,2.2vw,16px)", fontWeight: "600", color: "#E2E8F0" }}>{t}</span>
              </div>
            ))}
          </div>

          {/* ★ CTA 버튼 ① */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/consult/survey" className="lp-btn-primary">
              지금 가능한 정책자금 확인하기 →
            </Link>
            <Link href="/consult" className="lp-btn-secondary">
              서비스 자세히 보기
            </Link>
          </div>
          <p style={{ fontSize: "12px", color: "#475569", marginTop: "14px" }}>
            ✔ 상담비 0원 &nbsp;·&nbsp; ✔ 3분 내 신청 완료 &nbsp;·&nbsp; ✔ 24시간 신청 가능
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          통계 배너 (짧고 강하게)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-stats">
        <div className="lp-stats-grid" style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {[
            { num: "97%", label: "정책자금 승인율", icon: "✅" },
            { num: "1,000+", label: "연간 상담 건수", icon: "💬" },
            { num: "96%", label: "고객 만족도", icon: "⭐" },
            { num: "500억+", label: "누적 자금 조달액", icon: "💰" },
          ].map(s => (
            <div key={s.label} style={{ padding: "28px 16px", textAlign: "center", borderRight: "1px solid #1E2D47" }}>
              <p style={{ fontSize: "20px", marginBottom: "4px" }}>{s.icon}</p>
              <p style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: "900", color: "#60A5FA", marginBottom: "4px" }}>{s.num}</p>
              <p style={{ fontSize: "11px", color: "#64748B" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4️⃣ 신뢰 요소 3줄
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-section" style={{ backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p className="lp-section-label">WHY EMFRONTIER</p>
          <h2 className="lp-section-h2">
            왜 엠프론티어인가요?
          </h2>
          <p style={{ fontSize: "15px", color: "#64748B", lineHeight: "1.7" }}>
            정책자금은 아는 만큼 받습니다.<br />
            모르면 기회를 놓치고, 잘못 신청하면 6개월간 재신청이 불가합니다.
          </p>

          <div className="lp-trust-grid">
            {[
              {
                icon: "🎯",
                title: "정책자금 승인 중심 컨설팅",
                desc: "단순 안내가 아닙니다. 통과 확률을 높이는 전략을 설계합니다.",
                color: "#EFF6FF", border: "#BFDBFE",
              },
              {
                icon: "📋",
                title: "사업자 맞춤 전략 설계",
                desc: "업종·매출·신용·업력 분석 후 최적 자금 조합과 신청 순서를 제시합니다.",
                color: "#F0FDF4", border: "#BBF7D0",
              },
              {
                icon: "🚀",
                title: "자금 확보까지 실행 지원",
                desc: "서류 준비, 기관 인터뷰, 집행까지 전담 매니저가 끝까지 함께합니다.",
                color: "#FFF7ED", border: "#FED7AA",
              },
            ].map(t => (
              <div key={t.title} style={{ background: t.color, border: `1.5px solid ${t.border}`, borderRadius: "16px", padding: "28px 22px", textAlign: "left" }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "14px" }}>{t.icon}</span>
                <p style={{ fontSize: "15px", fontWeight: "800", color: "#0A1628", marginBottom: "8px", lineHeight: "1.4" }}>{t.title}</p>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.8" }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5️⃣ 서비스 설명 — "어떻게 통과시키나"
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-section" style={{ backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <p className="lp-section-label">HOW WE WIN</p>
            <h2 className="lp-section-h2">엠프론티어가 통과시키는 방법</h2>
            <p style={{ fontSize: "15px", color: "#64748B", lineHeight: "1.7" }}>
              같은 조건이어도 전략에 따라 결과가 달라집니다.
            </p>
          </div>

          <div className="lp-service-grid">
            {[
              {
                step: "01", icon: "🔍",
                title: "현황 분석 — 부결 리스크 사전 제거",
                desc: "신용·매출·부채·업종을 분석해 거절 요인을 먼저 제거합니다. 준비 없이 신청하면 부결 후 6개월 동안 재신청이 막힙니다.",
                color: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8",
              },
              {
                step: "02", icon: "💡",
                title: "순서 설계 — 최대 한도 확보 전략",
                desc: "기대출 미적용 상품을 먼저, 기대출 적용 상품을 나중에 배치해 한도를 최대로 확보합니다. 순서가 곧 금액 차이입니다.",
                color: "#F0FDF4", border: "#BBF7D0", text: "#166534",
              },
              {
                step: "03", icon: "📝",
                title: "서류·사업계획서 — 심사관 맞춤 작성",
                desc: "심사관이 승인 결정하는 핵심 포인트에 집중한 사업계획서를 작성합니다. 논리 구조와 숫자를 전략적으로 배치합니다.",
                color: "#FFF7ED", border: "#FED7AA", text: "#C2410C",
              },
            ].map(s => (
              <div key={s.step} style={{ background: s.color, border: `1.5px solid ${s.border}`, borderRadius: "16px", padding: "28px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: s.text, background: s.border, padding: "3px 8px", borderRadius: "6px" }}>STEP {s.step}</span>
                  <span style={{ fontSize: "24px" }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: "15px", fontWeight: "800", color: "#0A1628", marginBottom: "10px", lineHeight: "1.4" }}>{s.title}</p>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.8" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6️⃣ 결과 강조
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-section" style={{ backgroundColor: "#0A1628" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p className="lp-section-label" style={{ color: "#60A5FA" }}>RESULTS</p>
          <h2 className="lp-section-h2" style={{ color: "#FFFFFF" }}>상담 후 대표님이 얻는 결과</h2>
          <p style={{ fontSize: "15px", color: "#94A3B8", lineHeight: "1.7", marginBottom: "36px" }}>
            우리의 목표는 단 하나 — 대표님 통장에 자금이 들어오는 것입니다.
          </p>

          <div className="lp-result-grid">
            {[
              { icon: "📈", num: "승인 가능성 상승", desc: "전략 수립 후 신청 → 부결 리스크 최소화", color: "#10B981" },
              { icon: "💵", num: "자금 확보 → 사업 확장", desc: "평균 2.1억 승인 · 운전·시설 자금 동시 활용", color: "#60A5FA" },
              { icon: "📄", num: "실행 가능한 사업계획서", desc: "심사 통과 목적으로 설계된 계획서 제공", color: "#FBBF24" },
            ].map(r => (
              <div key={r.num} style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${r.color}30`, borderRadius: "16px", padding: "28px 20px" }}>
                <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>{r.icon}</span>
                <p style={{ fontSize: "16px", fontWeight: "900", color: r.color, marginBottom: "8px", lineHeight: "1.3" }}>{r.num}</p>
                <p style={{ fontSize: "13px", color: "#94A3B8", lineHeight: "1.7" }}>{r.desc}</p>
              </div>
            ))}
          </div>

          {/* 실 수치 강조 */}
          <div style={{ marginTop: "40px", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "16px", padding: "24px 28px" }}>
            <p style={{ fontSize: "clamp(14px,2.5vw,16px)", color: "#E2E8F0", lineHeight: "1.8" }}>
              <strong style={{ color: "#60A5FA" }}>2024년 설립 이후</strong> 누적 자금 조달 <strong style={{ color: "#FCD34D" }}>500억 원 이상</strong>,<br />
              승인율 <strong style={{ color: "#10B981" }}>97%</strong>를 유지하고 있습니다.<br />
              <span style={{ fontSize: "13px", color: "#475569" }}>실제 이용 고객 기준 · 2026년 4월 기준</span>
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7️⃣ 불안 제거 — 상담 부담 제로
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-section" style={{ backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div className="lp-reassure">
            <p style={{ fontSize: "12px", fontWeight: "700", color: "#16A34A", letterSpacing: "0.1em", marginBottom: "12px" }}>🛡️ 안심 보장</p>
            <h2 style={{ fontSize: "clamp(20px,3.5vw,28px)", fontWeight: "900", color: "#0A1628", marginBottom: "16px", lineHeight: "1.3" }}>
              초기 상담은 무료이며,<br />가능 여부부터 정확히 안내드립니다.
            </h2>
            <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.8", marginBottom: "24px" }}>
              상담 후 진행 여부는 대표님이 결정합니다.<br />
              어떠한 압박도 없으며, 가능한 자금이 없으면 솔직하게 말씀드립니다.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "✔  초기 상담비 0원 — 어떤 비용도 청구하지 않습니다",
                "✔  미승인 시 착수금 100% 환불 — 계약서에 명시됩니다",
                "✔  전국 비대면 가능 — 방문 없이 전화·카톡으로 진행",
                "✔  경영컨설팅업 정식 등록 법인 — 사기 업체와 다릅니다",
              ].map(t => (
                <p key={t} style={{ fontSize: "14px", color: "#374151", fontWeight: "600" }}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAQ — 빠른 불안 해소
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FaqSection font={font} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8️⃣ 하단 CTA (반복)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="lp-cta-section">
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#60A5FA", letterSpacing: "0.12em", marginBottom: "16px" }}>FREE CONSULTATION</p>
          <h2 style={{ fontSize: "clamp(24px, 4.5vw, 40px)", fontWeight: "900", color: "#FFFFFF", marginBottom: "16px", lineHeight: "1.25" }}>
            대표님 사업에 맞는<br />
            <span style={{ color: "#EF4444" }}>정책자금, 지금 확인하세요.</span>
          </h2>
          <p style={{ fontSize: "clamp(14px,2vw,16px)", color: "#94A3B8", marginBottom: "12px", lineHeight: "1.7" }}>
            3분 설문으로 맞춤 정책자금을 분석해드립니다.
          </p>
          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "36px" }}>
            ✔ 상담비 0원 &nbsp;·&nbsp; ✔ 24시간 신청 &nbsp;·&nbsp; ✔ 미승인 착수금 100% 환불
          </p>

          {/* ★ CTA 버튼 ② */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <Link href="/consult/survey" style={{
              display: "inline-block", background: "#EF4444", color: "#FFF",
              fontSize: "clamp(16px,2.5vw,20px)", fontWeight: "900",
              padding: "18px 52px", borderRadius: "14px", textDecoration: "none",
              boxShadow: "0 10px 36px rgba(239,68,68,0.5)", letterSpacing: "-0.2px",
              width: "100%", maxWidth: "480px", textAlign: "center",
            }}>
              무료 상담 신청하기 — 지금 바로 →
            </Link>
            <Link href="/consult/survey" style={{
              display: "inline-block", background: "rgba(255,255,255,0.08)", color: "#BFDBFE",
              fontSize: "14px", fontWeight: "700",
              padding: "13px 36px", borderRadius: "10px", textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.18)", width: "100%", maxWidth: "480px", textAlign: "center",
            }}>
              지금 신청하면 1일 이내 전담 매니저가 연락드립니다
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          푸터
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ backgroundColor: "#060E1A", padding: "28px 20px", borderTop: "1px solid #1E2D47" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <img src={LOGO_B64} alt="엠프론티어" width={22} height={22} style={{ objectFit: "contain", filter: "invert(1)" }} />
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>엠프론티어</p>
            </div>
            <p style={{ fontSize: "11px", color: "#475569" }}>경영컨설팅업 정식 등록 · 법인사업자 2024년 설립</p>
          </div>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <Link href="/consult/lookup" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>상담 조회</Link>
            <Link href="/consult" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>정책자금 상담</Link>
            <Link href="/client/login" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>로그인</Link>
          </div>
          <p style={{ fontSize: "10px", color: "#334155" }}>© 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved</p>
        </div>
      </footer>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          플로팅 CTA 버튼
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {floatVisible && (
        <div className="lp-float">
          <Link href="/consult/survey" style={{
            display: "inline-block", background: "#EF4444", color: "#FFF",
            fontSize: "14px", fontWeight: "900", padding: "13px 22px", borderRadius: "999px",
            textDecoration: "none", boxShadow: "0 8px 28px rgba(239,68,68,0.55)",
            whiteSpace: "nowrap",
          }}>
            🔥 무료 상담 신청
          </Link>
        </div>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    FAQ 컴포넌트 (인터랙티브)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function FaqSection({ font }: { font: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "상담은 정말 무료인가요?", a: "네, 상담은 100% 무료입니다. 정책자금이 승인된 경우에만 성공 수수료가 발생하며, 미승인 시 착수금 전액 환불을 계약서에 명시합니다." },
    { q: "신용점수가 낮아도 가능한가요?", a: "가능합니다. 신용점수가 낮더라도 지역신보 보증부대출, 소진공 긴급경영안정자금 등 다양한 상품이 있습니다. 상담을 통해 가능한 자금을 먼저 확인해드립니다." },
    { q: "이미 대출이 있어도 추가로 받을 수 있나요?", a: "기대출 미적용 상품을 먼저 진행하면 추가 자금 조달이 가능합니다. 신청 순서가 곧 한도 차이이기 때문에 전략 수립이 핵심입니다." },
    { q: "사업 기간이 6개월도 안 됐는데 가능한가요?", a: "창업 초기 전용 자금이 있습니다. 소진공 창업자금, 중진공 창업기반지원자금 등 업력 1년 미만 창업자를 위한 상품이 마련되어 있습니다." },
    { q: "신청 후 얼마나 걸리나요?", a: "상담 신청 후 영업일 기준 1일 이내 전담 매니저가 연락드립니다. 자금 집행까지는 보통 2~6주가 소요됩니다." },
  ];

  return (
    <section style={{ padding: "64px 20px", backgroundColor: "#FFFFFF" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "#2563EB", letterSpacing: "0.12em", marginBottom: "10px" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: "900", color: "#0A1628" }}>자주 묻는 질문</h2>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} className="lp-faq-item">
            <button className="lp-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ fontFamily: font }}>
              <span style={{ fontSize: "15px", fontWeight: "700", color: "#0A1628" }}>Q. {faq.q}</span>
              <span style={{ fontSize: "20px", color: "#2563EB", transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "none", flexShrink: 0 }}>+</span>
            </button>
            {openFaq === i && (
              <div style={{ padding: "0 4px 20px" }}>
                <p style={{ fontSize: "14px", color: "#64748B", lineHeight: "1.85", background: "#F8FAFC", borderRadius: "10px", padding: "16px", fontFamily: font }}>
                  A. {faq.a}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
