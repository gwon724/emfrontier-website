"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentAdmin,
  getAllAdmins,
  addAdmin,
  deleteAdmin,
  updateAdmin,
  AdminAccount,
  FONT,
} from "@/lib/store";

const font = FONT;

export default function SettingPage() {
  const router = useRouter();
  const [me, setMe] = useState<AdminAccount | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "admin" as "admin" | "superadmin" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", password: "", role: "admin" as "admin" | "superadmin" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const admin = getCurrentAdmin();
    if (!admin) { router.replace("/team/login"); return; }
    if (admin.role !== "superadmin") { router.replace("/admin/dashboard"); return; }
    setMe(admin);
    setAdmins(getAllAdmins());
  }, [router]);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3000); };
  const showErr = (text: string) => { setError(text); setTimeout(() => setError(""), 3000); };

  const handleAdd = () => {
    if (!form.username.trim()) return showErr("아이디를 입력해주세요");
    if (!form.password.trim()) return showErr("비밀번호를 입력해주세요");
    if (!form.name.trim()) return showErr("이름을 입력해주세요");
    if (getAllAdmins().find(a => a.username === form.username)) return showErr("이미 존재하는 아이디입니다");
    addAdmin({ username: form.username, password: form.password, name: form.name, role: form.role });
    setAdmins(getAllAdmins());
    setForm({ username: "", password: "", name: "", role: "admin" });
    showMsg("✅ 어드민 계정이 추가되었습니다");
  };

  const handleDelete = (id: string) => {
    if (id === me?.id) return showErr("본인 계정은 삭제할 수 없습니다");
    if (!confirm("정말 삭제하시겠습니까?")) return;
    deleteAdmin(id);
    setAdmins(getAllAdmins());
    showMsg("🗑️ 계정이 삭제되었습니다");
  };

  const handleEdit = (a: AdminAccount) => {
    setEditId(a.id);
    setEditForm({ name: a.name, password: "", role: a.role });
  };

  const handleEditSave = () => {
    if (!editId) return;
    const data: Partial<AdminAccount> = { name: editForm.name, role: editForm.role };
    if (editForm.password.trim()) data.password = editForm.password;
    updateAdmin(editId, data);
    setAdmins(getAllAdmins());
    setEditId(null);
    showMsg("✅ 계정이 수정되었습니다");
  };

  if (!me) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F0F4FF", fontFamily: font }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: "#1E3A8A", padding: "0 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => router.push("/admin/dashboard")}
              style={{ background: "none", border: "none", color: "#BFDBFE", cursor: "pointer", fontSize: "14px" }}>
              ← 대시보드
            </button>
            <span style={{ color: "#BFDBFE", fontSize: "14px" }}>|</span>
            <span style={{ color: "#fff", fontWeight: "800", fontSize: "16px" }}>⚙️ 어드민 계정 관리</span>
          </div>
          <span style={{ fontSize: "12px", color: "#93C5FD" }}>
            {me.name} ({me.role === "superadmin" ? "최고관리자" : "관리자"})
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 16px" }}>

        {/* 알림 */}
        {msg && <div style={{ backgroundColor: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#065F46", fontWeight: "700", fontSize: "14px" }}>{msg}</div>}
        {error && <div style={{ backgroundColor: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", color: "#DC2626", fontWeight: "700", fontSize: "14px" }}>{error}</div>}

        {/* 새 계정 추가 */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1E3A8A", marginBottom: "20px" }}>➕ 새 어드민 계정 추가</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>아이디</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="아이디 입력"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", fontFamily: font, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>비밀번호</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="비밀번호 입력"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", fontFamily: font, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>이름</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="이름 입력"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", fontFamily: font, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "6px" }}>권한</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as "admin" | "superadmin" }))}
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #E2E8F0", borderRadius: "10px", fontSize: "14px", fontFamily: font, boxSizing: "border-box", backgroundColor: "#fff" }}>
                <option value="admin">관리자</option>
                <option value="superadmin">최고관리자</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd}
            style={{ padding: "12px 28px", backgroundColor: "#1E3A8A", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "800", cursor: "pointer", fontFamily: font }}>
            + 계정 추가
          </button>
        </div>

        {/* 계정 목록 */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#1E3A8A", marginBottom: "20px" }}>👥 어드민 계정 목록 ({admins.length}명)</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {admins.map(a => (
              <div key={a.id} style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 20px", backgroundColor: a.id === me.id ? "#EFF6FF" : "#FAFBFF" }}>
                {editId === a.id ? (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>이름</label>
                        <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", border: "2px solid #DBEAFE", borderRadius: "8px", fontSize: "13px", fontFamily: font, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>새 비밀번호 (선택)</label>
                        <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                          placeholder="변경 시에만 입력"
                          style={{ width: "100%", padding: "8px 12px", border: "2px solid #DBEAFE", borderRadius: "8px", fontSize: "13px", fontFamily: font, boxSizing: "border-box" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#374151", display: "block", marginBottom: "4px" }}>권한</label>
                        <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as "admin" | "superadmin" }))}
                          style={{ width: "100%", padding: "8px 12px", border: "2px solid #DBEAFE", borderRadius: "8px", fontSize: "13px", fontFamily: font, boxSizing: "border-box", backgroundColor: "#fff" }}>
                          <option value="admin">관리자</option>
                          <option value="superadmin">최고관리자</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleEditSave}
                        style={{ padding: "8px 20px", backgroundColor: "#2563EB", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                        저장
                      </button>
                      <button onClick={() => setEditId(null)}
                        style={{ padding: "8px 20px", backgroundColor: "#F1F5F9", color: "#374151", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: a.role === "superadmin" ? "#1E3A8A" : "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "800", fontSize: "16px" }}>
                        {a.name[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: "800", color: "#0F172A", fontSize: "15px" }}>
                          {a.name}
                          {a.id === me.id && <span style={{ fontSize: "11px", color: "#2563EB", marginLeft: "6px", backgroundColor: "#DBEAFE", padding: "2px 8px", borderRadius: "999px" }}>나</span>}
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748B" }}>@{a.username} · {a.role === "superadmin" ? "⭐ 최고관리자" : "👤 관리자"}</p>
                        <p style={{ fontSize: "11px", color: "#94A3B8" }}>가입: {new Date(a.createdAt).toLocaleDateString("ko-KR")}{a.lastLogin && ` · 최근 로그인: ${new Date(a.lastLogin).toLocaleDateString("ko-KR")}`}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleEdit(a)}
                        style={{ padding: "7px 16px", backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                        수정
                      </button>
                      {a.id !== me.id && (
                        <button onClick={() => handleDelete(a.id)}
                          style={{ padding: "7px 16px", backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
