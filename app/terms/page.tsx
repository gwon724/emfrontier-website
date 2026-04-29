"use client";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "'Noto Sans KR', sans-serif", color: "#1a1a1a", lineHeight: "1.8" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/" style={{ color: "#10B981", textDecoration: "none", fontSize: "14px" }}>← 홈으로</Link>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "8px" }}>개인정보 수집 및 이용 동의</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "40px" }}>최종 업데이트: 2026년 4월 29일</p>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>1. 수집하는 개인정보 항목</h2>
        <p>엠프론티어는 정책자금 상담 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
        <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>필수 항목: 성명, 연락처(휴대폰번호), 업종, 희망 금액</li>
          <li>선택 항목: 이메일 주소, 사업자등록번호</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>2. 개인정보의 수집 및 이용 목적</h2>
        <ul style={{ paddingLeft: "20px" }}>
          <li>정책자금 상담 신청 접수 및 처리</li>
          <li>상담 일정 안내 및 담당 매니저 배정</li>
          <li>서비스 관련 공지사항 및 안내 문자 발송</li>
          <li>정책자금 신청 진행 현황 안내</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>3. 개인정보의 보유 및 이용 기간</h2>
        <p>수집된 개인정보는 서비스 이용 종료 후 <strong>3년간</strong> 보관되며, 이후 지체 없이 파기됩니다.</p>
        <p style={{ marginTop: "8px" }}>단, 관련 법령에 의해 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</p>
        <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>계약 또는 청약철회에 관한 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>4. 개인정보의 제3자 제공</h2>
        <p>엠프론티어는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다.</p>
        <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>5. 개인정보 처리 위탁</h2>
        <p>엠프론티어는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>수탁업체</th>
              <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>위탁 업무</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>솔라피(Solapi)</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>문자 및 카카오 알림톡 발송</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <ul style={{ marginTop: "12px", paddingLeft: "20px" }}>
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정·삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
          <li>개인정보 동의 철회</li>
        </ul>
        <p style={{ marginTop: "12px" }}>권리 행사는 이메일 또는 전화로 요청하실 수 있으며, 지체 없이 처리하겠습니다.</p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>7. 개인정보 보호 책임자</h2>
        <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "12px" }}>
          <p><strong>회사명:</strong> 엠프론티어</p>
          <p><strong>담당자:</strong> 손권찬</p>
          <p><strong>연락처:</strong> 010-8211-4291</p>
          <p><strong>이메일:</strong> admin@emfrontier.team</p>
        </div>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", borderBottom: "2px solid #10B981", paddingBottom: "8px" }}>8. 동의 거부 권리 및 불이익</h2>
        <p>개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 단, 필수 항목에 동의하지 않을 경우 상담 서비스 이용이 제한될 수 있습니다.</p>
      </section>

      <div style={{ background: "#f0fdf4", border: "1px solid #10B981", borderRadius: "12px", padding: "20px", marginTop: "40px", textAlign: "center" }}>
        <p style={{ color: "#065f46", fontSize: "14px" }}>본 개인정보처리방침은 2026년 4월 29일부터 적용됩니다.</p>
        <p style={{ color: "#065f46", fontSize: "14px", marginTop: "4px" }}>문의: <strong>010-8211-4291</strong> | admin@emfrontier.team</p>
      </div>
    </div>
  );
}
