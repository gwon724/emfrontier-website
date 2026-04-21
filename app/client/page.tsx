"use client";
import { useState, useEffect, useRef } from "react";
import {
  getAllConsultations,
  loginClientUser,
  FONT,
  LOGO_B64,
  FUND_STATUS_COLORS,
  FUND_STATUS_LIST,
} from "@/lib/store";

const STAGE_LIST = [
  "접수완료", "상담중", "서류진행", "심사중", "승인완료", "집행중", "사후관리",
];

const DOC_COMMON = [
  { key: "사업자등록증", icon: "📄" },
  { key: "재무제표", icon: "📊" },
  { key: "부가세 자료", icon: "🧾" },
  { key: "통장내역", icon: "🏦" },
];
const DOC_FINANCE = [
  { key: "매출증빙", icon: "📈" },
  { key: "세금신고서", icon: "📋" },
];
const DOC_BUSINESS = [
  { key: "사업계획서", icon: "📝" },
  { key: "자금사용계획", icon: "💰" },
];

export default function ClientPage() {
  const [session, setSession] = useState<{ name: string; phone: string } | null>(null);
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [consultation, setConsultation] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [extraDocs, setExtraDocs] = useState<{ name: string }[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const bg = "#0B1120";
  const cardBg = "#1E293B";
  const border = "#334155";
  const accent = "#3B82F6";
  const green = "#10B981";

  useEffect(() => {
    const raw = localStorage.getItem("clientSession");
    if (raw) {
      const s = JSON.parse(raw);
      setSession(s);
      loadConsultation(s.name, s.phone);
    }
  }, []);

  const loadConsultation = (name: string, phone: string) => {
    const all = getAllConsultations();
    const c = all.find((c) => c.name === name && c.phone === phone);
    setConsultation(c || null);
    if (c?.assignedTo) {
      try {
        const rawAdmins = localStorage.getItem("adminAccounts");
        const admins = rawAdmins ? JSON.parse(rawAdmins) : [];
        const a = admins.find((a: any) => a.username === c.assignedTo);
        setAdminUser(a || null);
      } catch {}
    }
  };

  const handleLogin = () => {
    if (!loginName || !loginPhone || !loginPw) {
      setLoginError("모든 항목을 입력해주세요.");
      return;
    }
    const user = loginClientUser(loginName, loginPhone, loginPw);
    if (!user) {
      setLoginError("이름, 연락처, 비밀번호를 확인해주세요.");
      return;
    }
    const s = { name: loginName, phone: loginPhone };
    localStorage.setItem("clientSession", JSON.stringify(s));
    setSession(s);
    loadConsultation(loginName, loginPhone);
  };

  const handleLogout = () => {
    localStorage.removeItem("clientSession");
    setSession(null);
    setConsultation(null);
    setAdminUser(null);
  };

  const getStageIndex = (status: string) => STAGE_LIST.indexOf(status);

  const uploadFile = async (docName: string, file: File) => {
    if (!consultation) return;
    const chatId = adminUser?.telegramChatId;
    setUploadStatus((prev) => ({ ...prev, [docName]: "loading" }));
    if (!chatId) {
      setUploadStatus((prev) => ({ ...prev, [docName]: "error" }));
      alert("담당자 텔레그램이 설정되지 않았습니다. 직접 연락해주세요.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("chatId", chatId);
    fd.append("clientName", consultation.name);
    fd.append("consultationId", consultation.id);
    fd.append("docName", docName);
    try {
      const res = await fetch("/api/telegram-file", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setUploadStatus((prev) => ({ ...prev, [docName]: "done" }));
      } else {
        setUploadStatus((prev) => ({ ...prev, [docName]: "error" }));
      }
    } catch {
      setUploadStatus((prev) => ({ ...prev, [docName]: "error" }));
    }
  };

  const handleDocClick = (docName: string) => {
    const input = fileInputRefs.current[docName];
    if (input) input.click();
  };

  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(docName, file);
    e.target.value = "";
  };

  const DocButton = ({ docName, icon }: { docName: string; icon: string }) => {
    const status = uploadStatus[docName] || "idle";
    return (
      <>
        <input
          type="file"
          ref={(el) => { fileInputRefs.current[docName] = el; }}
          style={{ display: "none" }}
          onChange={(e) => handleFileChange(docName, e)}
        />
        <button
          onClick={() => handleDocClick(docName)}
          style={{
            background:
              status === "done" ? "#064E3B" : status === "error" ? "#7F1D1D" : "#0F172A",
            border: `1px solid ${status === "done" ? green : status === "error" ? "#EF4444" : border}`,
            borderRadius: 8,
            padding: "12px 8px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            width: "100%",
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{docName}</span>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {status === "loading"
              ? "⏳ 전송중..."
              : status === "done"
              ? "✅ 전송완료"
              : status === "error"
              ? "❌ 재시도"
              : "클릭하여 업로드"}
          </span>
        </button>
      </>
    );
  };

  // 로그인 화면
  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          padding: 16,
        }}
      >
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 32,
            width: "100%",
            maxWidth: 380,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            {LOGO_B64 && (
              <img src={LOGO_B64} alt="엠프론티어" style={{ height: 40, marginBottom: 8 }} />
            )}
            <div style={{ color: "white", fontWeight: 700, fontSize: 20 }}>고객 포털</div>
            <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>엠프론티어</div>
          </div>
          {[
            { label: "이름", value: loginName, setter: setLoginName, placeholder: "대표자 이름" },
            {
              label: "연락처",
              value: loginPhone,
              setter: setLoginPhone,
              placeholder: "010-0000-0000",
            },
            {
              label: "비밀번호",
              value: loginPw,
              setter: setLoginPw,
              placeholder: "비밀번호",
              type: "password",
            },
          ].map((f) => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <label
                style={{ color: "#94A3B8", fontSize: 13, display: "block", marginBottom: 4 }}
              >
                {f.label}
              </label>
              <input
                type={f.type || "text"}
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                placeholder={f.placeholder}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{
                  width: "100%",
                  background: "#0F172A",
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "white",
                  fontSize: 15,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
          ))}
          {loginError && (
            <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12 }}>{loginError}</div>
          )}
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              background: accent,
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 0",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  const currentStageIdx = consultation ? getStageIndex(consultation.status) : -1;

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: FONT, paddingBottom: 40 }}>
      {/* 헤더 */}
      <div
        style={{
          background: cardBg,
          borderBottom: `1px solid ${border}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {LOGO_B64 && (
            <img src={LOGO_B64} alt="엠프론티어" style={{ height: 32 }} />
          )}
          <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>고객 포털</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "#374151",
            color: "#D1D5DB",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px" }}>
        {!consultation ? (
          <div
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: 24,
              color: "#94A3B8",
              textAlign: "center",
            }}
          >
            등록된 상담 정보가 없습니다.
            <br />
            담당자에게 문의해주세요.
          </div>
        ) : (
          <>
            {/* 상담 정보 카드 */}
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 8 }}>📋 상담 정보</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "이름", value: consultation.name },
                  { label: "접수번호", value: consultation.id },
                  {
                    label: "업종",
                    value: consultation.businessType || consultation.industry || "-",
                  },
                  {
                    label: "희망금액",
                    value: consultation.desiredAmount || consultation.amount || "-",
                  },
                  {
                    label: "담당자",
                    value: consultation.assignedName || "배정 대기",
                  },
                  { label: "담당자 연락처", value: adminUser?.phone || "-" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ color: "#64748B", fontSize: 11 }}>{item.label}</div>
                    <div
                      style={{ color: "white", fontSize: 14, fontWeight: 500, marginTop: 2 }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 진행 단계 타임라인 */}
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 16 }}>📍 진행 단계</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {STAGE_LIST.map((stage, idx) => {
                  const isDone = currentStageIdx > idx;
                  const isCurrent = currentStageIdx === idx;
                  return (
                    <div
                      key={stage}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: isDone ? green : isCurrent ? accent : "#1E293B",
                            border: `2px solid ${isDone ? green : isCurrent ? accent : border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                            color: "white",
                          }}
                        >
                          {isDone ? "✓" : isCurrent ? "●" : "○"}
                        </div>
                        {idx < STAGE_LIST.length - 1 && (
                          <div
                            style={{
                              width: 2,
                              height: 28,
                              background: isDone ? green : border,
                              marginTop: 2,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          paddingBottom: idx < STAGE_LIST.length - 1 ? 16 : 0,
                          paddingTop: 4,
                        }}
                      >
                        <div
                          style={{
                            color: isCurrent ? "white" : isDone ? "#94A3B8" : "#475569",
                            fontWeight: isCurrent ? 700 : 400,
                            fontSize: 14,
                          }}
                        >
                          {stage}
                        </div>
                        {isCurrent && (
                          <div style={{ color: accent, fontSize: 11, marginTop: 2 }}>
                            현재 단계
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 자금 집행 현황 */}
            {consultation.funds && consultation.funds.length > 0 && (
              <div
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 12 }}>
                  💰 자금 집행 현황
                </div>
                {consultation.funds.map((fund: any) => {
                  const statusIdx = FUND_STATUS_LIST.indexOf(fund.status);
                  const total = FUND_STATUS_LIST.filter(
                    (s) => s !== "부결" && s !== "승인"
                  ).length;
                  const progress =
                    fund.status === "부결"
                      ? 100
                      : fund.status === "승인"
                      ? 100
                      : Math.round(((statusIdx + 1) / total) * 100);
                  const statusColor = FUND_STATUS_COLORS[fund.status] || "#94A3B8";
                  const isNegative = fund.status === "부결";
                  return (
                    <div
                      key={fund.id}
                      style={{
                        background: "#0F172A",
                        border: `1px solid ${isNegative ? "#EF4444" : border}`,
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                            {fund.fundName}
                          </div>
                          {fund.institution && (
                            <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                              {fund.institution}
                            </div>
                          )}
                          {fund.amount && (
                            <div style={{ color: "#94A3B8", fontSize: 12 }}>{fund.amount}</div>
                          )}
                        </div>
                        <span
                          style={{
                            background: statusColor + "22",
                            color: statusColor,
                            border: `1px solid ${statusColor}`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {fund.status}
                        </span>
                      </div>
                      {/* 프로그레스 바 */}
                      <div
                        style={{
                          background: "#1E293B",
                          borderRadius: 4,
                          height: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 4,
                            width: `${Math.min(progress, 100)}%`,
                            background: isNegative
                              ? "#EF4444"
                              : fund.status === "승인"
                              ? green
                              : accent,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 4,
                        }}
                      >
                        {FUND_STATUS_LIST.map((s) => (
                          <div
                            key={s}
                            style={{
                              fontSize: 9,
                              color: fund.status === s ? statusColor : "#334155",
                              textAlign: "center",
                            }}
                          >
                            ·
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 서류 제출 */}
            <div
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ color: "#94A3B8", fontSize: 12, marginBottom: 16 }}>📎 서류 제출</div>

              {/* 공통 서류 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {DOC_COMMON.map((d) => (
                  <DocButton key={d.key} docName={d.key} icon={d.icon} />
                ))}
              </div>

              {/* 재무 아코디언 */}
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setFinanceOpen(!financeOpen)}
                  style={{
                    width: "100%",
                    background: "#0F172A",
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#94A3B8",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span>📁 재무 서류</span>
                  <span>{financeOpen ? "▲" : "▼"}</span>
                </button>
                {financeOpen && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    {DOC_FINANCE.map((d) => (
                      <DocButton key={d.key} docName={d.key} icon={d.icon} />
                    ))}
                  </div>
                )}
              </div>

              {/* 사업 아코디언 */}
              <div style={{ marginBottom: 10 }}>
                <button
                  onClick={() => setBusinessOpen(!businessOpen)}
                  style={{
                    width: "100%",
                    background: "#0F172A",
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#94A3B8",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 14,
                  }}
                >
                  <span>📁 사업 서류</span>
                  <span>{businessOpen ? "▲" : "▼"}</span>
                </button>
                {businessOpen && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    {DOC_BUSINESS.map((d) => (
                      <DocButton key={d.key} docName={d.key} icon={d.icon} />
                    ))}
                  </div>
                )}
              </div>

              {/* 추가 서류 */}
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => setExtraDocs((prev) => [...prev, { name: "" }])}
                  style={{
                    background: "#0F172A",
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: "8px 16px",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: 13,
                    width: "100%",
                  }}
                >
                  + 추가 서류
                </button>
                {extraDocs.map((doc, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      value={doc.name}
                      onChange={(e) =>
                        setExtraDocs((prev) =>
                          prev.map((d, i) => (i === idx ? { name: e.target.value } : d))
                        )
                      }
                      placeholder="서류명 입력"
                      style={{
                        flex: 1,
                        background: "#0F172A",
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        padding: "8px 12px",
                        color: "white",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                    {doc.name && <DocButton docName={doc.name} icon="📄" />}
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 연락처 */}
            {adminUser?.phone && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  color: "#64748B",
                  fontSize: 13,
                }}
              >
                📞 담당자:{" "}
                <a href={`tel:${adminUser.phone}`} style={{ color: accent }}>
                  {adminUser.phone}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
