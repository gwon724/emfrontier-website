"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LOGO_B64, FONT } from "@/lib/store";

const font = FONT;

/* ── 카운트업 훅 ─────────────────────────── */
function useCountUp(target: number, duration = 1800, started = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return val;
}

/* ── 후기 데이터 ─────────────────────────── */
const REVIEWS = [
  { name: "김○○ 대표", type: "음식점", text: "정말 전문가에게 맡기길 잘했어요! 혼자 알아보다 복잡해서 포기할 뻔했는데, 처음부터 끝까지 친절하게 설명해주시고 맞춤 자금까지 제시해 주셨어요.", grade: "A", amount: "7,000만원" },
  { name: "이○○ 대표", type: "도소매업", text: "다른 곳에서 거절 당하고 왔는데 승인됐어요! 신용등급이 낮아서 은행에서 두 번이나 거절당했는데, 제 상황에 맞는 정책자금을 찾아주셔서 결국 승인까지 받았습니다.", grade: "D", amount: "3,000만원" },
  { name: "박○○ 대표", type: "카페 창업", text: "창업한 지 6개월도 안 됐는데 이런 게 가능할지 반신반의했어요. 담당 컨설턴트님이 창업 지원자금을 찾아주셔서 카페 인테리어 비용을 충당할 수 있었습니다!", grade: "C", amount: "5,000만원" },
  { name: "최○○ 대표", type: "제조업", text: "기대출이 있어도 추가로 받을 수 있었어요! 이미 대출이 있어서 무조건 안 된다고 생각했는데, 기대출 미적용 상품을 먼저 안내해주셔서 원하는 금액보다 더 많이 승인받았습니다.", grade: "B", amount: "1억 2,000만원" },
  { name: "정○○ 대표", type: "서비스업", text: "솔루션 받은대로 진행되서 놀랐어요. 사업자번호랑 몇 가지 정보만 알려드리니까 맞춤 솔루션을 바로 제공해주셔서 자금 실행까지 순조롭게 마무리됐습니다.", grade: "B", amount: "8,000만원" },
  { name: "강○○ 대표", type: "IT 스타트업", text: "비대면 진행이라 부담 없고 빠르게 끝났어요. 매장 운영하면서 따로 시간 내기 어려웠는데, 대부분 비대면으로 진행돼서 한 달도 안 돼서 자금 집행까지 완료됐습니다.", grade: "A", amount: "2억원" },
];

const GRADE_C: Record<string, string> = { A: "#16A34A", B: "#2563EB", C: "#D97706", D: "#DC2626" };

