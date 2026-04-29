"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Noto Sans KR', sans-serif", color: "#1a1a1a", lineHeight: "1.9" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/" style={{ color: "#10B981", textDecoration: "none", fontSize: "14px" }}>← 홈으로</Link>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "8px" }}>개인정보처리방침</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "40px" }}>시행일: 2026년 1월 1일</p>

      <p style={{ marginBottom: "32px" }}>엠프론티어(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.</p>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제1조 (수집하는 개인정보 항목)</h2>
        <p>회사는 다음과 같은 개인정보를 수집할 수 있습니다.</p>
        <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>필수 항목: 이름, 연락처(전화번호), 이메일</li>
          <li>선택 항목: 사업자 정보, 매출 정보, 업종, 재무 관련 정보 등</li>
          <li>자동 수집 항목: 접속 IP, 쿠키, 접속 기록</li>
        </ol>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제2조 (개인정보 수집 및 이용 목적)</h2>
        <p>회사는 수집한 개인정보를 다음의 목적을 위해 사용합니다.</p>
        <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>정책자금 상담 및 무료 진단 제공</li>
          <li>컨설팅 서비스 제공 및 계약 이행</li>
          <li>고객 문의 응대 및 서비스 개선</li>
          <li>마케팅 및 광고 활용 (동의한 경우에 한함)</li>
        </ol>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제3조 (개인정보 보유 및 이용기간)</h2>
        <ol style={{ paddingLeft: "20px" }}>
          <li>회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</li>
          <li>단, 관련 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 기간 동안 보관합니다.</li>
        </ol>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제4조 (개인정보 제3자 제공)</h2>
        <p>회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.<br />단, 다음의 경우에는 예외로 합니다.</p>
        <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>법령에 의거하거나 수사기관의 요청이 있는 경우</li>
          <li>서비스 제공을 위해 필요한 범위 내에서 이용자가 사전 동의한 경우</li>
        </ol>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제5조 (개인정보 처리 위탁)</h2>
        <p>회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 이 경우 관련 법령에 따라 관리·감독합니다.</p>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제6조 (이용자의 권리)</h2>
        <p>이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 요청할 수 있으며 회사는 지체 없이 조치합니다.</p>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>제7조 (개인정보 보호책임자)</h2>
        <p>회사는 개인정보 보호 관련 문의를 처리하기 위해 담당자를 지정합니다.</p>
        <div style={{ background: "#f9fafb", padding: "16px 20px", borderRadius: "10px", marginTop: "12px" }}>
          <p>• 이메일: security@emfrontier.team</p>
          <p>• 연락처: 010-8268-0181</p>
        </div>
      </section>

      <div style={{ height: "1px", background: "#e5e7eb", margin: "40px 0" }} />

      <section style={{ marginBottom: "36px" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "14px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>마케팅 수신 동의</h2>
        <div style={{ background: "#f0fdf4", border: "1px solid #10B981", borderRadius: "12px", padding: "20px" }}>
          <p style={{ fontWeight: "700", marginBottom: "12px" }}>[선택] 마케팅 정보 수신 동의</p>
          <p>회사는 서비스 안내, 이벤트, 정책자금 관련 정보 제공 등을 위해<br />이메일, 문자(SMS), 전화 등을 통한 마케팅 정보를 발송할 수 있습니다.</p>
          <p style={{ marginTop: "12px", color: "#065f46" }}>이용자는 언제든지 수신 동의를 철회할 수 있으며,<br />동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>
        </div>
      </section>

      <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
        <p>본 방침은 2026년 1월 1일부터 시행됩니다.</p>
      </div>
    </div>
  );
}
