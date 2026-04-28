"use client";
import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FONT } from "@/lib/store";

const font = FONT;

const DOC_LIST = [
  { id: "id", label: "신분증 (사업자 대표)" },
  { id: "biz", label: "사업자등록증" },
  { id: "tax", label: "부가세 과세표준증명원" },
  { id: "income", label: "소득금액증명원" },
  { id: "bank", label: "통장 사본" },
  { id: "financial", label: "재무제표" },
  { id: "other", label: "기타 서류" },
];

function UploadForm() {
  const params = useSearchParams();
  const tokenStr = params.get("token") || "";
  const [tokenData, setTokenData] = useState<{name: string; phone: string; consultationId: string} | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [files, setFiles] = useState<{ docId: string; file: File }[]>([]);

  useEffect(() => {
    if (!tokenStr) { setTokenChecked(true); return; }
    fetch(`/api/upload-token?token=${tokenStr}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) setTokenData({ name: d.name, phone: d.phone, consultationId: d.consultationId });
        setTokenChecked(true);
      })
      .catch(() => setTokenChecked(true));
  }, [tokenStr]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [memo, setMemo] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!tokenChecked) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748B", fontSize: "14px" }}>⏳ 링크 확인 중...</p>
      </div>
    );
  }

  if (!tokenStr || !tokenData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "32px 24px", maxWidth: "400px", width: "100%", textAlign: "center", border: "1px solid #334155" }}>
          <p style={{ fontSize: "32px", marginBottom: "16px" }}>⚠️</p>
          <p style={{ fontSize: "18px", fontWeight: "800", color: "#F1F5F9", marginBottom: "10px" }}>유효하지 않은 링크</p>
          <p style={{ fontSize: "14px", color: "#94A3B8" }}>링크가 만료되었거나 유효하지 않습니다.<br />담당 매니저에게 문의해주세요.</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = (docId: string, file: File) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.docId !== docId);
      return [...filtered, { docId, file }];
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) { setError("최소 1개 이상의 서류를 첨부해주세요."); return; }
    setUploading(true);
    setError("");

    try {
      let allOk = true;
      for (const { docId, file } of files) {
        const docLabel = DOC_LIST.find(d => d.id === docId)?.label || docId;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("consultationId", tokenData.consultationId);
        formData.append("name", tokenData.name);
        formData.append("docType", docLabel);
        formData.append("memo", memo);

        const res = await fetch("/api/telegram-file", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.ok) { allOk = false; }
      }

      if (allOk) {
        await fetch("/api/upload-token", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({action:"use", token:tokenStr}) }).catch(()=>{});
        setDone(true);
      } else {
        setError("일부 파일 전송에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    }
    setUploading(false);
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: font }}>
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "40px 24px", maxWidth: "400px", width: "100%", textAlign: "center", border: "1px solid #10B981" }}>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>✅</p>
          <p style={{ fontSize: "20px", fontWeight: "800", color: "#34D399", marginBottom: "8px" }}>서류 제출 완료!</p>
          <p style={{ fontSize: "14px", color: "#94A3B8", lineHeight: "1.6" }}>
            {tokenData.name} 대표님의 서류가<br />
            성공적으로 전달되었습니다.<br />
            담당 매니저가 확인 후 연락드리겠습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0B1120", fontFamily: font, padding: "24px 16px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", color: "#64748B", marginBottom: "6px" }}>엠프론티어 서류 제출</p>
          <p style={{ fontSize: "22px", fontWeight: "800", color: "#F1F5F9" }}>📎 서류 제출</p>
          <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "6px" }}>
            <span style={{ color: "#60A5FA", fontWeight: "700" }}>{tokenData.name}</span> 대표님
          </p>
        </div>

        {/* 서류 목록 */}
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", border: "1px solid #334155", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#94A3B8", marginBottom: "16px" }}>제출할 서류를 선택하고 파일을 첨부해주세요</p>
          {DOC_LIST.map(doc => {
            const attached = files.find(f => f.docId === doc.id);
            return (
              <div key={doc.id} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", backgroundColor: attached ? "rgba(16,185,129,0.1)" : "#0F172A", borderRadius: "10px", border: `1px solid ${attached ? "#10B981" : "#334155"}` }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: attached ? "#34D399" : "#CBD5E1", margin: 0 }}>
                      {attached ? "✅ " : "📄 "}{doc.label}
                    </p>
                    {attached && <p style={{ fontSize: "11px", color: "#64748B", margin: "2px 0 0" }}>{attached.file.name}</p>}
                  </div>
                  <button
                    onClick={() => fileRefs.current[doc.id]?.click()}
                    style={{ padding: "6px 12px", backgroundColor: attached ? "#065F46" : "#1E3A5F", color: attached ? "#34D399" : "#60A5FA", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}
                  >
                    {attached ? "재선택" : "파일 선택"}
                  </button>
                  <input
                    type="file"
                    ref={el => { fileRefs.current[doc.id] = el; }}
                    style={{ display: "none" }}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={e => { if (e.target.files?.[0]) handleFileSelect(doc.id, e.target.files[0]); }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 메모 */}
        <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "20px", border: "1px solid #334155", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#94A3B8", marginBottom: "10px" }}>💬 전달 메모 (선택)</p>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="담당자에게 전달할 내용을 입력해주세요"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "10px", fontSize: "14px", color: "#F1F5F9", fontFamily: font, boxSizing: "border-box", outline: "none", resize: "none" }}
          />
        </div>

        {/* 선택된 파일 수 */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <p style={{ fontSize: "13px", color: "#64748B" }}>
            {files.length > 0 ? <span style={{ color: "#34D399", fontWeight: "700" }}>{files.length}개 파일 선택됨</span> : "파일을 선택해주세요"}
          </p>
        </div>

        {error && <p style={{ color: "#EF4444", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
          style={{ width: "100%", padding: "16px", backgroundColor: uploading ? "#334155" : files.length === 0 ? "#1E293B" : "#2563EB", color: files.length === 0 ? "#475569" : "#FFF", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "800", cursor: files.length === 0 ? "not-allowed" : "pointer", fontFamily: font }}
        >
          {uploading ? "⏳ 전송 중..." : `📤 서류 제출하기 (${files.length}개)`}
        </button>

        <p style={{ fontSize: "11px", color: "#475569", textAlign: "center", marginTop: "12px" }}>
          이 링크는 72시간 동안 유효합니다
        </p>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#0B1120" }} />}>
      <UploadForm />
    </Suspense>
  );
}