export default function ConsultPage() {
  const router = useRouter();
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [floatVisible, setFloatVisible] = useState(false);

  const c1 = useCountUp(97, 1600, statsVisible);
  const c2 = useCountUp(1000, 2000, statsVisible);
  const c3 = useCountUp(96, 1600, statsVisible);
  const c4 = useCountUp(500, 2200, statsVisible);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setFloatVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setReviewIdx(i => (i + 1) % REVIEWS.length), 4200);
    return () => clearInterval(t);
  }, []);

  const goSurvey = () => router.push("/consult/survey");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF", fontFamily: font, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }

        /* ─ 헤더 ─ */
        .ct-header { background: #0A1628; padding: 0 16px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #1E2D47; }
        .ct-header-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; height: 72px; }

        /* ─ 히어로 ─ */
        .ct-hero { background: linear-gradient(160deg, #0A1628 0%, #0D2244 45%, #112D5E 100%); padding: 60px 16px 80px; position: relative; overflow: hidden; }
        .ct-hero-grid { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: center; max-width: 1100px; margin: 0 auto; }
        .ct-hero-badges { display: flex; flex-direction: column; gap: 10px; min-width: 200px; }

        /* ─ 통계 ─ */
        .ct-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background-color: #1E2D47; border-radius: 20px; overflow: hidden; }

        /* ─ 섹션 공통 ─ */
        .ct-section { padding: 60px 16px; }
        .ct-section-label { font-size: 12px; font-weight: 700; color: #2563EB; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }

        /* ─ 이유 카드 ─ */
        .ct-why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        /* ─ 신뢰 ─ */
        .ct-trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }

        /* ─ 프로세스 ─ */
        .ct-process-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; }
        .ct-process-cell { padding: 28px 16px; text-align: center; }

        /* ─ 후기 ─ */
        .ct-review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

        /* ─ CTA ─ */
        .ct-cta-btn { padding: 18px 52px; font-size: clamp(16px,2.5vw,19px); }
        .ct-cta-h2 { font-size: clamp(22px, 5vw, 38px); }

        /* ─ 플로팅 ─ */
        .ct-float-btn { position: fixed; bottom: 24px; right: 24px; z-index: 300; padding: 13px 22px; font-size: 14px; }

        /* ─ 불안 제거 ─ */
        .ct-reassure { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; padding: 28px 32px; margin-top: 40px; }

        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse { animation: pulse-dot 1.8s ease-in-out infinite; }

        @media (max-width: 1024px) {
          .ct-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-process-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-why-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .ct-hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .ct-hero-badges { flex-direction: row; flex-wrap: wrap; min-width: 0; }
          .ct-hero-badges > div { flex: 0 0 calc(50% - 5px); }
          .ct-trust-grid { grid-template-columns: 1fr 1fr; }
          .ct-review-grid { grid-template-columns: 1fr 1fr; }
          .ct-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-float-btn { bottom: 16px; right: 16px; padding: 12px 18px; font-size: 13px; }
        }
        @media (max-width: 640px) {
          .ct-why-grid { grid-template-columns: 1fr; }
          .ct-review-grid { grid-template-columns: 1fr; }
          .ct-process-grid { grid-template-columns: 1fr 1fr; }
          .ct-cta-btn { padding: 16px 24px; width: 100%; }
        }
        @media (max-width: 480px) {
          .ct-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .ct-process-grid { grid-template-columns: 1fr 1fr; }
          .ct-hero-badges > div { flex: 0 0 100%; }
          .ct-trust-grid { grid-template-columns: 1fr; }
          .ct-process-cell { padding: 18px 10px; }
          .ct-reassure { padding: 20px 18px; }
        }
        @media (max-width: 380px) {
          .ct-process-grid { grid-template-columns: 1fr; }
          .ct-review-grid { grid-template-columns: 1fr; }
          .ct-cta-btn { padding: 14px 16px; font-size: 15px; }
        }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          헤더 — 로고 + 상담 버튼 (최소화)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="ct-header">
        <div className="ct-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <img src={LOGO_B64} alt="엠프론티어" width={64} height={64} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0, display: "block" }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>엠프론티어</p>
              <p style={{ fontSize: "9px", color: "#60A5FA", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>정책자금 전문 컨설팅</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/consult/lookup" style={{ fontSize: "12px", color: "#94A3B8", textDecoration: "none", fontWeight: "600" }}>
              상담 조회
            </Link>
            <button onClick={goSurvey} style={{
              padding: "9px 18px", background: "#EF4444", color: "#FFFFFF",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "900",
              cursor: "pointer", fontFamily: font, whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(239,68,68,0.4)",
            }}>
              무료 상담 신청
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1️⃣ 히어로 — 강력한 헤드라인
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-hero">
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="ct-hero-grid">
          <div>
            {/* 긴급 뱃지 */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)", borderRadius: "999px", padding: "6px 16px", marginBottom: "24px" }}>
              <span className="pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "700" }}>🔥 지금 바로 무료 상담 가능</span>
            </div>

            {/* ★ 헤드라인 */}
            <h1 style={{ fontSize: "clamp(26px, 5vw, 46px)", fontWeight: "900", color: "#FFFFFF", lineHeight: "1.2", marginBottom: "20px" }}>
              정책자금 승인,<br />
              <span style={{ color: "#EF4444" }}>전략 없이 하면 떨어집니다.</span>
            </h1>

            {/* 서브헤드 */}
            <p style={{ fontSize: "clamp(15px,2.5vw,18px)", color: "#94A3B8", lineHeight: "1.7", marginBottom: "28px" }}>
              <strong style={{ color: "#FFFFFF" }}>엠프론티어는 통과되는 구조로 설계합니다.</strong><br />
              신청 전략 수립부터 자금 집행까지, 전담 컨설턴트가 함께합니다.
            </p>

            {/* 체크리스트 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
              {[
                "매출이 낮아도 · 신용점수가 낮아도 신청 가능",
                "사업 기간 짧아도 · 기존 대출 있어도 가능",
                "다른 곳에서 거절당해도 방법이 있습니다",
                "초기 상담비 0원 · 미승인 시 착수금 100% 환불",
              ].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", fontWeight: "900", color: "#FFF" }}>✓</span>
                  <span style={{ fontSize: "clamp(14px,2vw,16px)", fontWeight: "600", color: "#E2E8F0" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* ★ CTA 버튼 ① */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={goSurvey} style={{
                padding: "16px 36px", background: "#EF4444", color: "#FFFFFF",
                border: "none", borderRadius: "12px", fontSize: "clamp(15px,2.5vw,17px)", fontWeight: "900",
                cursor: "pointer", fontFamily: font, boxShadow: "0 8px 28px rgba(239,68,68,0.45)",
              }}>
                지금 가능한 정책자금 확인하기 →
              </button>
              <Link href="/consult/lookup" style={{
                padding: "16px 28px", background: "rgba(255,255,255,0.1)", color: "#E2E8F0",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", fontSize: "14px",
                fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center",
              }}>
                상담 현황 조회
              </Link>
            </div>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "14px" }}>
              ✔ 상담비 0원 &nbsp;·&nbsp; ✔ 3분 내 신청 &nbsp;·&nbsp; ✔ 24시간 신청 가능
            </p>
          </div>

          {/* 신뢰 뱃지 */}
          <div className="ct-hero-badges">
            {[
              { icon: "🏢", title: "경영컨설팅업", desc: "정식 등록" },
              { icon: "📅", title: "2024년 설립", desc: "법인회사" },
              { icon: "🔒", title: "보이스피싱 NO", desc: "사기 NO" },
              { icon: "📞", title: "전국 무료 상담", desc: "비대면 가능" },
            ].map(b => (
              <div key={b.title} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{b.icon}</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>{b.title}</p>
                  <p style={{ fontSize: "11px", color: "#64748B" }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          실적 숫자 — 신뢰 확보
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section ref={statsRef} style={{ backgroundColor: "#0A1628", padding: "48px 16px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ textAlign: "center", fontSize: "12px", fontWeight: "700", color: "#60A5FA", letterSpacing: "0.12em", marginBottom: "36px" }}>PROVEN RESULTS</p>
          <div className="ct-stats-grid">
            {[
              { val: c1, suffix: "%", label: "정책자금 승인율", icon: "✅", color: "#10B981", sub: "타사 대비 최고 수준" },
              { val: c2, suffix: "+", label: "연간 상담 건수", icon: "💬", color: "#60A5FA", sub: "매년 꾸준히 증가 중" },
              { val: c3, suffix: "%", label: "고객 만족도", icon: "⭐", color: "#FBBF24", sub: "실제 이용 고객 평가" },
              { val: c4, suffix: "억+", label: "누적 자금 조달 총액", icon: "💰", color: "#F87171", sub: "2024년 설립 이후 누적" },
            ].map((s, i) => (
              <div key={i} style={{ backgroundColor: "#0A1628", padding: "36px 20px", textAlign: "center" }}>
                <span style={{ fontSize: "26px", display: "block", marginBottom: "10px" }}>{s.icon}</span>
                <p style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: "900", color: s.color, lineHeight: 1, marginBottom: "8px" }}>
                  {s.val.toLocaleString()}{s.suffix}
                </p>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#E2E8F0", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ fontSize: "10px", color: "#475569" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          왜 혼자 하면 안 되나요?
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-section" style={{ backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="ct-section-label">WHY PROFESSIONAL</p>
            <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: "900", color: "#0A1628", marginBottom: "12px", lineHeight: "1.25" }}>
              전략 없이 신청하면<br />이렇게 됩니다
            </h2>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: "1.7" }}>사업자금은 준비한 만큼 받고, 실수한 만큼 잃습니다</p>
          </div>
          <div className="ct-why-grid">
            {[
              { step: "01", icon: "😭", title: "부결 시 재신청 6개월 불가", desc: "준비 없이 신청해 부결나면 6개월간 재신청이 막힙니다. 급하다고 먼저 신청하면 기회를 잃습니다.", color: "#EF4444" },
              { step: "02", icon: "😥", title: "잘못된 순서 → 한도 반토막", desc: "기대출 적용·미적용 상품 순서를 틀리면 원하는 금액의 절반도 못 받을 수 있습니다.", color: "#F59E0B" },
              { step: "03", icon: "😯", title: "20분 만에 소진되는 인기 자금", desc: "인기 정책자금은 20분 만에 마감됩니다. 날짜·시간을 미리 파악하지 않으면 기회를 놓칩니다.", color: "#2563EB" },
              { step: "04", icon: "🤔", title: "300가지 자금, 내 것이 어딘지 모름", desc: "매일 업데이트되는 자금만 300여 가지. 내 업종·매출·신용에 맞는 자금을 혼자 찾기는 사실상 불가능합니다.", color: "#7C3AED" },
              { step: "05", icon: "😓", title: "사업계획서 작성 기준을 모름", desc: "심사관이 보는 핵심 포인트는 따로 있습니다. 형식만 갖춘 계획서로는 통과하기 어렵습니다.", color: "#EC4899" },
              { step: "06", icon: "🥺", title: "내 경쟁자들은 이미 전문가와 함께 준비한다", desc: "기관의 예산은 한정됩니다. 경쟁자들은 전략적으로 준비하고 있습니다.", color: "#10B981" },
            ].map(c => (
              <div key={c.step} style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "14px", right: "14px", fontSize: "11px", fontWeight: "900", color: c.color, opacity: 0.2 }}>STEP {c.step}</div>
                <span style={{ fontSize: "34px", display: "block", marginBottom: "14px" }}>{c.icon}</span>
                <p style={{ fontSize: "15px", fontWeight: "800", color: "#0A1628", marginBottom: "10px", lineHeight: "1.4" }}>{c.title}</p>
                <p style={{ fontSize: "13px", color: "#64748B", lineHeight: "1.7" }}>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* 미드 CTA */}
          <div style={{ textAlign: "center", marginTop: "44px" }}>
            <button onClick={goSurvey} style={{
              padding: "16px 44px", background: "#EF4444", color: "#FFFFFF",
              border: "none", borderRadius: "12px", fontSize: "clamp(15px,2.5vw,17px)", fontWeight: "900",
              cursor: "pointer", fontFamily: font, boxShadow: "0 8px 28px rgba(239,68,68,0.4)",
            }}>
              지금 내 상황 무료로 분석받기 →
            </button>
            <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "10px" }}>상담비 0원 · 가능 여부부터 정확히 안내드립니다</p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          신뢰 + 불안 제거
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-section" style={{ background: "linear-gradient(135deg, #0A1628 0%, #112D5E 100%)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: "900", color: "#FFFFFF", marginBottom: "14px", lineHeight: "1.3" }}>
            사기 NO · 보이스피싱 NO<br /><span style={{ color: "#60A5FA" }}>안심</span>하고 맡기세요
          </h2>
          <p style={{ fontSize: "15px", color: "#94A3B8", marginBottom: "40px", lineHeight: "1.7" }}>
            엠프론티어랩은 <strong style={{ color: "#FFFFFF" }}>경영컨설팅업 정식 등록</strong>,<br />
            <strong style={{ color: "#FFFFFF" }}>2024년 설립 법인회사</strong>입니다.
          </p>
          <div className="ct-trust-grid">
            {[
              { icon: "🏛️", title: "경영컨설팅업 정식 등록", desc: "무등록 사기 업체와 다릅니다" },
              { icon: "📋", title: "법인사업자 2024년 설립", desc: "정식 법인회사로 운영됩니다" },
              { icon: "🛡️", title: "개인정보 보호 철저", desc: "안전한 정보 관리 보장" },
            ].map(t => (
              <div key={t.title} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "28px 20px" }}>
                <span style={{ fontSize: "34px", display: "block", marginBottom: "12px" }}>{t.icon}</span>
                <p style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF", marginBottom: "6px" }}>{t.title}</p>
                <p style={{ fontSize: "12px", color: "#64748B" }}>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* 불안 제거 박스 */}
          <div className="ct-reassure">
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#16A34A", marginBottom: "10px" }}>🛡️ 상담 부담 제로 보장</p>
            <p style={{ fontSize: "clamp(16px,3vw,20px)", fontWeight: "900", color: "#0A1628", marginBottom: "14px", lineHeight: "1.3" }}>
              초기 상담은 무료이며,<br />가능 여부부터 정확히 안내드립니다.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
              {[
                "✔  초기 상담비 0원 — 어떤 비용도 청구하지 않습니다",
                "✔  미승인 시 착수금 100% 환불 — 계약서에 명시됩니다",
                "✔  전국 비대면 가능 — 방문 없이 전화·카톡으로 진행",
              ].map(t => (
                <p key={t} style={{ fontSize: "14px", color: "#374151", fontWeight: "600" }}>{t}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8단계 프로세스
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-section" style={{ backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p className="ct-section-label">HOW IT WORKS</p>
            <h2 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: "900", color: "#0A1628", marginBottom: "10px" }}>상담 신청부터 자금 집행까지</h2>
            <p style={{ fontSize: "14px", color: "#64748B" }}>전담 매니저가 8단계 전 과정을 함께합니다</p>
          </div>
          <div className="ct-process-grid">
            {[
              { n: "01", icon: "📝", title: "무료 상담 신청", desc: "기본정보 작성" },
              { n: "02", icon: "📞", title: "전화 상담", desc: "기업 현황 검토" },
              { n: "03", icon: "💡", title: "솔루션 제안", desc: "맞춤 자금 설계" },
              { n: "04", icon: "✍️", title: "계약 체결", desc: "미승인 100% 환불" },
              { n: "05", icon: "👤", title: "전담 매니저", desc: "단톡방 배정" },
              { n: "06", icon: "🔍", title: "컨설팅 진행", desc: "서류·계획서 작성" },
              { n: "07", icon: "🎉", title: "자금 승인", desc: "성공 수수료 납부" },
              { n: "08", icon: "🛎️", title: "사후 관리", desc: "1년 추가 자금 관리" },
            ].map((p, i) => (
              <div key={p.n} className="ct-process-cell" style={{ borderRight: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0", background: i % 2 === 0 ? "#FAFBFF" : "#FFFFFF" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "22px" }}>
                  {p.icon}
                </div>
                <span style={{ fontSize: "10px", fontWeight: "900", color: "#2563EB", letterSpacing: "0.08em" }}>STEP {p.n}</span>
                <p style={{ fontSize: "13px", fontWeight: "800", color: "#0A1628", margin: "6px 0 4px" }}>{p.title}</p>
                <p style={{ fontSize: "11px", color: "#94A3B8" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          고객 후기
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-section" style={{ backgroundColor: "#F8FAFC" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <p className="ct-section-label">REVIEWS</p>
            <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: "900", color: "#0A1628" }}>실제 승인 고객 후기</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "8px" }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: "18px" }}>⭐</span>)}
            </div>
          </div>

          {/* 메인 후기 슬라이더 */}
          <div style={{ background: "#0A1628", borderRadius: "20px", padding: "24px 20px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "20px", right: "28px", fontSize: "70px", opacity: 0.05, color: "#FFF", fontFamily: "serif" }}>"</div>
            <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: "50px", height: "50px", borderRadius: "50%", background: "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${GRADE_C[REVIEWS[reviewIdx].grade]}` }}>
                <span style={{ fontSize: "17px", fontWeight: "900", color: GRADE_C[REVIEWS[reviewIdx].grade] }}>{REVIEWS[reviewIdx].grade}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "16px", color: "#FFFFFF", lineHeight: "1.8", marginBottom: "14px" }}>"{REVIEWS[reviewIdx].text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#94A3B8" }}>{REVIEWS[reviewIdx].name}</span>
                  <span style={{ fontSize: "12px", color: "#475569" }}>{REVIEWS[reviewIdx].type}</span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#10B981", background: "#052E1C", padding: "3px 10px", borderRadius: "6px" }}>승인 {REVIEWS[reviewIdx].amount}</span>
                  <span style={{ fontSize: "13px", color: "#FCD34D" }}>★★★★★</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
            {REVIEWS.map((_, i) => (
              <button key={i} onClick={() => setReviewIdx(i)}
                style={{ width: i === reviewIdx ? "24px" : "8px", height: "8px", borderRadius: "999px", border: "none", cursor: "pointer", transition: "all 0.3s", background: i === reviewIdx ? "#EF4444" : "#CBD5E1" }} />
            ))}
          </div>

          <div className="ct-review-grid">
            {REVIEWS.map((r, i) => (
              <div key={i} onClick={() => setReviewIdx(i)}
                style={{ background: "#FFFFFF", borderRadius: "14px", padding: "18px", border: `1.5px solid ${i === reviewIdx ? "#EF4444" : "#E2E8F0"}`, cursor: "pointer", transition: "all 0.2s", boxShadow: i === reviewIdx ? "0 4px 20px rgba(239,68,68,0.1)" : "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `${GRADE_C[r.grade]}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${GRADE_C[r.grade]}` }}>
                      <span style={{ fontSize: "11px", fontWeight: "900", color: GRADE_C[r.grade] }}>{r.grade}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151" }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: "#10B981", background: "#F0FDF4", padding: "2px 8px", borderRadius: "4px" }}>{r.amount}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#64748B", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.text}</p>
                <p style={{ fontSize: "11px", color: "#FCD34D", marginTop: "8px" }}>★★★★★</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FAQ
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="ct-section" style={{ backgroundColor: "#FFFFFF" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <p className="ct-section-label">FAQ</p>
            <h2 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: "900", color: "#0A1628" }}>자주 묻는 질문</h2>
          </div>
          {[
            { q: "상담은 정말 무료인가요?", a: "네, 상담은 100% 무료입니다. 정책자금이 승인된 경우에만 성공 수수료가 발생하며, 미승인 시 착수금 전액 환불을 계약서에 명시합니다." },
            { q: "신용점수가 낮아도 신청 가능한가요?", a: "물론입니다. 신용점수가 낮아도 신청 가능한 자금이 다수 있습니다. 지역신보 보증부대출, 소진공 긴급경영안정자금 등 다양한 옵션이 있습니다." },
            { q: "사업 기간이 짧아도 됩니까?", a: "업력 1년 미만 창업자도 신청 가능한 자금이 있습니다. 소진공 창업자금, 중진공 창업기반지원자금 등 창업 전용 상품이 있습니다." },
            { q: "이미 대출이 있어도 추가로 받을 수 있나요?", a: "기대출 미적용 상품을 먼저 진행하면 추가 자금 조달이 가능합니다. 신청 순서가 곧 한도 차이이기 때문에 전략 수립이 핵심입니다." },
            { q: "신청 후 얼마나 걸리나요?", a: "상담 신청 후 영업일 기준 1일 이내 전담 매니저가 연락드립니다. 자금 집행까지는 보통 2~6주가 소요됩니다." },
            { q: "전국 어디서나 상담 가능한가요?", a: "네, 전국 어디서나 비대면으로 상담이 가능합니다. 방문 없이도 전화·카톡으로 모든 절차가 진행됩니다." },
          ].map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid #E2E8F0" }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 4px", background: "transparent", border: "none", cursor: "pointer", fontFamily: font, textAlign: "left" }}>
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          8️⃣ 하단 CTA (반복)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ padding: "64px 16px", background: "linear-gradient(160deg, #0A1628 0%, #0D2244 50%, #112D5E 100%)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", letterSpacing: "0.12em", marginBottom: "16px" }}>FREE CONSULTATION</p>
          <h2 className="ct-cta-h2" style={{ fontWeight: "900", color: "#FFFFFF", marginBottom: "14px", lineHeight: "1.25" }}>
            대표님 사업에 맞는<br />
            <span style={{ color: "#EF4444" }}>정책자금, 지금 확인하세요.</span>
          </h2>
          <p style={{ fontSize: "clamp(14px,2vw,16px)", color: "#94A3B8", marginBottom: "12px", lineHeight: "1.7" }}>
            간단한 설문 3분으로 맞춤 정책자금을 분석해드립니다.
          </p>
          <p style={{ fontSize: "13px", color: "#475569", marginBottom: "36px" }}>
            ✔ 상담비 0원 &nbsp;·&nbsp; ✔ 24시간 신청 &nbsp;·&nbsp; ✔ 미승인 착수금 100% 환불
          </p>

          {/* ★ CTA 버튼 ② — 3가지 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            {/* CTA A */}
            <button onClick={goSurvey} className="ct-cta-btn"
              style={{ background: "#EF4444", color: "#FFFFFF", border: "none", borderRadius: "14px", fontWeight: "900", cursor: "pointer", fontFamily: font, boxShadow: "0 10px 36px rgba(239,68,68,0.5)", width: "100%", maxWidth: "480px" }}>
              지금 가능한 정책자금 확인하기 →
            </button>
            {/* CTA B */}
            <button onClick={goSurvey}
              style={{ padding: "14px 36px", background: "rgba(255,255,255,0.08)", color: "#BFDBFE", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: font, width: "100%", maxWidth: "480px" }}>
              무료 상담 신청하기 — 1일 이내 매니저 연락
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          푸터
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{ backgroundColor: "#060E1A", padding: "28px 16px 0", borderTop: "1px solid #1E2D47" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", paddingBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <img src={LOGO_B64} alt="엠프론티어" width={44} height={44} style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              <p style={{ fontSize: "14px", fontWeight: "800", color: "#FFFFFF" }}>엠프론티어</p>
            </div>
            <p style={{ fontSize: "11px", color: "#475569" }}>경영컨설팅업 정식 등록 · 법인사업자 2024년 설립</p>
          </div>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
            <Link href="/consult/lookup" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>상담 조회</Link>
            <Link href="/client/login" style={{ fontSize: "11px", color: "#475569", textDecoration: "none" }}>회원 로그인</Link>
          </div>
          <p style={{ fontSize: "10px", color: "#334155", display: "none" }}>© 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved</p>
        </div>
        {/* Copyright - 맨 아래 */}
        <div style={{ borderTop: "1px solid #1E2D47", padding: "14px 0", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#475569" }}>© 2026 EMFRONTIER Operating Company, LLC. All Rights Reserved</p>
        </div>
      </footer>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          플로팅 버튼
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {floatVisible && (
        <button onClick={goSurvey} className="ct-float-btn"
          style={{ background: "#EF4444", color: "#FFFFFF", border: "none", borderRadius: "999px", fontWeight: "900", cursor: "pointer", fontFamily: font, boxShadow: "0 8px 28px rgba(239,68,68,0.55)" }}>
          🔥 무료 상담 신청
        </button>
      )}
    </div>
  );
}
