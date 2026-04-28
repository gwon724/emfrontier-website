"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LOGO_B64, getAllUsers, calcGrade, STATUS_COLORS, STATUS_LIST,
  FONT, UserRecord, deleteUser, getCurrentAdmin, AdminAccount,
  getAllConsultations, updateConsultation, registerUser, upsertUser,
  CONSULT_STATUS_LIST, CONSULT_STATUS_COLORS, Consultation, ConsultStatus,
  syncAllToServer, restoreFromServer, assignConsultation, getAllAdmins,
  FundProgress, FundStatus, FUND_STATUS_LIST, FUND_STATUS_COLORS,
  createRegisterToken, createUploadToken, saveAllUsers, getAllFunds, FundProduct,
} from "@/lib/store";

const font = FONT;
type Tab = "members" | "consultations" | "naver" | "all-consults";
type ConsultTab = "waiting" | "mine";

function calcConsultGrade(c: Consultation): { grade: string; score: number } {
  let s = 0;
  const nice = Number(c.nice_score) || 0;
  const rev = Number(c.annual_revenue) || 0;
  const debt = Number(c.currentDebt) || 0;
  if (nice >= 900) s += 40; else if (nice >= 800) s += 30; else if (nice >= 700) s += 20; else if (nice >= 600) s += 10;
  if (rev >= 500000000) s += 30; else if (rev >= 200000000) s += 20; else if (rev >= 100000000) s += 15; else if (rev >= 50000000) s += 8;
  if (debt === 0) s += 20; else if (debt < 50000000) s += 15; else if (debt < 100000000) s += 10; else if (debt < 200000000) s += 5;
  const grade = s >= 75 ? "A" : s >= 55 ? "B" : s >= 35 ? "C" : "D";
  return { grade, score: s };
}
const gradeColor = (g: string) =>
  g === "A" ? "#16A34A" : g === "B" ? "#3B82F6" : g === "C" ? "#D97706" : "#EF4444";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("members");
  const [mobileNav, setMobileNav] = useState(false);
  const [manageSubTab, setManageSubTab] = useState<"all-consults" | "users">("all-consults");
  const [manageSearch, setManageSearch] = useState("");
  const [clientPortalUsers, setClientPortalUsers] = useState<Array<{id:string;name:string;phone:string;email?:string;password:string;createdAt:string}>>([]);
  const [showPortalUsers, setShowPortalUsers] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", phone: "", email: "", password: "" });
  const [newMemberSaving, setNewMemberSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [manageStatusFilter, setManageStatusFilter] = useState("");
  const [manageAdminFilter, setManageAdminFilter] = useState("");
  const [naverData, setNaverData] = useState<{campaigns?: {data?: unknown}; trend?: {data?: unknown}; stat?: {data?: unknown}}>({});
  const [naverLoading, setNaverLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userEmailSending, setUserEmailSending] = useState(false);
  const [userEmailSent, setUserEmailSent] = useState(false);
  const [userEmailStatus, setUserEmailStatus] = useState("접수대기");
  const [userAlimSending, setUserAlimSending] = useState(false);
  const [userAlimSent, setUserAlimSent] = useState(false);
  const [userAlimTemplate, setUserAlimTemplate] = useState("register");
  // 회원 수정 폼 상태
  const [uName, setUName] = useState("");
  const [uPhone, setUPhone] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uAge, setUAge] = useState("");
  const [uGender, setUGender] = useState("");
  const [uBizType, setUBizType] = useState("");
  const [uBizPeriod, setUBizPeriod] = useState("");
  const [uRevenue, setURevenue] = useState("");
  const [uNice, setUNice] = useState("");
  const [uKcb, setUKcb] = useState("");
  const [uDebtFirst, setUDebtFirst] = useState("");
  const [uDebtSecond, setUDebtSecond] = useState("");
  const [uDebtCard, setUDebtCard] = useState("");
  const [uDebtCapital, setUDebtCapital] = useState("");
  const [uDebtPolicy, setUDebtPolicy] = useState("");
  const [uDesiredAmount, setUDesiredAmount] = useState("");
  const [uMemo, setUMemo] = useState("");
  const [uSaved, setUSaved] = useState(false);
  const [newUserFundName, setNewUserFundName] = useState("");
  const [newUserFundAmount, setNewUserFundAmount] = useState("");
  // AI 보고서
  const [aiReport, setAiReport] = useState("");
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [showAiReport, setShowAiReport] = useState(false);
  const [userDocList, setUserDocList] = useState<string[]>([]);
  const [showUserDocChecklist, setShowUserDocChecklist] = useState(false);
  const [userUploadLinkSending, setUserUploadLinkSending] = useState(false);
  const [userUploadLinkSent, setUserUploadLinkSent] = useState(false);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", age: "", gender: "남성", annual_revenue: "", nice_score: "", kcb_score: "" });
  const [addUserSaving, setAddUserSaving] = useState(false);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("이름, 이메일, 비밀번호는 필수입니다");
      return;
    }
    setAddUserSaving(true);
    const user: import("@/lib/store").UserRecord = {
      id: `user_${Date.now()}`,
      email: newUser.email,
      password: newUser.password,
      name: newUser.name,
      age: newUser.age,
      gender: newUser.gender,
      annual_revenue: newUser.annual_revenue,
      debt_policy: "0",
      debt_bank1: "0",
      debt_bank2: "0",
      debt_card: "0",
      nice_score: newUser.nice_score,
      kcb_score: newUser.kcb_score,
      registeredAt: new Date().toISOString(),
    };
    const all = getAllUsers();
    all.push(user);
    localStorage.setItem("users", JSON.stringify(all));
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "users", value: all }),
    }).catch(() => {});
    refresh();
    setShowAddUser(false);
    setNewUser({ name: "", email: "", password: "", age: "", gender: "남성", annual_revenue: "", nice_score: "", kcb_score: "" });
    setAddUserSaving(false);
  };

  const [users, setUsers] = useState<UserRecord[]>([]);

  const sendUserEmail = async () => {
    if (!selectedUser?.email) { alert("이메일 주소가 없어요!"); return; }
    setUserEmailSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedUser.email,
          name: selectedUser.name,
          status: userEmailStatus,
          extra: selectedUser.adminMemo || undefined,
          date: undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) { setUserEmailSent(true); setTimeout(() => setUserEmailSent(false), 3000); }
      else alert(`발송 실패: ${JSON.stringify(data.error)}`);
    } catch { alert("네트워크 오류"); }
    setUserEmailSending(false);
  };

  const sendUserAlimtalk = async () => {
    if (!selectedUser) return;
    // 회원의 연락처 우선, 없으면 상담에서 찾기
    const phone = (selectedUser as UserRecord & { phone?: string }).phone ||
      getAllConsultations().find(c => c.name === selectedUser.name)?.phone || "";
    if (!phone) { alert("연락처가 없어 알림톡을 보낼 수 없어요."); return; }
    setUserAlimSending(true);
    try {
      const res = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: {
            name: selectedUser.name,
            phone,
            id: selectedUser.id,
            businessType: "-",
            desiredAmount: "-",
            manager: admin?.name,
            managerPhone: admin?.phone,
          },
          templateType: userAlimTemplate,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserAlimSent(true);
        showSuccess("✅ 알림톡 발송 완료");
        setTimeout(() => setUserAlimSent(false), 3000);
      } else {
        showFailModal(selectedUser.name, phone, data.error || "오류",
          async () => {
            const r = await fetch("/api/alimtalk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultation: { name: selectedUser.name, phone, id: selectedUser.id, manager: admin?.name, managerPhone: admin?.phone }, templateType: userAlimTemplate }),
            });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            showSuccess("✅ 알림톡 재발송 성공");
          }
        );
      }
    } catch { alert("네트워크 오류"); }
    setUserAlimSending(false);
  };
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [filterGrade, setFilterGrade] = useState("전체");
  const [filterAssignee, setFilterAssignee] = useState("전체");
  const [sortBy, setSortBy] = useState<"name" | "date" | "grade">("date");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 클라이언트 직접 생성 모달
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientBizType, setNewClientBizType] = useState("");
  const [newClientBizPeriod, setNewClientBizPeriod] = useState("");
  const [newClientRevenue, setNewClientRevenue] = useState("");
  const [newClientNice, setNewClientNice] = useState("");
  const [newClientKcb, setNewClientKcb] = useState("");
  const [newClientDebt1, setNewClientDebt1] = useState(""); // 1금융권
  const [newClientDebt2, setNewClientDebt2] = useState(""); // 2금융권
  const [newClientDebtCard, setNewClientDebtCard] = useState(""); // 카드론
  const [newClientDebtCapital, setNewClientDebtCapital] = useState(""); // 캐피탈
  const [newClientDebtPolicy, setNewClientDebtPolicy] = useState(""); // 정책자금
  const [newClientDesired, setNewClientDesired] = useState("");
  const [createClientLoading, setCreateClientLoading] = useState(false);
  const [createClientError, setCreateClientError] = useState("");

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      setCreateClientError("이름과 연락처는 필수입니다."); return;
    }
    setCreateClientLoading(true); setCreateClientError("");
    try {
      const phone = newClientPhone.trim().replace(/-/g,"");
      const totalDebt = String(
        [newClientDebt1, newClientDebt2, newClientDebtCard, newClientDebtCapital, newClientDebtPolicy]
          .reduce((s, v) => s + (Number(v) || 0), 0)
      );
      // clientUsers에 추가
      const dbRes = await fetch("/api/db?key=clientUsers").then(r => r.json()).catch(() => ({ value: null }));
      const clientUsers: Array<{id:string;name:string;phone:string;email?:string;password:string;createdAt:string}> = dbRes.value || [];
      if (clientUsers.find(u => u.phone === phone)) {
        setCreateClientError("이미 등록된 연락처입니다."); setCreateClientLoading(false); return;
      }
      const newCU = { id: `CU-${Date.now()}`, name: newClientName.trim(), phone, password: newClientPassword || "", createdAt: new Date().toISOString() };
      clientUsers.push(newCU);
      await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "clientUsers", value: clientUsers }) });
      localStorage.setItem("clientUsers", JSON.stringify(clientUsers));

      // users DB에도 추가 (소호 등급 분류 반영)
      const usersRes = await fetch("/api/db?key=users").then(r => r.json()).catch(() => ({ value: null }));
      const allUsers = usersRes.value || JSON.parse(localStorage.getItem("users") || "[]");
      const existUser = allUsers.find((u: {name:string; phone?:string}) => u.name === newClientName.trim() && u.phone === phone);
      if (!existUser) {
        const newUserRecord = {
          id: `user_${Date.now()}`,
          email: "",
          password: newClientPassword || "",
          name: newClientName.trim(),
          phone,
          age: "",
          gender: "남성",
          annual_revenue: newClientRevenue,
          debt_policy: newClientDebtPolicy,
          debt_bank1: newClientDebt1,
          debt_bank2: newClientDebt2,
          debt_card: newClientDebtCard,
          currentDebt: totalDebt,
          debtDetail: { first: newClientDebt1, second: newClientDebt2, cardLoan: newClientDebtCard, capital: newClientDebtCapital, policy: newClientDebtPolicy },
          nice_score: newClientNice,
          kcb_score: newClientKcb,
          businessType: newClientBizType,
          businessPeriod: newClientBizPeriod,
          desiredAmount: newClientDesired,
          registeredAt: new Date().toISOString(),
        };
        allUsers.push(newUserRecord);
        await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allUsers }) });
        localStorage.setItem("users", JSON.stringify(allUsers));
        setUsers(allUsers);
      }

      // consultations에도 추가
      const cRes = await fetch("/api/db?key=consultations").then(r => r.json()).catch(() => ({ value: null }));
      const consults = cRes.value || JSON.parse(localStorage.getItem("consultations") || "[]");
      const cid = `CS-${Date.now()}`;
      consults.push({
        id: cid, name: newClientName.trim(), phone,
        businessType: newClientBizType.trim(),
        businessPeriod: newClientBizPeriod,
        annual_revenue: newClientRevenue,
        nice_score: newClientNice,
        kcb_score: newClientKcb,
        currentDebt: totalDebt,
        debtDetail: { first: newClientDebt1, second: newClientDebt2, cardLoan: newClientDebtCard, capital: newClientDebtCapital, policy: newClientDebtPolicy },
        desiredAmount: newClientDesired,
        status: "접수완료", createdAt: new Date().toISOString()
      });
      await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "consultations", value: consults }) });
      localStorage.setItem("consultations", JSON.stringify(consults));
      setConsultations(consults);

      setClientPortalUsers(clientUsers);
      setShowCreateClient(false);
      setNewClientName(""); setNewClientPhone(""); setNewClientPassword("");
      setNewClientBizType(""); setNewClientBizPeriod(""); setNewClientRevenue("");
      setNewClientNice(""); setNewClientKcb("");
      setNewClientDebt1(""); setNewClientDebt2(""); setNewClientDebtCard(""); setNewClientDebtCapital(""); setNewClientDebtPolicy("");
      setNewClientDesired("");
      showSuccess(`✅ ${newClientName.trim()} 클라이언트 생성 완료!`);
      await refresh();
      setTab("members"); // 회원 탭으로 이동
    } catch {
      setCreateClientError("생성 실패. 다시 시도해주세요.");
    }
    setCreateClientLoading(false);
  };

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultTab, setConsultTab] = useState<ConsultTab>("waiting");
  const [adminList, setAdminList] = useState<AdminAccount[]>([]);
  const [reassignTarget, setReassignTarget] = useState<string | null>(null); // consultation id
  const [reassignAdminId, setReassignAdminId] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  // 접수대기 카드에서 담당자 선택
  const [waitingAssignMap, setWaitingAssignMap] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [cSearch, setCSearch] = useState("");
  const [cStatusFilter, setCStatusFilter] = useState<ConsultStatus | "">("");
  const [cGradeFilter, setCGradeFilter] = useState("");
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(null);
  const [showConsultDetail, setShowConsultDetail] = useState(false);
  const [cNewStatus, setCNewStatus] = useState<ConsultStatus>("접수대기");
  const [cMemo, setCMemo] = useState("");
  const [cAssigned, setCAssigned] = useState("");
  const [cDate, setCDate] = useState("");
  const [cSaved, setCSaved] = useState(false);
  // 저장 후 등급/자금 점수 모달
  const [gradeResult, setGradeResult] = useState<{
    grade: string; score: number;
    funds: FundProduct[];
  } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("");
  const [emailText, setEmailText] = useState("");

  const EMAIL_TEMPLATES = [
    { value: "", label: "템플릿 선택..." },
    { value: "register",        label: "회원가입 (상담 접수)" },
    { value: "consult_reserve", label: "상담 일정 확정" },
    { value: "docs_request",    label: "서류 요청" },
    { value: "fund_apply",      label: "자금 신청 진행" },
    { value: "approved",        label: "정책자금 승인 완료" },
    { value: "consult_done",    label: "상담 종결" },
    { value: "reserve_done",    label: "예약 완료" },
    { value: "rejected",        label: "심사 미승인" },
    { value: "remind",          label: "리마인드" },
    { value: "fund_execute",    label: "자금 집행 완료" },
    { value: "extra_apply",     label: "재신청 가능 안내" },
    { value: "review",          label: "후기 요청" },
    { value: "new_fund",        label: "신규 정책자금 출시" },
  ];
  const [alimSending, setAlimSending] = useState(false);
  const [alimSent, setAlimSent] = useState(false);
  const [alimText, setAlimText] = useState("");
  const [alimTemplate, setAlimTemplate] = useState("");
  const [convertDone, setConvertDone] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertPassword, setConvertPassword] = useState("");
  const [registerLinkSending, setRegisterLinkSending] = useState(false);
  const [registerLinkSent, setRegisterLinkSent] = useState(false);
  const [registerLinkToken, setRegisterLinkToken] = useState("");
  const [uploadLinkSending, setUploadLinkSending] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [showDocChecklist, setShowDocChecklist] = useState(false);
  const [uploadLinkSent, setUploadLinkSent] = useState(false);
  const [uploadLinkToken, setUploadLinkToken] = useState("");

  // 자금 현황 상태
  const [newFundName, setNewFundName] = useState("");
  const [newFundAmount, setNewFundAmount] = useState("");
  const [pendingFundStatus, setPendingFundStatus] = useState<Record<string, string>>({}); // fundId -> 선택된 상태

  // 실패 모달
  const [failModal, setFailModal] = useState<{
    visible: boolean;
    clientName: string;
    phone: string;
    error: string;
    retryFn: () => Promise<void>;
    registerLink?: string;
  } | null>(null);
  const [failModalRetrying, setFailModalRetrying] = useState(false);
  const [failModalSuccess, setFailModalSuccess] = useState(false);

  const showFailModal = (
    clientName: string,
    phone: string,
    error: string,
    retryFn: () => Promise<void>,
    registerLink?: string
  ) => {
    setFailModal({ visible: true, clientName, phone, error, retryFn, registerLink });
    setFailModalRetrying(false);
    setFailModalSuccess(false);
  };

  const handleFailModalRetry = async () => {
    if (!failModal) return;
    setFailModalRetrying(true);
    setFailModalSuccess(false);
    try {
      await failModal.retryFn();
      setFailModalSuccess(true);
      setFailModal(null);
    } catch (e) {
      setFailModal(prev => prev ? { ...prev, error: String(e) } : null);
    }
    setFailModalRetrying(false);
  };

  // 성공 토스트 (간단 배너)
  const [successBanner, setSuccessBanner] = useState("");
  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(""), 3000);
  };

  const convertToMember = async () => {
    if (!selectedConsult) return;
    if (!window.confirm(`${selectedConsult.name} 대표님을 포털 회원으로 등록하시겠어요?\n(비밀번호는 고객이 링크로 직접 설정합니다)`)) return;
    try {
      // clientUsers에 추가
      const dbRes = await fetch("/api/db?key=clientUsers").then(r => r.json()).catch(() => ({ value: null }));
      const clientUsers: Array<{id: string; name: string; phone: string; email?: string; password: string; createdAt: string}> = dbRes.value || JSON.parse(localStorage.getItem("clientUsers") || "[]");
      const exists = clientUsers.find(u => u.name === selectedConsult.name && u.phone === selectedConsult.phone);
      if (!exists) {
        clientUsers.push({
          id: Date.now().toString(),
          name: selectedConsult.name,
          phone: selectedConsult.phone,
          email: selectedConsult.email || "",
          password: "",
          createdAt: new Date().toISOString(),
        });
        const saveRes = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "clientUsers", value: clientUsers }),
        });
        const saveData = await saveRes.json();
        if (!saveData.ok) throw new Error("서버 저장 실패");
        localStorage.setItem("clientUsers", JSON.stringify(clientUsers));
      }

      // users DB에도 추가 (회원 탭 표시용)
      const usersRes = await fetch("/api/db?key=users").then(r => r.json()).catch(() => ({ value: null }));
      const allUsers = usersRes.value || JSON.parse(localStorage.getItem("users") || "[]");
      const existsUser = allUsers.find((u: {name:string; phone?:string}) =>
        u.name === selectedConsult.name && u.phone === selectedConsult.phone.replace(/-/g,"")
      );
      if (!existsUser) {
        const newUser = {
          id: `user_${Date.now()}`,
          email: selectedConsult.email || "",
          password: "",
          name: selectedConsult.name,
          phone: selectedConsult.phone.replace(/-/g,""),
          age: selectedConsult.age || "",
          gender: selectedConsult.gender || "남성",
          annual_revenue: selectedConsult.annual_revenue || "",
          debt_policy: "0",
          debt_bank1: "0",
          debt_bank2: "0",
          debt_card: "0",
          currentDebt: selectedConsult.currentDebt || "0",
          nice_score: selectedConsult.nice_score || "",
          kcb_score: "",
          businessType: selectedConsult.businessType || "",
          businessPeriod: selectedConsult.businessPeriod || "",
          desiredAmount: selectedConsult.desiredAmount || "",
          registeredAt: new Date().toISOString(),
        };
        allUsers.push(newUser);
        await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allUsers }) });
        localStorage.setItem("users", JSON.stringify(allUsers));
        setUsers(allUsers);
      }

      setConvertDone(true);
      setTimeout(() => setConvertDone(false), 3000);
      showSuccess("✅ 포털 회원 등록 완료!");
      setShowConsultDetail(false);
      await refresh();
      setTab("members"); // 회원 탭으로 이동
    } catch(e) {
      alert("회원 등록 실패: " + e);
    }
  };

  // 회원가입 링크 발송
  const sendRegisterLink = async () => {
    if (!selectedConsult) return;
    setRegisterLinkSending(true);
    setRegisterLinkSent(false);
    setRegisterLinkToken("");
    try {
      // 서버에서 토큰 생성
      const tokenRes = await fetch("/api/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", consultationId: selectedConsult.id, name: selectedConsult.name, phone: selectedConsult.phone }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.ok) throw new Error("토큰 생성 실패");
      const link = `https://emfrontier.team/register?token=${tokenData.token}`;
      const enriched = { ...selectedConsult, registerLink: link };
      const res = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation: enriched, templateType: "register_portal" }),
      });
      const data = await res.json();
      if (data.ok) {
        setRegisterLinkSent(true);
        showSuccess("✅ 회원가입 링크 발송 완료");
        setTimeout(() => setRegisterLinkSent(false), 4000);
        // users DB에도 추가 + 회원 탭 이동
        try {
          const usersRes = await fetch("/api/db?key=users").then(r => r.json()).catch(() => ({ value: null }));
          const allUsers = usersRes.value || JSON.parse(localStorage.getItem("users") || "[]");
          const existsUser = allUsers.find((u: {name:string; phone?:string}) =>
            u.name === selectedConsult.name && u.phone === selectedConsult.phone.replace(/-/g,"")
          );
          if (!existsUser) {
            allUsers.push({
              id: `user_${Date.now()}`,
              email: selectedConsult.email || "",
              password: "",
              name: selectedConsult.name,
              phone: selectedConsult.phone.replace(/-/g,""),
              age: selectedConsult.age || "",
              gender: selectedConsult.gender || "남성",
              annual_revenue: selectedConsult.annual_revenue || "",
              debt_policy: "0", debt_bank1: "0", debt_bank2: "0", debt_card: "0",
              currentDebt: selectedConsult.currentDebt || "0",
              nice_score: selectedConsult.nice_score || "",
              kcb_score: "",
              businessType: selectedConsult.businessType || "",
              businessPeriod: selectedConsult.businessPeriod || "",
              desiredAmount: selectedConsult.desiredAmount || "",
              registeredAt: new Date().toISOString(),
            });
            await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allUsers }) });
            localStorage.setItem("users", JSON.stringify(allUsers));
            setUsers(allUsers);
          }
        } catch {}
        await refresh();
        setShowConsultDetail(false);
        setTab("members");
      } else {
        setRegisterLinkToken(tokenData.token);
        const retryFn = async () => {
          const res2 = await fetch("/api/alimtalk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consultation: enriched, templateType: "register_portal" }),
          });
          const d2 = await res2.json();
          if (!d2.ok) throw new Error(d2.error || "오류");
          showSuccess("✅ 회원가입 링크 재발송 성공");
        };
        showFailModal(
          selectedConsult.name,
          selectedConsult.phone,
          data.error || "알 수 없는 오류",
          retryFn,
          link
        );
      }
    } catch {
      showFailModal(selectedConsult?.name || "", selectedConsult?.phone || "", "네트워크 오류", async () => { await sendRegisterLink(); });
    }
    setRegisterLinkSending(false);
  };

  const sendUploadLink = async (docList?: string[]) => {
    if (!selectedConsult) return;
    setUploadLinkSending(true);
    setUploadLinkSent(false);
    setUploadLinkToken("");
    try {
      // 서버에서 토큰 생성
      const tokenRes = await fetch("/api/upload-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", consultationId: selectedConsult.id, name: selectedConsult.name, phone: selectedConsult.phone }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.ok) throw new Error("토큰 생성 실패");
      const link = `https://emfrontier.team/upload?token=${tokenData.token}`;
      // 서류 목록 리스트 텍스트 생성
      const docText = docList && docList.length > 0
        ? `\n\n필요 서류 (${docList.length}개):\n` + docList.map((d,i) => `${i+1}. ${d}`).join("\n")
        : "";
      const res = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: { ...selectedConsult, manager: admin?.name, managerPhone: admin?.phone, uploadLink: link, docList: docText },
          templateType: "docs_request_link",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUploadLinkSent(true);
        showSuccess("✅ 서류 제출 링크 발송 완료");
        setTimeout(() => setUploadLinkSent(false), 4000);
      } else {
        setUploadLinkToken(tokenData.token);
        showFailModal(selectedConsult.name, selectedConsult.phone, data.error || "오류",
          async () => {
            const r = await fetch("/api/alimtalk", { method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultation: { ...selectedConsult, manager: admin?.name, managerPhone: admin?.phone, uploadLink: link, docList: docText }, templateType: "docs_request_link" }) });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            showSuccess("✅ 서류 링크 재발송 성공");
          }
        );
      }
    } catch {
      showFailModal(selectedConsult?.name || "", selectedConsult?.phone || "", "네트워크 오류", async () => {});
    }
    setUploadLinkSending(false);
  };

  // 자금 추가
  const handleFundAdd = async () => {
    if (!selectedConsult || !newFundName.trim()) return;
    const fund: FundProgress = {
      id: Date.now().toString(),
      fundName: newFundName.trim(),
      amount: newFundAmount.trim(),
      status: "접수대기",
      updatedAt: new Date().toLocaleString("ko-KR"),
    };
    const existing = selectedConsult.funds || [];
    const updated = { ...selectedConsult, funds: [...existing, fund] };
    updateConsultation(selectedConsult.id, { funds: updated.funds });
    const fresh = getAllConsultations();
    setConsultations(fresh);
    const found = fresh.find(c => c.id === selectedConsult.id);
    if (found) setSelectedConsult(found);
    setNewFundName("");
    setNewFundAmount("");
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "consultations", value: fresh }),
    }).catch(() => {});
  };

  // 자금 삭제
  const handleFundDelete = async (fundId: string) => {
    if (!selectedConsult) return;
    
    const funds = (selectedConsult.funds || []).filter(f => f.id !== fundId);
    updateConsultation(selectedConsult.id, { funds });
    const fresh = getAllConsultations();
    setConsultations(fresh);
    const found = fresh.find(c => c.id === selectedConsult.id);
    if (found) setSelectedConsult(found);
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "consultations", value: fresh }),
    }).catch(() => {});
  };

  // 자금 상태 변경
  // 자금 상태별 템플릿 매핑
  const FUND_STATUS_TEMPLATE: Record<string, string> = {
    "준비":    "fund_apply",
    "접수완료": "fund_apply",
    "심사대기": "fund_waiting",
    "심사중":  "fund_reviewing",
    "심사완료": "fund_reviewed",
    "자금집행": "fund_execute",
    "부결":    "rejected",
    "승인":    "approved",
  };

  const handleFundStatus = async (fundId: string, status: FundStatus, sendAlim: boolean) => {
    if (!selectedConsult) return;
    const funds = (selectedConsult.funds || []).map(f =>
      f.id === fundId ? { ...f, status, updatedAt: new Date().toLocaleString("ko-KR") } : f
    );
    updateConsultation(selectedConsult.id, { funds });
    const fresh = getAllConsultations();
    setConsultations(fresh);
    const found = fresh.find(c => c.id === selectedConsult.id);
    if (found) setSelectedConsult(found);
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "consultations", value: fresh }),
    }).catch(() => {});
    if (sendAlim && selectedConsult.phone) {
      const fund = funds.find(f => f.id === fundId);
      const templateType = FUND_STATUS_TEMPLATE[status] || "fund_apply";
      const enriched = {
        ...selectedConsult,
        manager: admin?.name,
        managerPhone: admin?.phone,
        fundName: fund?.fundName || "-",
        fundLimit: fund?.amount || "담당자 안내 예정",
        fundDeadline: "담당자 안내 예정",
        step: status,
        schedule: "담당자 안내 예정",
        execAmount: fund?.amount || "-",
        execDate: new Date().toLocaleDateString("ko-KR"),
        amount: fund?.amount || "-",
      };
      const alimRes = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultation: enriched, templateType }),
      }).then(r => r.json()).catch(() => ({ ok: false, error: "네트워크 오류" }));
      if (alimRes.ok) showSuccess(`✅ [${status}] 알림톡 발송 완료`);
      else {
        const capturedEnriched = enriched;
        showFailModal(
          selectedConsult.name,
          selectedConsult.phone,
          alimRes.error || "오류",
          async () => {
            const r = await fetch("/api/alimtalk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultation: capturedEnriched, templateType }),
            });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            showSuccess(`✅ [${status}] 알림톡 재발송 성공`);
          }
        );
      }
    }
  };
  const ALIM_TEMPLATES = [
    { value: "", label: "템플릿 선택..." },
    { value: "register", label: "회원가입" },
    { value: "consult_reserve", label: "상담예약 완료" },
    { value: "docs_request", label: "서류요청" },
    { value: "fund_apply", label: "자금신청" },
    { value: "approved", label: "정책자금 승인" },
    { value: "consult_done", label: "상담완료" },
    { value: "reserve_done", label: "예약완료" },
    { value: "rejected", label: "심사 미승인" },
    { value: "remind", label: "리마인드" },
    { value: "fund_execute", label: "자금집행" },
    { value: "extra_apply", label: "추가신청" },
    { value: "review", label: "후기 요청" },
    { value: "new_fund", label: "신규정책자금 출시" },
  ];

  const buildAlimText = (type: string, c: Consultation) => {
    const name = cName || c.name || "";
    const id = c.id || "-";
    const biz = c.businessType || "-";
    const amount = c.desiredAmount || "-";
    const managerName = admin?.name || "담당 매니저";
    const managerPhone = admin?.phone || "1234-5678";
    const texts: Record<string, string> = {
      register: `[엠프론티어] 상담 신청이 접수되었습니다.\n\n안녕하세요, ${name} 대표님!\n상담 신청이 정상 접수되었습니다.\n\n📋 접수번호: ${id}\n💼 업종: ${biz}\n💰 희망금액: ${amount}\n\n담당 매니저가 영업일 1일 이내 연락드립니다.\n\n감사합니다.\n엠프론티어`,
      consult_reserve: `[엠프론티어] 상담 일정 확인\n\n안녕하세요, ${name} 대표님!\n상담 일정이 확정되었습니다.\n\n📅 상담일시: ${id}\n👤 담당매니저: ${managerName}\n📞 연락처: ${managerPhone}\n\n준비사항: 사업자등록증, 최근 3개월 매출 자료\n\n궁금한 점은 언제든지 연락 주세요!\n엠프론티어`,
      docs_request: `[엠프론티어] 서류 제출 안내\n\n안녕하세요, ${name} 대표님!\n신청하신 정책자금 상담 진행을 위해\n아래 서류 제출을 부탁드립니다.\n\n 필요 서류\n• 사업자등록증\n• 최근 3개월 매출내역\n• 신분증 사본\n\n서류 제출 후 빠르게 검토 도와드리겠습니다.\n\n엠프론티어`,
      fund_apply: `[엠프론티어] 자금 신청 진행 안내\n\n안녕하세요, ${name} 대표님!\n정책자금 신청이 진행 중입니다.\n\n💼 신청 자금: ${amount}\n📊 진행 단계: 신청서 접수 완료\n⏰ 예상 결과: 영업일 3일 이내\n\n진행 상황은 실시간으로 안내드리겠습니다.\n\n담당자: ${managerName} (${managerPhone})\n엠프론티어`,
      approved: `[엠프론티어] 정책자금 승인 완료!

${name} 대표님! 
신청하신 정책자금 승인이 완료되었습니다.

💰 승인 자금: ${amount}
✅ 승인 금액: ${amount}
📅 집행 예정일: 담당자 안내 예정

담당자가 곧 연락드려 집행 절차를 안내해 드리겠습니다.

감사합니다.
엠프론티어`,
      consult_done: `[엠프론티어] 상담 종결 안내

안녕하세요, ${name} 대표님.
신청하신 상담이 종결 처리되었습니다.

이용해 주셔서 감사합니다.
추후 다시 필요하신 경우 언제든지 찾아주세요!

엠프론티어`,
      reserve_done: `[엠프론티어] 상담 일정 확인\n\n안녕하세요, ${name} 대표님!\n상담 일정이 확정되었습니다.\n\n📅 상담일시: 담당자 안내 예정\n👤 담당매니저: ${managerName}\n📞 연락처: ${managerPhone}\n\n준비사항: 사업자등록증, 최근 3개월 매출 자료\n\n궁금한 점은 언제든지 연락 주세요!\n엠프론티어`,
      rejected: `[엠프론티어] 심사 결과 안내

안녕하세요, ${name} 대표님.
신청하신 정책자금 심사 결과를 안내드립니다.

💼 신청 자금: ${amount}
📋 심사 결과: 미승인

미승인 사유와 재신청 가능 여부를 검토하여
담당자가 곧 연락드리겠습니다.

엠프론티어`,
      remind: `[엠프론티어] 상담 신청 확인 안내

안녕하세요, ${name} 대표님!
정책자금 무료 상담을 신청하셨는데
아직 연락이 닿지 않았습니다.

📞 담당자가 다시 연락드리겠습니다.
혹시 편한 연락 시간이 있으시면
아래 번호로 먼저 연락 주셔도 됩니다.

📞 엠프론티어 담당자: ${managerPhone}`,
      fund_execute: `[엠프론티어] 자금 집행 완료

축하드립니다, ${name} 대표님! 
신청하신 정책자금 집행이 완료되었습니다.

💰 자금명: ${amount}
✅ 집행 금액: ${amount}
📅 집행일: 담당자 안내 완료

사후 관리 서비스는 1년간 무상으로 제공됩니다.
궁금한 점은 언제든지 연락 주세요!

엠프론티어`,
      extra_apply: `[엠프론티어] 재신청 가능 안내

안녕하세요, ${name} 대표님!
이전에 상담 신청하신 대표님께 재신청 가능 시기를 안내드립니다.

📅 재신청 가능일: 담당자 안내 예정
💼 추천 자금: ${amount}

무료 상담으로 최적 자금을 찾아드리겠습니다!

엠프론티어`,
      review: `[엠프론티어] 소중한 후기 부탁드립니다

안녕하세요, ${name} 대표님!
정책자금 서비스를 이용해 주셔서 감사합니다.

대표님의 소중한 후기가 다른 사업자분들께
큰 도움이 됩니다 😊

⭐ 후기 남기기: ${id}

(소요 시간: 1분 이내)
감사합니다.
엠프론티어`,
      new_fund: `[엠프론티어] 신규 정책자금 출시 안내

안녕하세요, ${name} 대표님!
이전에 상담 신청하신 대표님께 맞는
신규 정책자금이 출시되었습니다.

💰 자금명: ${amount}
✅ 한도: 담당자 안내 예정
📅 신청 마감: 담당자 안내 예정

⚠ 인기 자금은 빠르게 소진됩니다!
지금 바로 무료 상담 신청하세요.

엠프론티어`,
    };
    return texts[type] || "";
  };

  const sendAlimtalk = async () => {
    if (!selectedConsult?.phone) { alert("고객 전화번호가 없어요!"); return; }
    setAlimSending(true);
    try {
      // 서류요청 알림톡일 때 업로드 토큰 URL 생성
      let uploadUrl: string | undefined;
      const isDocsRequest = (alimTemplate || "") === "docs_request" || (cNewStatus || "") === "서류요청";
      if (isDocsRequest && selectedConsult) {
        const uploadToken = createUploadToken(selectedConsult.id, selectedConsult.name, selectedConsult.phone);
        uploadUrl = `https://emfrontier.team/upload?token=${uploadToken.token}`;
      }
      const res = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: {
            ...selectedConsult,
            name: cName || selectedConsult.name,
            manager: admin?.name || undefined,
            managerPhone: admin?.phone || undefined,
          },
          status: cNewStatus,
          templateType: alimTemplate || undefined,
          customText: alimText.trim() || undefined,
          ...(uploadUrl ? { kakaoOptions: { buttons: [{ name: "파일 제출하기", linkType: "WL", linkMo: uploadUrl, linkPc: uploadUrl }] } } : {}),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAlimSent(true); setAlimText(""); setAlimTemplate("");
        showSuccess("✅ 알림톡 발송 완료");
        setTimeout(() => setAlimSent(false), 3000);
      } else {
        const sc = selectedConsult;
        const payload = {
          consultation: { ...sc, name: cName || sc?.name, manager: admin?.name, managerPhone: admin?.phone },
          status: cNewStatus, templateType: alimTemplate || undefined, customText: alimText.trim() || undefined,
          ...(uploadUrl ? { kakaoOptions: { buttons: [{ name: "파일 제출하기", linkType: "WL", linkMo: uploadUrl, linkPc: uploadUrl }] } } : {}),
        };
        showFailModal(
          sc?.name || "", sc?.phone || "", data.error || "오류",
          async () => {
            const r = await fetch("/api/alimtalk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            showSuccess("✅ 알림톡 재발송 성공");
          }
        );
      }
    } catch { showFailModal(selectedConsult?.name || "", selectedConsult?.phone || "", "네트워크 오류", async () => { throw new Error("네트워크 오류"); }); }
    setAlimSending(false);
  };

  const sendStatusEmail = async () => {
    if (!selectedConsult || !selectedConsult.email) {
      alert("고객 이메일 주소가 없어요!");
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedConsult.email,
          name: cName || selectedConsult.name,
          status: emailTemplate || cNewStatus,
          extra: emailText.trim() || (cDate ? `상담 예약일시: ${cDate}` : cMemo || undefined),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEmailSent(true);
        setEmailText("");
        setEmailTemplate("");
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        alert(`이메일 발송 실패: ${JSON.stringify(data.error)}`);
      }
    } catch (e) {
      alert("네트워크 오류로 발송에 실패했어요");
    }
    setEmailSending(false);
  };
  // 신청 내용 수정용 state
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cAge, setCAge] = useState("");
  const [cGender, setCGender] = useState("");
  const [cBizType, setCBizType] = useState("");
  const [cBizPeriod, setCBizPeriod] = useState("");
  const [cRevenue, setCRevenue] = useState("");
  const [cDebt, setCDebt] = useState("");
  const [cDebtFirst, setCDebtFirst] = useState("");
  const [cDebtSecond, setCDebtSecond] = useState("");
  const [cDebtCard, setCDebtCard] = useState("");
  const [cDebtCapital, setCDebtCapital] = useState("");
  const [cDebtPolicy, setCDebtPolicy] = useState("");
  const [cNice, setCNice] = useState("");
  const [cKcb, setCKcb] = useState("");
  const [cDesiredAmount, setCDesiredAmount] = useState("");
  const [cInquiry, setCInquiry] = useState("");

  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [lastRefresh, setLastRefresh] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");

  const refresh = useCallback(async () => {
    // 서버에서 데이터 불러오기 (없으면 localStorage fallback)
    try {
      const [usersRes, consultsRes] = await Promise.all([
        fetch("/api/db?key=users"),
        fetch("/api/db?key=consultations"),
      ]);
      const usersJson = await usersRes.json();
      const consultsJson = await consultsRes.json();
      if (usersJson.value) {
        localStorage.setItem("users", JSON.stringify(usersJson.value));
      }
      if (consultsJson.value) {
        localStorage.setItem("consultations", JSON.stringify(consultsJson.value));
      }
    } catch { /* fallback to localStorage */ }
    setUsers(getAllUsers());
    setConsultations(getAllConsultations());
    setLastRefresh(new Date().toLocaleTimeString("ko-KR"));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("adminLoggedIn")) { router.push("/admin/login"); return; }
    setAdmin(getCurrentAdmin());
    setAdminList(getAllAdmins());
    refresh();
    // 포털 회원 자동 로드
    fetch("/api/db?key=clientUsers").then(r=>r.json()).then(d=>setClientPortalUsers(d.value||[])).catch(()=>{});
    setLoading(false);
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [router, refresh]);

  const logout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("currentAdminId");
    router.push("/admin/login");
  };

  const handleSync = async () => {
    setSyncStatus("syncing");
    try {
      const result = await syncAllToServer();
      setSyncStatus(result.ok ? "done" : "error");
    } catch { setSyncStatus("error"); }
    setTimeout(() => setSyncStatus("idle"), 3000);
  };

  const handleRestore = async () => {
    if (!confirm("서버 백업 데이터로 현재 브라우저 데이터를 덮어씁니다.\n계속하시겠습니까?")) return;
    try {
      const result = await restoreFromServer();
      if (result.ok) refresh();
    } catch { /* ignore */ }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch("/api/backup");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emfrontier-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("다운로드 실패. 서버 동기화를 먼저 실행하세요."); }
  };

  const handleUploadRestore = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) });
        if (res.ok) { await handleRestore(); alert("✅ 백업 파일로 복원 완료!"); }
        else alert("❌ 복원 실패");
      } catch { alert("❌ 파일 형식이 올바르지 않습니다."); }
    };
    input.click();
  };

  const handleDeleteUser = (userId: string) => { deleteUser(userId); refresh(); setDeleteConfirm(null); };

  const openConsult = (c: Consultation) => {
    setSelectedConsult(c); setCNewStatus(c.status);
    setCMemo(c.adminMemo || ""); setCAssigned(c.assignedTo || ""); setCDate(c.consultDate || ""); setCSaved(false);
    setShowHistory(false);
    // 신청 내용 초기화
    setCName(c.name || ""); setCPhone(c.phone || ""); setCEmail(c.email || "");
    setCAge(c.age || ""); setCGender(c.gender || ""); setCBizType(c.businessType || "");
    setCBizPeriod(c.businessPeriod || ""); setCRevenue(c.annual_revenue || "");
    setCDebt(c.currentDebt || ""); setCNice(c.nice_score || ""); setCKcb(c.kcb_score || "");
    setCDebtFirst(c.debtDetail?.first || ""); setCDebtSecond(c.debtDetail?.second || "");
    setCDebtCard(c.debtDetail?.cardLoan || ""); setCDebtCapital(c.debtDetail?.capital || ""); setCDebtPolicy(c.debtDetail?.policy || "");
    setCDesiredAmount(c.desiredAmount || ""); setCInquiry(c.inquiryContent || "");
    setShowConsultDetail(true);
  };

  const saveConsult = async () => {
    if (!selectedConsult) return;
    updateConsultation(selectedConsult.id, {
      status: cNewStatus, adminMemo: cMemo, assignedTo: cAssigned, consultDate: cDate,
      name: cName, phone: cPhone, email: cEmail, age: cAge, gender: cGender,
      businessType: cBizType, businessPeriod: cBizPeriod,
      annual_revenue: cRevenue, currentDebt: String([cDebtFirst,cDebtSecond,cDebtCard,cDebtCapital,cDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0)),
      debtDetail: { first:cDebtFirst, second:cDebtSecond, cardLoan:cDebtCard, capital:cDebtCapital, policy:cDebtPolicy },
      nice_score: cNice, kcb_score: cKcb,
      desiredAmount: cDesiredAmount, inquiryContent: cInquiry,
    });
    // 서버에 즉시 동기화
    const fresh = getAllConsultations();
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "consultations", value: fresh }),
    }).catch(() => {});
    setConsultations(fresh);
    const updated = fresh.find(c => c.id === selectedConsult.id);
    if (updated) setSelectedConsult(updated);
    setCSaved(true); setTimeout(() => setCSaved(false), 2500);

    // 저장 완료 후 항상 users DB 추가 + 회원 탭 이동
    try {
      const usersRes = await fetch("/api/db?key=users").then(r => r.json()).catch(() => ({ value: null }));
      const allUsersArr = usersRes.value || JSON.parse(localStorage.getItem("users") || "[]");
      const existsUser = allUsersArr.find((u: {name:string; phone?:string}) =>
        u.name === cName && u.phone === cPhone.replace(/-/g,"")
      );
      if (!existsUser) {
        allUsersArr.push({
          id: `user_${Date.now()}`,
          email: "", password: "",
          name: cName, phone: cPhone.replace(/-/g,""),
          age: cAge, gender: cGender || "남성",
          annual_revenue: cRevenue,
          debt_policy: "0", debt_bank1: "0", debt_bank2: "0", debt_card: "0",
          currentDebt: String([cDebtFirst,cDebtSecond,cDebtCard,cDebtCapital,cDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0)),
          nice_score: cNice, kcb_score: cKcb,
          businessType: cBizType, businessPeriod: cBizPeriod,
          desiredAmount: cDesiredAmount,
          registeredAt: new Date().toISOString(),
        });
        await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allUsersArr }) });
        localStorage.setItem("users", JSON.stringify(allUsersArr));
        setUsers(allUsersArr);
      }
    } catch {}
    await refresh();
    setShowConsultDetail(false);
    setTab("members");

    // SOHO 등급 재측정 + 자금 추천
    const updatedC = updated || selectedConsult;
    const { grade, score } = calcConsultGrade(updatedC);
    const nice = Number(cNice) || 0;
    const rev = Number(cRevenue) || 0;
    const debt = [cDebtFirst,cDebtSecond,cDebtCard,cDebtCapital,cDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0);
    const allFunds = getAllFunds();
    const recFunds = allFunds.filter(f => {
      if (!f.active) return false;
      if (!f.eligibleGrades.includes(grade)) return false;
      if (Number(f.minRevenue) > 0 && rev < Number(f.minRevenue)) return false;
      if (Number(f.minCreditScore) > 0 && nice < Number(f.minCreditScore)) return false;
      if (f.maxCreditScore && Number(f.maxCreditScore) > 0 && nice > Number(f.maxCreditScore)) return false;
      if (Number(f.maxDebt) > 0 && debt > Number(f.maxDebt)) return false;
      return true;
    }).slice(0, 6);
    setGradeResult({ grade, score, funds: recFunds });
  };

  // 타사 업데이트 후 localStorage→서버 동기화 헬퍼
  const syncFresh = async () => {
    const fresh = getAllConsultations();
    setConsultations(fresh);
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "consultations", value: fresh }),
    }).catch(() => {});
    return fresh;
  };

  // 타사 접수완료 (예약완료) 버튼
  const handleAssign = async (c: Consultation, targetAdmin?: AdminAccount) => {
    if (!admin || assigningId === c.id) return;
    const assignTo = targetAdmin || admin;
    setAssigningId(c.id);
    try {
      assignConsultation(c.id, assignTo);
      let alimOk = false;
      let alimErr = "";
      try {
        const res = await fetch("/api/alimtalk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consultation: { ...c, manager: assignTo.name, managerPhone: assignTo.phone },
            templateType: "consult_reserve",
          }),
        });
        const data = await res.json();
        alimOk = !!data.ok;
        alimErr = data.ok ? "" : (data.error || "알 수 없는 오류");
      } catch (e) {
        alimErr = String(e);
      }
      updateConsultation(c.id, {
        alimtalkStatus: alimOk ? "sent" : "failed",
        alimtalkSentAt: alimOk ? new Date().toISOString() : undefined,
        alimtalkError: alimErr || undefined,
      });
      const fresh = await syncFresh();
      const updated = fresh.find(x => x.id === c.id);
      if (updated) { setSelectedConsult(updated); setCNewStatus(updated.status); }
      if (!alimOk) {
        const capturedC = c;
        const capturedAssignTo = assignTo;
        showFailModal(
          capturedC.name, capturedC.phone, alimErr,
          async () => {
            const r = await fetch("/api/alimtalk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultation: { ...capturedC, manager: capturedAssignTo?.name, managerPhone: capturedAssignTo?.phone }, templateType: "consult_reserve" }),
            });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            updateConsultation(capturedC.id, { alimtalkStatus: "sent", alimtalkSentAt: new Date().toISOString(), alimtalkError: undefined });
            await syncFresh();
            showSuccess("✅ 알림톡 재발송 성공");
          }
        );
      }
      // 배정 완료 후 회원 탭으로 이동
      // users DB에 없으면 자동 추가
      try {
        const usersRes = await fetch("/api/db?key=users").then(r => r.json()).catch(() => ({ value: null }));
        const allUsers = usersRes.value || JSON.parse(localStorage.getItem("users") || "[]");
        const exists = allUsers.find((u: {name:string; phone?:string}) => u.name === c.name && u.phone === c.phone.replace(/-/g,""));
        if (!exists) {
          const newUser = {
            id: `user_${Date.now()}`,
            email: "",
            password: "",
            name: c.name,
            phone: c.phone.replace(/-/g,""),
            age: "",
            gender: "남성",
            annual_revenue: c.annual_revenue || "",
            debt_policy: "0",
            debt_bank1: "0",
            debt_bank2: "0",
            debt_card: "0",
            currentDebt: c.currentDebt || "0",
            nice_score: c.nice_score || "",
            kcb_score: "",
            businessType: c.businessType || "",
            businessPeriod: c.businessPeriod || "",
            desiredAmount: c.desiredAmount || "",
            registeredAt: new Date().toISOString(),
          };
          allUsers.push(newUser);
          await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allUsers }) });
          localStorage.setItem("users", JSON.stringify(allUsers));
          setUsers(allUsers);
        }
      } catch {}
      await refresh();
      setShowConsultDetail(false);
      setConsultTab("mine");
      setTab("members");
    } finally {
      setAssigningId(null);
    }
  };

  // 타사 접수취소 (롤백)
  const handleUnassign = async (c: Consultation) => {
    if (!admin) return;
    if (!window.confirm("접수를 취소하시겠습니까?\n고객에게 상담종결 알림톡이 발송됩니다.")) return;
    // 알림톡 종결 발송
    try {
      await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: { ...c, manager: admin.name, managerPhone: admin.phone },
          templateType: "consult_done",
        }),
      });
    } catch { /* ignore */ }
    updateConsultation(c.id, {
      status: "접수대기",
      assignedTo: "",
      assignedName: undefined,
      assignedAt: undefined,
      assignLog: undefined,
    });
    await syncFresh();
    setShowConsultDetail(false);
    setConsultTab("waiting");
  };

  // 알림톡 재발송
  const handleResendAlimtalk = async (c: Consultation) => {
    if (!admin) return;
    try {
      const res = await fetch("/api/alimtalk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultation: { ...c, manager: admin.name, managerPhone: admin.phone },
          templateType: "consult_reserve",
        }),
      });
      const data = await res.json();
      updateConsultation(c.id, {
        alimtalkStatus: data.ok ? "sent" : "failed",
        alimtalkSentAt: data.ok ? new Date().toISOString() : undefined,
        alimtalkError: data.ok ? undefined : (data.error || "오류"),
      });
      const fresh = await syncFresh();
      const updated = fresh.find(x => x.id === c.id);
      if (updated) setSelectedConsult(updated);
      if (data.ok) showSuccess("✅ 알림톡 재발송 성공");
      else {
        const capturedC = c;
        showFailModal(
          capturedC.name, capturedC.phone, data.error || "오류",
          async () => {
            const r = await fetch("/api/alimtalk", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultation: { ...capturedC, manager: admin?.name, managerPhone: admin?.phone }, templateType: "consult_reserve" }),
            });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "오류");
            updateConsultation(capturedC.id, { alimtalkStatus: "sent", alimtalkSentAt: new Date().toISOString(), alimtalkError: undefined });
            await syncFresh();
            showSuccess("✅ 알림톡 재발송 성공");
          }
        );
      }
    } catch (e) {
      showFailModal(c.name, c.phone, "네트워크 오류: " + e, async () => { throw new Error("네트워크 오류"); });
    }
  };

  const filteredUsers = users
    .filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchStatus = filterStatus === "전체" || (filterStatus === "미신청" ? !u.application : u.application?.status === filterStatus);
      const matchGrade = filterGrade === "전체" || calcGrade(u).grade === filterGrade;
      // 담당자 필터: 최고관리자는 전체, 일반 어드민은 본인 담당 고객만
      const myConsults = consultations.filter(c => c.name === u.name);
      const isMyClient = admin?.role === "superadmin" ||
        myConsults.some(c => c.assignedName === admin?.name);
      const matchAssignee = filterAssignee === "전체"
        ? (admin?.role === "superadmin" || isMyClient)
        : myConsults.some(c => c.assignedName === filterAssignee);
      return matchSearch && matchStatus && matchGrade && matchAssignee && (admin?.role === "superadmin" || isMyClient);
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ko");
      if (sortBy === "grade") return calcGrade(a).score - calcGrade(b).score;
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });

  const filteredWaiting = consultations.filter(c => {
    const q = cSearch.trim().toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
    const matchGrade = !cGradeFilter || calcConsultGrade(c).grade === cGradeFilter;
    return c.status === "접수대기" && matchSearch && matchGrade;
  });

  const filteredMine = consultations.filter(c => {
    const q = cSearch.trim().toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = !cStatusFilter || c.status === cStatusFilter;
    const matchGrade = !cGradeFilter || calcConsultGrade(c).grade === cGradeFilter;
    const isMine = admin?.role === "superadmin"
      ? c.status !== "접수대기"
      : c.status !== "접수대기" && c.assignedTo === admin?.username;
    // 이미 회원 탭에 있는 고객은 제외
    const isAlreadyMember = users.some(u =>
      u.name === c.name && ((u as UserRecord & {phone?:string}).phone === c.phone || (u as UserRecord & {phone?:string}).phone === c.phone.replace(/-/g, ""))
    );
    return isMine && !isAlreadyMember && matchSearch && matchStatus && matchGrade;
  });

  const filteredConsults = consultTab === "waiting" ? filteredWaiting : filteredMine;

  const total = users.length;
  const applied = users.filter(u => u.application).length;
  const inProgress = users.filter(u => u.application?.status === "진행중").length;
  const done = users.filter(u => u.application?.status === "집행완료").length;
  const cTotal = admin?.role === "superadmin"
    ? consultations.filter(c => c.status !== "접수대기").length
    : consultations.filter(c => c.assignedTo === admin?.username).length;
  const cWaiting = consultations.filter(c => c.status === "접수대기").length;
  const cInProg = consultations.filter(c => ["상담예약", "서류요청", "신청진행"].includes(c.status)).length;
  const cDone = consultations.filter(c => ["상담완료", "종결"].includes(c.status)).length;

  const gradeCount = ["A", "B", "C", "D"].map(g => ({
    grade: g,
    memberCount: users.filter(u => calcGrade(u).grade === g).length,
    consultCount: consultations.filter(c => calcConsultGrade(c).grade === g).length,
    color: gradeColor(g),
  }));

  const inp: React.CSSProperties = {
    padding: "9px 12px", fontSize: "13px", border: "1.5px solid #334155",
    borderRadius: "8px", backgroundColor: "#0F172A", color: "#F1F5F9",
    outline: "none", fontFamily: font, boxSizing: "border-box",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#94A3B8", fontFamily: font }}>로딩 중...</p>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .dash-header {
          background-color:#1E293B; border-bottom:1px solid #334155;
          padding:10px 14px; position:sticky; top:0; z-index:20;
        }
        .dash-header-inner {
          max-width:1500px; margin:0 auto;
          display:flex; justify-content:space-between; align-items:center; gap:8px;
        }
        .dash-brand { display:flex; align-items:center; gap:8px; min-width:0; }
        .dash-brand-text { min-width:0; }
        .dash-brand-text .t1 { font-size:15px; font-weight:800; color:#F8FAFC; white-space:nowrap; }
        .dash-brand-text .t2 { font-size:10px; color:#64748B; white-space:nowrap; }
        .dash-pc-nav { display:flex; gap:5px; margin-left:10px; }
        .dash-pc-nav a {
          padding:5px 10px; font-size:11px; font-weight:600;
          border-radius:6px; text-decoration:none; white-space:nowrap;
        }
        .dash-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .dash-sync-badge {
          font-size:10px; color:#22C55E; background-color:#052E16;
          padding:3px 8px; border-radius:999px; border:1px solid #166534;
          white-space:nowrap;
        }
        .dash-icon-btn {
          padding:6px 10px; font-size:11px; font-weight:600;
          border:none; border-radius:6px; cursor:pointer;
          font-family:${font}; white-space:nowrap;
        }
        .dash-logout-btn {
          padding:6px 12px; background-color:#334155; color:#CBD5E1;
          font-size:11px; font-weight:600; border:none; border-radius:6px;
          cursor:pointer; font-family:${font};
        }
        .hamburger { display:none; background:none; border:none; cursor:pointer; padding:6px; flex-shrink:0; }
        .hamburger span { display:block; width:20px; height:2px; background:#CBD5E1; border-radius:2px; margin:4px 0; }

        /* Mobile overlay nav */
        .mob-nav {
          display:none; position:fixed; inset:0;
          background:rgba(15,23,42,0.97); z-index:100;
          flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:20px;
        }
        .mob-nav.open { display:flex; }
        .mob-nav a, .mob-nav button.mob-link {
          width:100%; max-width:300px; text-align:center;
          padding:13px 20px; font-size:14px; font-weight:600;
          border-radius:8px; text-decoration:none; display:block;
        }
        .mob-nav button.mob-link { background:#450A0A; color:#FCA5A5; border:none; cursor:pointer; font-family:${font}; }
        .mob-close { position:absolute; top:14px; right:14px; background:none; border:none; color:#94A3B8; font-size:22px; cursor:pointer; padding:8px; }

        /* Stats grids */
        .stats-8 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px; }
        .grade-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }

        /* Table */
        .tbl-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .tbl-wrap table { width:100%; border-collapse:collapse; }

        /* Filter row */
        .filter-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .filter-row input, .filter-row select { flex:1; min-width:120px; }

        /* Consult detail overlay on mobile */
        .consult-overlay {
          display:none; position:fixed; inset:0; background:#0F172A;
          z-index:80; overflow-y:auto; padding:12px;
        }
        .consult-overlay.open { display:block; }
        .consult-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        @media (max-width:480px) {
          .consult-detail-grid { grid-template-columns:1fr; }
        }

        /* Responsive breakpoints */
        @media (max-width:1100px) {
          .dash-pc-nav { display:none; }
          .hamburger { display:block; }
          .stats-8 { grid-template-columns:repeat(4,1fr); }
        }
        @media (max-width:768px) {
          .stats-8 { grid-template-columns:repeat(2,1fr); }
          .grade-4 { grid-template-columns:repeat(2,1fr); }
          .dash-sync-badge { display:none; }
          .hide-sm { display:none !important; }
        }
        @media (max-width:480px) {
          .stats-8 { grid-template-columns:repeat(2,1fr); }
          .dash-brand-text .t2 { display:none; }
          .dash-header { padding:8px 10px; }
        }
        @media (max-width:400px) {
          .stats-8 { grid-template-columns:1fr 1fr; }
          .grade-4 { grid-template-columns:1fr 1fr; }
          .consult-detail-grid { grid-template-columns:1fr; }
        }

        /* Member table responsive columns */
        @media (max-width:700px) {
          .col-hide-mob { display:none; }
        }
        @media (max-width:500px) {
          .col-hide-xs { display:none; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", backgroundColor: "#0F172A", fontFamily: font }}>

        {/* Mobile Nav Overlay */}
        <div className={`mob-nav ${mobileNav ? "open" : ""}`}>
          <button className="mob-close" onClick={() => setMobileNav(false)}>✕</button>
          <Link href="/admin/dashboard" style={{ backgroundColor: "#2563EB", color: "#FFF" }} onClick={() => setMobileNav(false)}>📊 대시보드</Link>
          <Link href="/admin/funds" style={{ backgroundColor: "#334155", color: "#CBD5E1" }} onClick={() => setMobileNav(false)}>💰 자금 관리</Link>
          <Link href="/admin/consultations" style={{ backgroundColor: "#334155", color: "#CBD5E1" }} onClick={() => setMobileNav(false)}>💬 상담 관리</Link>
          <Link href="/admin/doc-collect" style={{ backgroundColor: "#065F46", color: "#34D399" }} onClick={() => setMobileNav(false)}>📁 서류 수집</Link>
          {admin?.role === "superadmin" && (<>
            <button className="mob-link" style={{ backgroundColor: "#1E3A5F", color: "#93C5FD" }} onClick={() => { setTab("all-consults"); setMobileNav(false); }}>📋 전체상담</button>
            <Link href="/setting" style={{ backgroundColor: "#4C1D95", color: "#DDD6FE" }} onClick={() => setMobileNav(false)}>⚙️ 계정관리</Link>
          </>)}
          <button className="mob-link" onClick={() => { setMobileNav(false); logout(); }}>로그아웃</button>
        </div>

        {/* Header */}
        <div className="dash-header">
          <div className="dash-header-inner">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
              <div className="dash-brand">
                <img src={LOGO_B64} alt="EF" width={30} height={30} style={{ objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0 }} />
                <div className="dash-brand-text">
                  <p className="t1">엠프론티어</p>
                  <p className="t2">관리자 대시보드</p>
                </div>
              </div>
              <nav className="dash-pc-nav">
                <Link href="/admin/dashboard" style={{ backgroundColor: "#2563EB", color: "#FFF" }}>📊 대시보드</Link>
                <Link href="/admin/funds" style={{ backgroundColor: "#334155", color: "#CBD5E1" }}>💰 자금</Link>
                <Link href="/admin/consultations" style={{ backgroundColor: "#334155", color: "#CBD5E1" }}>💬 상담</Link>
                {admin?.role === "superadmin" && (
                  <>
                    <button onClick={() => setTab("all-consults")} style={{ backgroundColor: tab === "all-consults" ? "#1D4ED8" : "#334155", color: tab === "all-consults" ? "#FFF" : "#CBD5E1", border: "none", borderRadius: "6px", padding: "5px 12px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: font }}>📋 전체상담</button>
                    <Link href="/setting" style={{ backgroundColor: "#4C1D95", color: "#DDD6FE" }}>⚙️ 계정관리</Link>
                  </>
                )}
              </nav>
            </div>
            <div className="dash-right">
              <span className="dash-sync-badge">● 실시간</span>
              <button onClick={handleSync} disabled={syncStatus === "syncing"} className="dash-icon-btn"
                style={{ backgroundColor: syncStatus === "done" ? "#166534" : syncStatus === "error" ? "#7F1D1D" : "#1D4ED8", color: "#FFF" }}>
                {syncStatus === "syncing" ? "⏳" : syncStatus === "done" ? "✅" : syncStatus === "error" ? "❌" : "☁️"}
              </button>
              <button onClick={handleDownload} className="dash-icon-btn hide-sm" style={{ backgroundColor: "#0F766E", color: "#FFF" }}>📥</button>
              <button onClick={handleUploadRestore} className="dash-icon-btn hide-sm" style={{ backgroundColor: "#7C3AED", color: "#FFF" }}>📤</button>
              <button onClick={logout} className="dash-logout-btn hide-sm">로그아웃</button>
              <button className="hamburger" onClick={() => setMobileNav(true)} aria-label="메뉴">
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1500px", margin: "0 auto", padding: "12px 10px" }}>

          {/* Stats 8-grid */}
          <div className="stats-8">
            {([
              { label: "전체 회원", value: total, color: "#3B82F6", bg: "#1E3A5F", icon: "👥", action: () => { setTab("members"); setFilterStatus("전체"); setFilterGrade("전체"); } },
              { label: "신청완료", value: applied, color: "#A78BFA", bg: "#2E1B5E", icon: "📋", action: () => { setTab("members"); setFilterStatus("접수완료"); setFilterGrade("전체"); } },
              { label: "진행중", value: inProgress, color: "#34D399", bg: "#052E1C", icon: "⚡", action: () => { setTab("members"); setFilterStatus("진행중"); setFilterGrade("전체"); } },
              { label: "집행완료", value: done, color: "#818CF8", bg: "#1E1B4B", icon: "✅", action: () => { setTab("members"); setFilterStatus("집행완료"); setFilterGrade("전체"); } },
              { label: "상담전체", value: cTotal, color: "#60A5FA", bg: "#0C2340", icon: "💬", action: () => { setTab("consultations"); setCStatusFilter(""); } },
              { label: "접수대기", value: cWaiting, color: "#FCD34D", bg: "#1C1A09", icon: "⏳", action: () => { setTab("consultations"); setCStatusFilter("접수대기"); } },
              { label: "상담진행", value: cInProg, color: "#C084FC", bg: "#1C0D30", icon: "🔄", action: () => { setTab("consultations"); setCStatusFilter("상담예약"); } },
              { label: "상담완료", value: cDone, color: "#4ADE80", bg: "#052915", icon: "🎉", action: () => { setTab("consultations"); setCStatusFilter("상담완료"); } },
            ] as { label: string; value: number; color: string; bg: string; icon: string; action: () => void }[]).map(s => (
              <div key={s.label}
                onClick={s.action}
                style={{ backgroundColor: s.bg, borderRadius: "10px", padding: "10px 12px", border: `1px solid ${s.color}30`, cursor: "pointer", WebkitTapHighlightColor: "transparent", transition: "opacity 0.15s" }}
                onTouchStart={e => (e.currentTarget.style.opacity = "0.7")}
                onTouchEnd={e => (e.currentTarget.style.opacity = "1")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ fontSize: "10px", color: "#94A3B8", lineHeight: "1.3" }}>{s.label}</p>
                  <span style={{ fontSize: "13px" }}>{s.icon}</span>
                </div>
                <p style={{ fontSize: "22px", fontWeight: "800", color: s.color, marginTop: "4px" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Grade Distribution */}
          <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "14px" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: "#CBD5E1", marginBottom: "12px" }}>📊 SOHO 등급 분포</p>
            <div className="grade-4">
              {gradeCount.map(g => (
                <div key={g.grade}
                  onClick={() => { setTab("members"); setFilterGrade(g.grade); setFilterStatus("전체"); }}
                  style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px", border: `1px solid ${g.color}40`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
                  onTouchStart={e => (e.currentTarget.style.opacity = "0.7")}
                  onTouchEnd={e => (e.currentTarget.style.opacity = "1")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "22px", fontWeight: "900", color: g.color }}>{g.grade}</span>
                    <span style={{ fontSize: "9px", color: g.color, backgroundColor: `${g.color}18`, padding: "2px 6px", borderRadius: "999px", fontWeight: "700" }}>
                      {g.grade === "A" ? "최우수" : g.grade === "B" ? "우량" : g.grade === "C" ? "보통" : "주의"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94A3B8" }}>
                    <span>👥 {g.memberCount}</span>
                    <span>💬 {g.consultCount}</span>
                  </div>
                  <div style={{ height: "3px", backgroundColor: "#1E293B", borderRadius: "999px", overflow: "hidden", marginTop: "6px" }}>
                    <div style={{ height: "100%", backgroundColor: g.color, borderRadius: "999px", width: `${total ? Math.round(g.memberCount / total * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: "12px", borderBottom: "2px solid #334155", overflowX: "auto" }}>
            {([
              { key: "members", label: `👥 회원 (${total})` },
              { key: "consultations", label: `💬 상담 (${cTotal})` },
              { key: "naver", label: `📊 네이버 광고` },
              ...(admin?.role === "superadmin" ? [
                { key: "all-consults", label: `📋 전체상담 (${consultations.length})` },
              ] : []),
            ] as { key: Tab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: "9px 16px", fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap",
                  border: "none", borderBottom: tab === t.key ? "2px solid #3B82F6" : "2px solid transparent",
                  marginBottom: "-2px", backgroundColor: "transparent",
                  color: tab === t.key ? "#60A5FA" : "#64748B",
                  cursor: "pointer", fontFamily: font,
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Members Tab ── */}
          {tab === "members" && (
            <>
              {/* 클라이언트 직접 생성 모달 */}
              {showCreateClient && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                  <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "28px 24px", maxWidth: "400px", width: "100%", border: "1px solid #334155" }}>
                    <p style={{ fontSize: "17px", fontWeight: "800", color: "#F1F5F9", marginBottom: "20px" }}>👤 클라이언트 직접 생성</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {[
                        { label: "이름 *", value: newClientName, setter: setNewClientName, placeholder: "홍길동" },
                        { label: "연락처 *", value: newClientPhone, setter: setNewClientPhone, placeholder: "01012345678" },
                        { label: "초기 비밀번호", value: newClientPassword, setter: setNewClientPassword, placeholder: "0000" },
                        { label: "업종", value: newClientBizType, setter: setNewClientBizType, placeholder: "식점/카페 등" },
                        { label: "업력", value: newClientBizPeriod, setter: setNewClientBizPeriod, placeholder: "1년 미만 / 1~3년 / 3~5년 등" },
                        { label: "연매출(원)", value: newClientRevenue, setter: setNewClientRevenue, placeholder: "예: 50000000" },
                        { label: "NICE점수", value: newClientNice, setter: setNewClientNice, placeholder: "예: 720" },
                        { label: "KCB점수", value: newClientKcb, setter: setNewClientKcb, placeholder: "예: 700" },
                      ].map(f => (
                        <div key={f.label}>
                          <label style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "4px" }}>{f.label}</label>
                          <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                            style={{ width: "100%", padding: "9px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", boxSizing: "border-box", outline: "none" }} />
                        </div>
                      ))}
                      {/* 기대출 5종 */}
                      <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "12px" }}>
                        <p style={{ fontSize: "11px", color: "#60A5FA", fontWeight: "700", marginBottom: "10px" }}>💳 기대출 현황 (원)</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {[
                            { label: "1금융권 (은행)", value: newClientDebt1, setter: setNewClientDebt1 },
                            { label: "2금융권 (저축은행/새마을금고 등)", value: newClientDebt2, setter: setNewClientDebt2 },
                            { label: "카드론", value: newClientDebtCard, setter: setNewClientDebtCard },
                            { label: "캐피탈", value: newClientDebtCapital, setter: setNewClientDebtCapital },
                            { label: "정책자금", value: newClientDebtPolicy, setter: setNewClientDebtPolicy },
                          ].map(d => (
                            <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <label style={{ fontSize: "11px", color: "#94A3B8", width: "130px", flexShrink: 0 }}>{d.label}</label>
                              <input value={d.value} onChange={e => d.setter(e.target.value)} placeholder="0"
                                style={{ flex: 1, padding: "7px 10px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "6px", fontSize: "12px", color: "#F1F5F9", boxSizing: "border-box", outline: "none" }} />
                            </div>
                          ))}
                          <div style={{ borderTop: "1px solid #334155", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "11px", color: "#64748B" }}>합계</span>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#F1F5F9" }}>
                              {([newClientDebt1, newClientDebt2, newClientDebtCard, newClientDebtCapital, newClientDebtPolicy]
                                .reduce((s, v) => s + (Number(v) || 0), 0)).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                      {[
                        { label: "희망금액(원)", value: newClientDesired, setter: setNewClientDesired, placeholder: "예: 100000000" },
                      ].map(f => (
                        <div key={f.label}>
                          <label style={{ fontSize: "11px", color: "#64748B", display: "block", marginBottom: "4px" }}>{f.label}</label>
                          <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                            style={{ width: "100%", padding: "9px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", boxSizing: "border-box", outline: "none" }} />
                        </div>
                      ))}
                    </div>
                    {createClientError && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "10px" }}>{createClientError}</p>}
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                      <button onClick={() => { setShowCreateClient(false); setCreateClientError(""); }}
                        style={{ flex: 1, padding: "10px 0", backgroundColor: "transparent", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                        취소
                      </button>
                      <button onClick={handleCreateClient} disabled={createClientLoading}
                        style={{ flex: 1, padding: "10px 0", backgroundColor: "#3B82F6", border: "none", borderRadius: "8px", color: "#FFF", fontSize: "13px", fontWeight: "800", cursor: "pointer", opacity: createClientLoading ? 0.6 : 1 }}>
                        {createClientLoading ? "생성중..." : "생성"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Filters */}
              <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", border: "1px solid #334155", padding: "10px 12px", marginBottom: "10px" }} className="filter-row">
                <input placeholder="🔍 이름 또는 이메일" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ ...inp, flex: 1, minWidth: "140px" }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="전체">전체 상태</option>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="미신청">미신청</option>
                </select>
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="전체">전체 등급</option>
                  {["A", "B", "C", "D"].map(g => <option key={g} value={g}>{g}등급</option>)}
                </select>
                {admin?.role === "superadmin" && (
                  <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    <option value="전체">전체 담당자</option>
                    {adminList.map(a => <option key={a.username} value={a.name}>{a.name}</option>)}
                  </select>
                )}
                <select value={sortBy} onChange={e => setSortBy(e.target.value as "name" | "date" | "grade")} style={{ ...inp, cursor: "pointer" }}>
                  <option value="date">최신순</option>
                  <option value="name">이름순</option>
                  <option value="grade">등급순</option>
                </select>
                <p style={{ fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{filteredUsers.length}/{total}</p>
                <button onClick={() => setShowAddUser(true)}
                  style={{ padding: "8px 14px", backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                  ➕ 회원 추가
                </button>
                <button onClick={() => { setShowCreateClient(true); setCreateClientError(""); }}
                  style={{ padding: "8px 14px", backgroundColor: "#059669", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                  👤 클라이언트 생성
                </button>
              </div>

              <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr style={{ backgroundColor: "#0F172A" }}>
                        <th style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>이름</th>
                        <th className="col-hide-xs" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>이메일</th>
                        <th className="col-hide-mob" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>나이/성별</th>
                        <th className="col-hide-mob" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>NICE</th>
                        <th className="col-hide-mob" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>연매출</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>등급</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>상태</th>
                        <th className="col-hide-xs" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>가입일</th>
                        <th className="col-hide-xs" style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>포털</th>
                        <th style={{ padding: "10px 10px", textAlign: "left", fontSize: "11px", fontWeight: "700", color: "#64748B", borderBottom: "1px solid #334155", whiteSpace: "nowrap" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "14px" }}>
                          {users.length === 0 ? "아직 가입한 회원이 없습니다" : "검색 결과가 없습니다"}
                        </td></tr>
                      ) : filteredUsers.map((u, i) => {
                        const { grade } = calcGrade(u);
                        const gc = gradeColor(grade);
                        const statusC = u.application ? STATUS_COLORS[u.application.status] : null;
                        return (
                          <tr key={u.id} onClick={() => { setSelectedUser(u); setUserEmailStatus(u.application?.status || "접수대기"); }} style={{ borderBottom: "1px solid #1A2235", backgroundColor: i % 2 === 0 ? "#1E293B" : "#172032", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                            <td style={{ padding: "9px 10px", fontSize: "13px", fontWeight: "600", color: "#F1F5F9", whiteSpace: "nowrap" }}>{u.name}</td>
                            <td className="col-hide-xs" style={{ padding: "9px 10px", fontSize: "11px", color: "#94A3B8", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</td>
                            <td className="col-hide-mob" style={{ padding: "9px 10px", fontSize: "12px", color: "#94A3B8", whiteSpace: "nowrap" }}>{u.age}세/{u.gender}</td>
                            <td className="col-hide-mob" style={{ padding: "9px 10px", fontSize: "12px", color: "#94A3B8" }}>{u.nice_score}</td>
                            <td className="col-hide-mob" style={{ padding: "9px 10px", fontSize: "12px", color: "#94A3B8", whiteSpace: "nowrap" }}>
                              {Number(u.annual_revenue) >= 100000000
                                ? `${(Number(u.annual_revenue)/100000000).toFixed(1)}억`
                                : `${(Number(u.annual_revenue)/10000).toFixed(0)}만`}
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "800", color: gc, padding: "2px 6px", borderRadius: "5px", backgroundColor: `${gc}18` }}>{grade}</span>
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              {u.application && statusC ? (
                                <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 5px", borderRadius: "999px", backgroundColor: statusC.bg, color: statusC.text, border: `1px solid ${statusC.border}`, whiteSpace: "nowrap" }}>
                                  {u.application.status}
                                </span>
                              ) : <span style={{ fontSize: "10px", color: "#475569" }}>미신청</span>}
                            </td>
                            <td className="col-hide-xs" style={{ padding: "9px 10px", fontSize: "10px", color: "#64748B", whiteSpace: "nowrap" }}>{u.registeredAt?.split(" ")[0] ?? "-"}</td>
                            <td className="col-hide-xs" style={{ padding: "9px 10px" }}>
                              {(() => {
                                const isPortal = clientPortalUsers.some(p => p.phone?.replace(/-/g,"") === (u as {phone?:string}).phone?.replace(/-/g,""));
                                return isPortal
                                  ? <span style={{ fontSize: "10px", fontWeight: "700", color: "#34D399", backgroundColor: "#052E1C", padding: "2px 7px", borderRadius: "999px", border: "1px solid #34D399" }}>✓ 개설</span>
                                  : <span style={{ fontSize: "10px", color: "#475569" }}>-</span>;
                              })()}
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button onClick={e => { e.stopPropagation(); setSelectedUser(u); setUserEmailStatus(u.application?.status || "접수대기"); }}
                                  style={{ fontSize: "11px", fontWeight: "600", color: "#60A5FA", padding: "3px 6px", borderRadius: "5px", border: "1px solid #1E3A5F", backgroundColor: "#0F172A", cursor: "pointer", whiteSpace: "nowrap" }}>
                                  상세
                                </button>
                                <button onClick={e => { e.stopPropagation(); setDeleteConfirm(u.id); }}
                                  style={{ fontSize: "11px", color: "#F87171", border: "1px solid #450A0A", backgroundColor: "#1A0505", padding: "3px 5px", borderRadius: "5px", cursor: "pointer" }}>
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}


          {/* ── Naver Tab ── */}
          {tab === "naver" && (
            <div style={{ padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <p style={{ fontSize: "15px", fontWeight: "800", color: "#F1F5F9" }}>📊 네이버 광고 통계</p>
                <button onClick={async () => {
                  setNaverLoading(true);
                  try {
                    const [trendRes, statRes, campRes] = await Promise.all([
                      fetch("/api/naver?type=trend"),
                      fetch("/api/naver?type=stat"),
                      fetch("/api/naver?type=summary"),
                    ]);
                    const trend = await trendRes.json();
                    const stat = await statRes.json();
                    const camp = await campRes.json();
                    setNaverData({ trend, stat, campaigns: camp });
                  } catch { /* ignore */ }
                  setNaverLoading(false);
                }} style={{ padding: "8px 16px", backgroundColor: "#03C75A", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  {naverLoading ? "로딩..." : "🔄 데이터 불러오기"}
                </button>
              </div>

              {!naverData.trend && !naverLoading && (
                <div style={{ textAlign: "center", padding: "48px", color: "#64748B" }}>
                  <p style={{ fontSize: "32px", marginBottom: "10px" }}>📊</p>
                  <p style={{ fontSize: "14px" }}>"데이터 불러오기" 버튼을 눌러주세요</p>
                </div>
              )}

              {naverLoading && (
                <div style={{ textAlign: "center", padding: "48px", color: "#64748B" }}>
                  <p style={{ fontSize: "14px" }}>데이터 가져오는 중...</p>
                </div>
              )}

              {naverData.trend && (() => {
                const trendResult = naverData.trend?.data as {results?: {title: string; data: {period: string; ratio: number}[]}[]} | undefined;
                const statResult = naverData.stat?.data as {data?: {impCnt?: number; clkCnt?: number; salesAmt?: number; ctr?: number; cpc?: number}[]} | undefined;
                const campResult = naverData.campaigns?.data as {campaignName?: string; status?: string; dailyBudget?: number; campaignTp?: string}[] | undefined;
                const statItems = statResult?.data || [];
                const totalImp = statItems.reduce((s, d) => s + (d.impCnt || 0), 0);
                const totalClk = statItems.reduce((s, d) => s + (d.clkCnt || 0), 0);
                const totalCost = statItems.reduce((s, d) => s + (d.salesAmt || 0), 0);
                const avgCtr = statItems.length ? (statItems.reduce((s, d) => s + (d.ctr || 0), 0) / statItems.length).toFixed(2) : "0";
                const avgCpc = statItems.length ? Math.round(statItems.reduce((s, d) => s + (d.cpc || 0), 0) / statItems.length) : 0;
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* 광고 성과 요약 */}
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "12px" }}>💰 광고 성과 (최근 7일)</p>
                      {statItems.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "#64748B" }}>등록된 광고가 없거나 데이터가 없어요</p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                          {([
                            ["노이었 횟수", totalImp.toLocaleString(), "📰"],
                            ["클릭수", totalClk.toLocaleString(), "👆"],
                            ["총 비용", `${totalCost.toLocaleString()}원`, "💳"],
                            ["평균 CTR", `${avgCtr}%`, "📊"],
                            ["평균 CPC", `${avgCpc.toLocaleString()}원`, "🎯"],
                          ] as [string,string,string][]).map(([label, val, icon]) => (
                            <div key={label} style={{ backgroundColor: "#0F172A", borderRadius: "8px", padding: "12px" }}>
                              <p style={{ fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>{icon} {label}</p>
                              <p style={{ fontSize: "16px", fontWeight: "800", color: "#F1F5F9" }}>{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 검색어 트렌드 */}
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "12px" }}>🔍 검색어 트렌드 (최근 3개월)</p>
                      {!trendResult?.results ? (
                        <p style={{ fontSize: "13px", color: "#EF4444" }}>트렌드 데이터를 가져오지 못했어요</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {trendResult.results.map(r => {
                            const latest = r.data[r.data.length - 1];
                            const max = Math.max(...r.data.map(d => d.ratio));
                            return (
                              <div key={r.title}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#CBD5E1" }}>{r.title}</span>
                                  <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "700" }}>{latest?.ratio ?? 0}</span>
                                </div>
                                <div style={{ backgroundColor: "#0F172A", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                                  <div style={{ width: `${max > 0 ? ((latest?.ratio ?? 0) / max) * 100 : 0}%`, height: "100%", backgroundColor: "#3B82F6", borderRadius: "4px" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* 캠페인 목록 */}
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "12px" }}>📈 캠페인 목록</p>
                      {!campResult || campResult.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "#64748B" }}>등록된 캐페인이 없어요</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {campResult.map((c, i) => (
                            <div key={i} style={{ backgroundColor: "#0F172A", borderRadius: "8px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9" }}>{c.campaignName || "미설정"}</p>
                                <p style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>{c.campaignTp}</p>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px",
                                  backgroundColor: c.status === "ELIGIBLE" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                  color: c.status === "ELIGIBLE" ? "#22C55E" : "#EF4444" }}>
                                  {c.status === "ELIGIBLE" ? "운영중" : c.status}
                                </span>
                                {c.dailyBudget ? <p style={{ fontSize: "11px", color: "#64748B", marginTop: "3px" }}>일예산 {c.dailyBudget.toLocaleString()}원</p> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── All Consults Tab (superadmin) ── */}
          {tab === "all-consults" && admin?.role === "superadmin" && (
            <>
              <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", border: "1px solid #334155", padding: "10px 12px", marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                <input
                  placeholder="🔍 이름 / 연락처"
                  value={manageSearch}
                  onChange={e => setManageSearch(e.target.value)}
                  style={{ ...inp, flex: 1, minWidth: "130px" }}
                />
                <select value={manageStatusFilter} onChange={e => setManageStatusFilter(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">전체 상태</option>
                  {CONSULT_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={manageAdminFilter} onChange={e => setManageAdminFilter(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">전체 담당자</option>
                  {adminList.map(a => <option key={a.username} value={a.username}>{a.name}</option>)}
                </select>
                <button onClick={() => { setManageSearch(""); setManageStatusFilter(""); setManageAdminFilter(""); }}
                  style={{ ...inp, cursor: "pointer", color: "#94A3B8", padding: "9px 14px" }}>🗑️ 필터제거</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {consultations
                  .filter(c => {
                    const q = manageSearch.toLowerCase();
                    const ms = !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
                    const mst = !manageStatusFilter || c.status === manageStatusFilter;
                    const mad = !manageAdminFilter || c.assignedTo === manageAdminFilter;
                    return ms && mst && mad;
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(c => {
                    const sc = CONSULT_STATUS_COLORS[c.status] || CONSULT_STATUS_COLORS["접수대기"];
                    const gr = calcConsultGrade(c);
                    return (
                      <div key={c.id} onClick={() => openConsult(c)}
                        style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#60A5FA")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                              <span style={{ fontSize: "15px", fontWeight: "800", color: "#F1F5F9" }}>{c.name}</span>
                              <span style={{ fontSize: "12px", color: "#94A3B8" }}>{c.phone}</span>
                              <span style={{ fontSize: "11px", backgroundColor: `${sc.darkBg}`, color: sc.darkText, padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>{c.status}</span>
                              <span style={{ fontSize: "11px", color: gradeColor(gr.grade), fontWeight: "800" }}>{gr.grade}등급</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748B", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                              <span>🏭 {c.businessType || "-"}</span>
                              <span>💰 {c.desiredAmount || "-"}</span>
                              <span>👤 {c.assignedName || "미배정"}</span>
                              <span>📅 {c.createdAt?.slice(0, 10) || "-"}</span>
                            </div>
                          </div>
                          {c.alimtalkStatus === "failed" && (
                            <span style={{ fontSize: "11px", backgroundColor: "#450A0A", color: "#FCA5A5", padding: "2px 8px", borderRadius: "999px", fontWeight: "700", flexShrink: 0 }}>❌ 알림톡실패</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* ── Consultations Tab ── */}
          {tab === "consultations" && (
            <>
              {/* 서브탭: 접수대기 / 내 고객 */}
              <div style={{ display: "flex", gap: 0, marginBottom: "12px", borderBottom: "2px solid #334155" }}>
                {([
                  { key: "waiting" as ConsultTab, label: `⏳ 접수대기 (${filteredWaiting.length})` },
                  { key: "mine"    as ConsultTab, label: `👤 내 고객 (${filteredMine.length})` },
                ]).map(t => (
                  <button key={t.key} onClick={() => { setConsultTab(t.key); setCStatusFilter(""); }}
                    style={{
                      padding: "9px 18px", fontSize: "13px", fontWeight: "700",
                      border: "none", borderBottom: consultTab === t.key ? "2px solid #10B981" : "2px solid transparent",
                      marginBottom: "-2px", backgroundColor: "transparent",
                      color: consultTab === t.key ? "#34D399" : "#64748B",
                      cursor: "pointer", fontFamily: font,
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 필터/검색 */}
              <div style={{ backgroundColor: "#1E293B", borderRadius: "10px", border: "1px solid #334155", padding: "10px 12px", marginBottom: "10px" }} className="filter-row">
                <input value={cSearch} onChange={e => setCSearch(e.target.value)} placeholder="🔍 이름/연락처"
                  style={{ ...inp, flex: 1, minWidth: "130px" }} />
                {consultTab === "mine" && (
                  <select value={cStatusFilter} onChange={e => setCStatusFilter(e.target.value as ConsultStatus | "")} style={{ ...inp, cursor: "pointer" }}>
                    <option value="">전체 상태</option>
                    {CONSULT_STATUS_LIST.filter(s => s !== "접수대기").map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
                <select value={cGradeFilter} onChange={e => setCGradeFilter(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="">전체 등급</option>
                  {["A","B","C","D"].map(g => <option key={g} value={g}>{g}등급</option>)}
                </select>
                <span style={{ fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>{filteredConsults.length}건</span>
              </div>

              <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", overflow: "hidden" }}>
                {filteredConsults.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center" }}>
                    <p style={{ fontSize: "32px", marginBottom: "10px" }}>📭</p>
                    <p style={{ fontSize: "14px", color: "#64748B" }}>
                      {consultTab === "waiting" ? "접수대기 상담이 없습니다" : "담당 상담이 없습니다"}
                    </p>
                    <Link href="/consult" target="_blank" style={{ fontSize: "13px", color: "#60A5FA", textDecoration: "none" }}>→ 상담 신청 페이지</Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {filteredConsults.map((c, i) => {
                      const sc = CONSULT_STATUS_COLORS[c.status];
                      const { grade } = calcConsultGrade(c);
                      const gc = gradeColor(grade);
                      const isSelected = selectedConsult?.id === c.id;
                      const isAssigning = assigningId === c.id;
                      return (
                        <div key={c.id}
                          onClick={() => openConsult(c)}
                          style={{ padding: "14px 16px", borderBottom: "1px solid #1A2235", backgroundColor: isSelected ? "#0F2540" : i % 2 === 0 ? "#1E293B" : "#172032", cursor: "pointer", WebkitTapHighlightColor: "transparent", userSelect: "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "14px", fontWeight: "800", color: "#F1F5F9" }}>{c.name}</span>
                              <span style={{ fontSize: "11px", fontWeight: "800", color: gc, padding: "2px 7px", borderRadius: "5px", backgroundColor: `${gc}20` }}>{grade}</span>
                              <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: "700", backgroundColor: sc.darkBg, color: sc.darkText, border: `1px solid ${sc.border}55` }}>{c.status}</span>
                              {c.alimtalkStatus === "sent" && <span style={{ fontSize: "10px", color: "#34D399" }}>✅알림톡</span>}
                              {c.alimtalkStatus === "failed" && <span style={{ fontSize: "10px", color: "#EF4444" }}>❌알림톡</span>}
                            </div>
                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                              {consultTab === "waiting" && (
                                <>
                                  <select
                                    value={waitingAssignMap[c.id] || ""}
                                    onChange={e => setWaitingAssignMap(p => ({ ...p, [c.id]: e.target.value }))}
                                    onClick={e => e.stopPropagation()}
                                    style={{ padding: "6px 8px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px", color: "#F1F5F9", cursor: "pointer", fontFamily: font, maxWidth: "110px" }}
                                  >
                                    <option value="">내 계정</option>
                                    {adminList.map(a => (
                                      <option key={a.username} value={a.username}>{a.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    disabled={isAssigning}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      let targetAdm: AdminAccount | undefined = undefined;
                                      if (admin?.role === "superadmin" && waitingAssignMap[c.id]) {
                                        targetAdm = adminList.find(a => a.username === waitingAssignMap[c.id]);
                                      }
                                      await handleAssign(c, targetAdm);
                                    }}
                                    style={{ padding: "6px 12px", backgroundColor: isAssigning ? "#334155" : "#10B981", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: isAssigning ? "not-allowed" : "pointer" }}>
                                    {isAssigning ? "⏳" : "✅ 배정"}
                                  </button>
                                </>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); openConsult(c); }}
                                style={{ padding: "6px 14px", backgroundColor: "#2563EB", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>상세</button>
                              {/* 내 고객 탭 재배정 */}
                              {consultTab === "mine" && (
                                <>
                                  <select
                                    value={waitingAssignMap[c.id] || ""}
                                    onChange={e => setWaitingAssignMap(p => ({ ...p, [c.id]: e.target.value }))}
                                    onClick={e => e.stopPropagation()}
                                    style={{ padding: "6px 8px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px", color: "#F1F5F9", cursor: "pointer", fontFamily: font, maxWidth: "110px" }}
                                  >
                                    <option value="">담당자 선택</option>
                                    {adminList.map(a => (
                                      <option key={a.username} value={a.username}>{a.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    disabled={!waitingAssignMap[c.id] || isAssigning}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const targetAdm = adminList.find(a => a.username === waitingAssignMap[c.id]);
                                      if (!targetAdm) return;
                                      await handleAssign(c, targetAdm);
                                    }}
                                    style={{ padding: "6px 10px", backgroundColor: waitingAssignMap[c.id] ? "#6366F1" : "#334155", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: waitingAssignMap[c.id] ? "pointer" : "not-allowed" }}>
                                    🔄 재배정
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>📱 {c.phone}</span>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>🏢 {c.businessType}</span>
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>📅 {c.createdAt.slice(0, 10)}</span>
                          </div>
                          {consultTab === "mine" && c.assignedName && (
                            <div style={{ marginTop: "6px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "11px", color: "#60A5FA" }}>👤 담당: {c.assignedName}</span>
                              {c.assignedAt && <span style={{ fontSize: "11px", color: "#94A3B8" }}>📅 배정: {new Date(c.assignedAt).toLocaleDateString("ko-KR")}</span>}
                            </div>
                          )}
                          <p style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}>{c.id}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </>
          )}
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "16px" }}>
            <div style={{ maxWidth: "480px", width: "100%", backgroundColor: "#1E293B", borderRadius: "16px", border: "1px solid #334155", padding: "24px", marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontSize: "17px", fontWeight: "900", color: "#F1F5F9" }}>➕ 회원 직접 추가</p>
                <button onClick={() => setShowAddUser(false)}
                  style={{ width: "30px", height: "30px", backgroundColor: "#334155", border: "none", borderRadius: "50%", color: "#94A3B8", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {([
                  ["이름", "name", "text", "홍길동", true],
                  ["이메일", "email", "email", "example@email.com", true],
                  ["비밀번호", "password", "password", "비밀번호 설정", true],
                  ["나이", "age", "number", "예: 35", false],
                  ["연매출(원)", "annual_revenue", "number", "예: 50000000", false],
                  ["NICE점수", "nice_score", "number", "예: 720", false],
                  ["KCB점수", "kcb_score", "number", "예: 700", false],
                ] as [string, keyof typeof newUser, string, string, boolean][]).map(([label, key, type, ph, required]) => (
                  <div key={key}>
                    <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>
                      {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
                    </label>
                    <input
                      type={type} value={newUser[key]}
                      onChange={e => setNewUser(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={ph}
                      style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F1F5F9", fontSize: "13px", outline: "none", fontFamily: "inherit" }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>성별</label>
                  <select value={newUser.gender} onChange={e => setNewUser(prev => ({ ...prev, gender: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F1F5F9", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                    <option>남성</option>
                    <option>여성</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                <button onClick={() => setShowAddUser(false)}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#334155", color: "#CBD5E1", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  취소
                </button>
                <button onClick={handleAddUser} disabled={addUserSaving}
                  style={{ flex: 2, padding: "12px", backgroundColor: addUserSaving ? "#334155" : "#2563EB", color: "#FFF", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: addUserSaving ? "not-allowed" : "pointer" }}>
                  {addUserSaving ? "저장 중..." : "➕ 회원 추가"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUser && (() => {
          const { grade } = calcGrade(selectedUser);
          const gc = gradeColor(grade);
          const userPhone = (selectedUser as UserRecord & { phone?: string }).phone || getAllConsultations().find(c => c.name === selectedUser.name)?.phone || "";
          const linkedConsults = consultations.filter(c => c.name === selectedUser.name || c.phone === userPhone).sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
          const latestConsult = linkedConsults[0];
          const isPortal = clientPortalUsers.some(p => p.phone?.replace(/-/g,"") === userPhone?.replace(/-/g,""));

          const openUser = (u: UserRecord) => {
            setUName(u.name||""); setUPhone(userPhone); setUEmail(u.email||"");
            setUAge(u.age||""); setUGender(u.gender||""); setUBizType((u as UserRecord & {businessType?:string}).businessType||"");
            setUBizPeriod((u as UserRecord & {businessPeriod?:string}).businessPeriod||"");
            setURevenue(u.annual_revenue||""); setUNice(u.nice_score||""); setUKcb(u.kcb_score||"");
            const dd = (u as UserRecord & {debtDetail?:{first?:string;second?:string;cardLoan?:string;capital?:string;policy?:string}}).debtDetail;
            setUDebtFirst(dd?.first||""); setUDebtSecond(dd?.second||""); setUDebtCard(dd?.cardLoan||"");
            setUDebtCapital(dd?.capital||""); setUDebtPolicy(dd?.policy||"");
            setUDesiredAmount((u as UserRecord & {desiredAmount?:string}).desiredAmount||"");
            setUMemo((u as UserRecord & {adminMemo?:string}).adminMemo||"");
            setUSaved(false);
          };
          if (uName==="" && selectedUser.name) openUser(selectedUser);

          const saveUser = async () => {
            const all = getAllUsers();
            const updated = all.map(u => u.id === selectedUser.id ? {
              ...u, name:uName, email:uEmail, age:uAge, gender:uGender,
              annual_revenue:uRevenue, nice_score:uNice, kcb_score:uKcb,
              currentDebt: String([uDebtFirst,uDebtSecond,uDebtCard,uDebtCapital,uDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0)),
              debtDetail:{first:uDebtFirst,second:uDebtSecond,cardLoan:uDebtCard,capital:uDebtCapital,policy:uDebtPolicy},
              desiredAmount:uDesiredAmount, adminMemo:uMemo,
            } : u);
            saveAllUsers(updated);
            await fetch("/api/db?key=clientUsers").then(r=>r.json()).then(d=>{
              const cu = (d.value||[]).map((u:{phone:string}) => u.phone?.replace(/-/g,"")=== userPhone?.replace(/-/g,"") ? {...u,name:uName,email:uEmail} : u);
              fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:"clientUsers",value:cu})});
            });
            setUSaved(true); showSuccess("✅ 회원 정보 저장 완료");
            setTimeout(()=>setUSaved(false),3000);
          };

          return (
            <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "16px" }}>
              <div style={{ maxWidth: "640px", width: "100%", margin: "0 auto" }}>

                {/* 헤더 + 정보 수정 */}
                <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: `${gc}20`, border: `2px solid ${gc}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "16px", fontWeight: "900", color: gc }}>{grade}</span>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <p style={{ fontSize: "16px", fontWeight: "900", color: "#F1F5F9" }}>{selectedUser.name}</p>
                          {isPortal && <span style={{ fontSize: "10px", fontWeight: "700", color: "#34D399", backgroundColor: "#052E1C", padding: "2px 8px", borderRadius: "999px", border: "1px solid #34D399" }}>✓ 포털</span>}
                        </div>
                        <p style={{ fontSize: "11px", color: "#64748B" }}>{userPhone}</p>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedUser(null); setUName(""); }}
                      style={{ width: "30px", height: "30px", backgroundColor: "#334155", border: "none", borderRadius: "50%", color: "#94A3B8", cursor: "pointer", fontSize: "16px" }}>×</button>
                  </div>

                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "8px" }}>👤 고객 정보 수정</p>
                  <div className="consult-detail-grid">
                    {([
                      ["이름", uName, setUName, "text"],
                      ["연락처", uPhone, setUPhone, "text"],
                      ["이메일", uEmail, setUEmail, "email"],
                      ["나이", uAge, setUAge, "text"],
                      ["성별", uGender, setUGender, "text"],
                      ["업종", uBizType, setUBizType, "text"],
                      ["업력", uBizPeriod, setUBizPeriod, "text"],
                      ["연매출(원)", uRevenue, setURevenue, "number"],
                      ["NICE점수", uNice, setUNice, "number"],
                      ["KCB점수", uKcb, setUKcb, "number"],
                      ["희망금액", uDesiredAmount, setUDesiredAmount, "text"],
                    ] as [string,string,(v:string)=>void,string][]).map(([label,val,setter,type]) => (
                      <div key={label} style={{ padding: "6px 8px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                        <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>{label}</p>
                        <input type={type} value={val} onChange={e=>setter(e.target.value)}
                          style={{ ...inp, width: "100%", fontSize: "12px", padding: "4px 8px" }} />
                      </div>
                    ))}
                  </div>

                  {/* 기대출 5종 */}
                  <div style={{ marginTop: "10px" }}>
                    <p style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", marginBottom: "8px" }}>🏦 기대출 상세 (종류별)</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {([
                        ["1금융권", uDebtFirst, setUDebtFirst],
                        ["2금융권", uDebtSecond, setUDebtSecond],
                        ["카드론", uDebtCard, setUDebtCard],
                        ["캐피탈", uDebtCapital, setUDebtCapital],
                        ["정책자금", uDebtPolicy, setUDebtPolicy],
                      ] as [string,string,(v:string)=>void][]).map(([label,val,setter]) => (
                        <div key={label} style={{ padding: "6px 8px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                          <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>{label}</p>
                          <input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder="0"
                            style={{ ...inp, width: "100%", fontSize: "12px", padding: "4px 8px" }} />
                        </div>
                      ))}
                      <div style={{ padding: "6px 8px", backgroundColor: "#1E3A5F", borderRadius: "8px", border: "1px solid #3B82F6" }}>
                        <p style={{ fontSize: "10px", color: "#93C5FD", marginBottom: "3px" }}>합계</p>
                        <p style={{ fontSize: "13px", fontWeight: "800", color: "#60A5FA" }}>
                          {[uDebtFirst,uDebtSecond,uDebtCard,uDebtCapital,uDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0).toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 메모 */}
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>관리자 메모</p>
                    <textarea value={uMemo} onChange={e=>setUMemo(e.target.value)} rows={2}
                      style={{ ...inp, width: "100%", resize: "vertical", fontSize: "12px" }} />
                  </div>

                  <button onClick={saveUser} disabled={uSaved}
                    style={{ width: "100%", marginTop: "10px", padding: "11px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700",
                      cursor: "pointer", backgroundColor: uSaved ? "#16A34A" : "#1D4ED8", color: "#FFF" }}>
                    {uSaved ? "✓ 저장완료" : "💾 정보 저장"}
                  </button>

                  {/* 회원 정책자금 관리 */}
                  <div style={{ marginTop: "12px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "14px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "800", color: "#60A5FA", marginBottom: "10px" }}>🏦 진행중인 정책자금</p>
                    {/* 직접 입력 자금 추가 */}
                    <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                      <input
                        value={newUserFundName}
                        onChange={e => setNewUserFundName(e.target.value)}
                        placeholder="자금명 직접 입력 (예: 소진공 일반경영안정자금)"
                        style={{ flex: 2, minWidth: "160px", padding: "8px 10px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }}
                      />
                      <input
                        value={newUserFundAmount}
                        onChange={e => setNewUserFundAmount(e.target.value)}
                        placeholder="승인금액 (예: 5,000만원)"
                        style={{ flex: 1, minWidth: "90px", padding: "8px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }}
                      />
                      <button
                        disabled={!newUserFundName.trim()}
                        onClick={async () => {
                          if (!newUserFundName.trim()) return;
                          const fund = getAllFunds().find(f => f.name === newUserFundName.trim());
                          const newFund = {
                            id: `uf_${Date.now()}`,
                            fundName: newUserFundName,
                            fundId: fund?.id || "",
                            amount: newUserFundAmount,
                            status: "접수대기",
                            addedAt: new Date().toISOString(),
                          };
                          const existingFunds = (selectedUser as UserRecord & {funds?: typeof newFund[]}).funds || [];
                          const updatedUser = { ...selectedUser, funds: [...existingFunds, newFund] };
                          upsertUser(updatedUser as UserRecord);
                          // 서버 DB 저장
                          const allU = getAllUsers();
                          await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allU }) });
                          localStorage.setItem("users", JSON.stringify(allU));
                          setUsers(allU);
                          setSelectedUser(updatedUser as UserRecord);
                          setNewUserFundName(""); setNewUserFundAmount("");
                          showSuccess("✅ 자금 추가 완료!");
                        }}
                        style={{ padding: "8px 14px", backgroundColor: newUserFundName && newUserFundName !== "__custom__" ? "#2563EB" : "#334155", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                        + 추가
                      </button>
                    </div>
                    {/* 자금 목록 */}
                    {((selectedUser as UserRecord & {funds?: Array<{id:string;fundName:string;amount:string;status:string;addedAt:string}>}).funds || []).filter(f => f.status !== "승인" && f.status !== "부결" && f.status !== "보완").length === 0 ? (
                      <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "12px 0" }}>등록된 자금이 없어요.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {((selectedUser as UserRecord & {funds?: Array<{id:string;fundName:string;amount:string;status:string;addedAt:string}>}).funds || []).filter(f => f.status !== "승인" && f.status !== "부결" && f.status !== "보완").map((f) => (
                          <div key={f.id} style={{ backgroundColor: "#1E293B", borderRadius: "8px", padding: "10px 12px", border: "1px solid #1E3A8A", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: "700", color: "#60A5FA" }}>{f.fundName}</p>
                              <p style={{ fontSize: "11px", color: "#64748B" }}>{f.amount} · {f.status}</p>
                            </div>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                              <select
                                value={f.status}
                                onChange={async e => {
                                  const type = selectedUser as UserRecord & {funds?: Array<{id:string;fundName:string;fundId?:string;amount:string;status:string;addedAt:string}>};
                                  const updated = (type.funds || []).map(x => x.id === f.id ? {...x, status: e.target.value} : x);
                                  const updatedUser = { ...selectedUser, funds: updated };
                                  upsertUser(updatedUser as UserRecord);
                                  const allU = getAllUsers();
                                  await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allU }) });
                                  localStorage.setItem("users", JSON.stringify(allU));
                                  setUsers(allU);
                                  setSelectedUser(updatedUser as UserRecord);
                                  showSuccess("✅ 상태 변경 완료!");
                                }}
                                style={{ padding: "4px 8px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", fontSize: "11px", color: "#F1F5F9", cursor: "pointer" }}
                              >
                                {["접수완료","심사대기","심사중","승인","부결","보완"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                onClick={async () => {
                                  const type = selectedUser as UserRecord & {funds?: Array<{id:string;fundName:string;fundId?:string;amount:string;status:string;addedAt:string}>};
                                  const updated = (type.funds || []).filter(x => x.id !== f.id);
                                  const updatedUser = { ...selectedUser, funds: updated };
                                  upsertUser(updatedUser as UserRecord);
                                  const allU = getAllUsers();
                                  await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "users", value: allU }) });
                                  localStorage.setItem("users", JSON.stringify(allU));
                                  setUsers(allU);
                                  setSelectedUser(updatedUser as UserRecord);
                                  showSuccess("✅ 자금 삭제 완료!");
                                }}
                                style={{ padding: "4px 8px", backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "6px", color: "#EF4444", fontSize: "11px", cursor: "pointer" }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 상담 연동 자금 현황 (FundProgress) */}
                  {(() => {
                    // 이름으로 매칭 후 최신 상담 우선
                    const userConsults = consultations.filter(c => c.name === selectedUser.name).sort((a,b) => b.id.localeCompare(a.id));
                    const linkedConsult = userConsults[0];
                    if (!linkedConsult) return null;
                    return (
                      <div style={{ marginTop: "8px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "14px" }}>
                        <p style={{ fontSize: "13px", fontWeight: "800", color: "#10B981", marginBottom: "10px" }}>📊 승인완료 정책자금</p>
                        {/* 자금 추가 폼 */}
                        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                          <input
                            value={newFundName}
                            onChange={e => setNewFundName(e.target.value)}
                            placeholder="자금명 직접 입력"
                            style={{ flex: 2, minWidth: "140px", padding: "7px 10px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }}
                          />
                          <input
                            value={newFundAmount}
                            onChange={e => setNewFundAmount(e.target.value)}
                            placeholder="승인금액"
                            style={{ flex: 1, minWidth: "80px", padding: "7px 10px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#F1F5F9" }}
                          />
                          <button
                            disabled={!newFundName.trim()}
                            onClick={async () => {
                              if (!newFundName.trim()) return;
                              const newFund: FundProgress = {
                                id: `f_${Date.now()}`,
                                fundName: newFundName.trim(),
                                amount: newFundAmount.trim(),
                                status: "승인",
                                institution: "",
                                updatedAt: new Date().toLocaleString("ko-KR"),
                              };
                              updateConsultation(linkedConsult.id, { funds: [...(linkedConsult.funds || []), newFund] });
                              const fresh = getAllConsultations();
                              await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "consultations", value: fresh }) });
                              setConsultations(fresh);
                              setNewFundName(""); setNewFundAmount("");
                              showSuccess("✅ 자금 추가 완료!");
                            }}
                            style={{ padding: "7px 14px", backgroundColor: newFundName.trim() ? "#2563EB" : "#334155", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: newFundName.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                            + 추가
                          </button>
                        </div>
                        {(() => {
                          type UF = {id:string;fundName:string;amount:string;status:string;addedAt?:string;institution?:string;updatedAt?:string};
                          const approvedFromUser = ((selectedUser as UserRecord & {funds?: UF[]}).funds || []).filter(f => f.status === "승인");
                          const approvedFromConsult = (linkedConsult.funds || []).filter(f => (f.status as string) === "승인");
                          const allApproved = [...approvedFromUser, ...approvedFromConsult];
                          if (allApproved.length === 0) return <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "10px 0" }}>등록된 자금 현황이 없어요.</p>;
                          return (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {allApproved.map(fund => {
                              const borderColor = FUND_STATUS_COLORS[fund.status] ? "#334155" : "#334155";
                              return (
                                <div key={fund.id} style={{ backgroundColor: "#1E293B", borderRadius: "8px", padding: "10px 12px", border: `1px solid ${borderColor}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                    <div>
                                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9" }}>{fund.fundName}</p>
                                      {fund.amount && <p style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{fund.amount}만원</p>}
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                      <select
                                        value={fund.status}
                                        onChange={async e => {
                                          const updated = (linkedConsult.funds || []).map(f => f.id === fund.id ? {...f, status: e.target.value as FundStatus} : f);
                                          updateConsultation(linkedConsult.id, { funds: updated });
                                          const fresh = getAllConsultations();
                                          await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "consultations", value: fresh }) });
                                          setConsultations(fresh);
                                          showSuccess("✅ 상태 변경 완료!");
                                        }}
                                        style={{ padding: "4px 8px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", fontSize: "11px", color: "#F1F5F9", cursor: "pointer" }}
                                      >
                                        {FUND_STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                      <button
                                        onClick={async () => {
                                          const updated = (linkedConsult.funds || []).filter(f => f.id !== fund.id);
                                          updateConsultation(linkedConsult.id, { funds: updated });
                                          const fresh = getAllConsultations();
                                          await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "consultations", value: fresh }) });
                                          setConsultations(fresh);
                                          showSuccess("✅ 자금 삭제 완료!");
                                        }}
                                        style={{ padding: "4px 8px", backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "6px", color: "#EF4444", fontSize: "11px", cursor: "pointer" }}>
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          );
                        })()}
                      </div>
                    );
                  })()}

                  {/* AI 보고서 버튼 */}
                  <button
                    onClick={async () => {
                      setAiReportLoading(true); setShowAiReport(true); setAiReport("");
                      const { grade } = calcGrade(selectedUser);
                      const allFunds = getAllFunds();
                      const nice = Number(selectedUser.nice_score) || 0;
                      const rev = Number(selectedUser.annual_revenue) || 0;
                      const debt = Number((selectedUser as UserRecord & {currentDebt?:string}).currentDebt) || 0;
                      const recFunds = allFunds.filter(f => {
                        if (!f.active) return false;
                        if (!f.eligibleGrades.includes(grade)) return false;
                        if (Number(f.minRevenue) > 0 && rev < Number(f.minRevenue)) return false;
                        if (Number(f.minCreditScore) > 0 && nice < Number(f.minCreditScore)) return false;
                        if (Number(f.maxDebt) > 0 && debt > Number(f.maxDebt)) return false;
                        return true;
                      }).slice(0, 6);
                      const clientData = {
                        name: selectedUser.name,
                        businessType: (selectedUser as UserRecord & {businessType?:string}).businessType || "",
                        businessPeriod: (selectedUser as UserRecord & {businessPeriod?:string}).businessPeriod || "",
                        annual_revenue: selectedUser.annual_revenue,
                        nice_score: selectedUser.nice_score,
                        kcb_score: selectedUser.kcb_score,
                        currentDebt: (selectedUser as UserRecord & {currentDebt?:string}).currentDebt || "0",
                        desiredAmount: (selectedUser as UserRecord & {desiredAmount?:string}).desiredAmount || "",
                        grade,
                        assignedName: latestConsult?.assignedName || "",
                        funds: recFunds,
                      };
                      try {
                        const res = await fetch("/api/ai-report", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ client: clientData }) });
                        const data = await res.json();
                        setAiReport(data.report || data.error || "오류 발생");
                      } catch (e) { setAiReport("오류: " + e); }
                      setAiReportLoading(false);
                    }}
                    style={{ width: "100%", marginTop: "8px", padding: "11px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", backgroundColor: "#7C3AED", color: "#FFF" }}>
                    🤖 AI 분석 보고서 생성
                  </button>

                  {/* AI 보고서 결과 패널 */}
                  {showAiReport && (
                    <div style={{ marginTop: "12px", backgroundColor: "#0F172A", border: "1px solid #7C3AED", borderRadius: "12px", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <p style={{ fontSize: "13px", fontWeight: "800", color: "#A78BFA" }}>🤖 AI 분석 보고서</p>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {!aiReportLoading && aiReport && (
                            <button
                              onClick={() => {
                                // PDF 다운로드
                                const win = window.open("", "_blank");
                                if (!win) return;
                                win.document.write(`
                                  <!DOCTYPE html><html><head>
                                  <meta charset="utf-8">
                                  <title>${selectedUser.name} 분석 보고서</title>
                                  <style>
                                    body { font-family: 'Malgun Gothic', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.8; }
                                    h1 { color: #1e3a8a; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; }
                                    h2 { color: #1d4ed8; margin-top: 28px; border-left: 4px solid #3b82f6; padding-left: 12px; }
                                    strong { color: #059669; }
                                    .meta { background: #f0f4ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 14px; }
                                    @media print { body { margin: 20px; } }
                                  </style>
                                  </head><body>
                                  <div class="meta">
                                    <strong>고객명:</strong> ${selectedUser.name} &nbsp;|
                                    <strong> 업종:</strong> ${(selectedUser as UserRecord & {businessType?:string}).businessType || "-"} &nbsp;|
                                    <strong> SOHO등급:</strong> ${calcGrade(selectedUser).grade} &nbsp;|
                                    <strong> 작성일:</strong> ${new Date().toLocaleDateString("ko-KR")}
                                  </div>
                                  ${aiReport.replace(/\n/g,"<br/>").replace(/#{1,2} /g,"<h2>").replace(/<h2>([^<]+)/g, "<h2>$1</h2>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")}
                                  </body></html>
                                `);
                                win.document.close();
                                setTimeout(() => win.print(), 500);
                              }}
                              style={{ padding: "6px 12px", backgroundColor: "#059669", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
                              📄 PDF 저장
                            </button>
                          )}
                          <button onClick={() => setShowAiReport(false)}
                            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "16px" }}>×</button>
                        </div>
                      </div>
                      {aiReportLoading ? (
                        <div style={{ textAlign: "center", padding: "32px 0" }}>
                          <p style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</p>
                          <p style={{ fontSize: "13px", color: "#A78BFA" }}>AI가 분석 중입니다...</p>
                          <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px" }}>10~20초 소요</p>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#CBD5E1", lineHeight: "1.8", whiteSpace: "pre-wrap", maxHeight: "400px", overflowY: "auto" }}>
                          {aiReport}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 연결된 상담 */}
                {linkedConsults.length > 0 && (
                  <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "10px" }}>📋 연결된 상담 ({linkedConsults.length}건)</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {linkedConsults.map(c => {
                        const sc = CONSULT_STATUS_COLORS[c.status] || CONSULT_STATUS_COLORS["접수대기"];
                        return (
                          <div key={c.id} style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px 14px", border: "1px solid #334155" }}>
                            <div onClick={() => { setSelectedUser(null); setUName(""); openConsult(c); }}
                              style={{ cursor: "pointer", marginBottom: "8px" }}
                              onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")}
                              onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "11px", backgroundColor: sc.darkBg, color: sc.darkText, padding: "2px 8px", borderRadius: "999px", fontWeight: "700" }}>{c.status}</span>
                                    <span style={{ fontSize: "11px", color: "#94A3B8" }}>{c.createdAt?.slice(0,10)}</span>
                                    {c.assignedName && <span style={{ fontSize: "11px", color: "#60A5FA" }}>👤 {c.assignedName}</span>}
                                  </div>
                                  <p style={{ fontSize: "12px", color: "#CBD5E1" }}>💼 {c.businessType||"-"} · 💰 {c.desiredAmount||"-"}</p>
                                </div>
                                <span style={{ fontSize: "11px", color: "#60A5FA" }}>상세 →</span>
                              </div>
                            </div>
                            {/* 담당자 배정 UI */}
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                              <select
                                value={waitingAssignMap[c.id] || ""}
                                onChange={e => setWaitingAssignMap(p => ({ ...p, [c.id]: e.target.value }))}
                                style={{ flex: 1, padding: "6px 8px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "11px", color: "#F1F5F9", cursor: "pointer", fontFamily: font }}
                              >
                                <option value="">{c.assignedName ? `현재: ${c.assignedName}` : "담당자 미배정"}</option>
                                {adminList.map(a => (
                                  <option key={a.username} value={a.username}>{a.name}</option>
                                ))}
                              </select>
                              <button
                                disabled={!waitingAssignMap[c.id] || assigningId === c.id}
                                onClick={async () => {
                                  const targetAdm = adminList.find(a => a.username === waitingAssignMap[c.id]);
                                  if (!targetAdm) return;
                                  await handleAssign(c, targetAdm);
                                  setWaitingAssignMap(p => { const n = {...p}; delete n[c.id]; return n; });
                                }}
                                style={{ padding: "6px 10px", backgroundColor: waitingAssignMap[c.id] ? "#6366F1" : "#334155", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: waitingAssignMap[c.id] ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                                {assigningId === c.id ? "⏳" : "✅ 배정"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 자금 현황 */}
                {latestConsult?.funds && latestConsult.funds.length > 0 && (
                  <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#10B981", marginBottom: "10px" }}>💰 자금 현황</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {latestConsult.funds.map((f, fi) => {
                        const fcRaw = FUND_STATUS_COLORS[f.status]; const fc = typeof fcRaw === "string" ? { bg:"#1E293B", text:fcRaw, border:"#334155" } : (fcRaw || { bg:"#1E293B", text:"#94A3B8", border:"#334155" });
                        return (
                          <div key={fi} style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px 14px", border: `1px solid ${fc.border}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "4px" }}>{f.fundName}</p>
                                <p style={{ fontSize: "11px", color: "#64748B" }}>집행액: {f.amount||"-"} · {f.institution||""}</p>
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", backgroundColor: fc.bg, color: fc.text, border: `1px solid ${fc.border}` }}>{f.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 📍 진행단계 클릭 변경 */}
                {(() => {
                  const STEPS: ConsultStatus[] = ["접수확인", "상담예약", "서류요청", "자금 신청", "승인완료", "미승인", "리마인드", "상담종결"];
                  const curIdx = STEPS.indexOf((latestConsult?.status ?? "접수대기") as ConsultStatus);
                  return (
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#10B981", marginBottom: "12px" }}>📍 진행단계</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: "4px" }}>
                        {STEPS.map((step, i) => {
                          const done = curIdx > i;
                          const current = curIdx === i;
                          const color = current ? "#3B82F6" : done ? "#10B981" : "#334155";
                          return (
                            <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                              <div
                                onClick={async () => {
                                  if (!latestConsult) return;
                                  const updated = { ...latestConsult, status: step };
                                  updateConsultation(latestConsult.id, { status: step });
                                  const all = getAllConsultations();
                                  await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "consultations", value: all }) });
                                  setConsultations(all);
                                  showSuccess(`✅ 진행단계 → ${step}`);
                                }}
                                style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
                              >
                                <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#FFF", fontWeight: "800", flexShrink: 0, border: current ? "2px solid #93C5FD" : "none" }}>
                                  {done ? "✓" : i + 1}
                                </div>
                                <span style={{ fontSize: "8px", color: current ? "#60A5FA" : done ? "#10B981" : "#475569", fontWeight: current ? "800" : "500", whiteSpace: "nowrap" }}>{step}</span>
                              </div>
                              {i < STEPS.length - 1 && (
                                <div style={{ width: "14px", height: "2px", backgroundColor: done ? "#10B981" : "#1E293B", borderRadius: "1px", margin: "0 2px", marginBottom: "14px", flexShrink: 0 }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 포털 관리 + 서류 체크리스트 */}
                <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#A78BFA", marginBottom: "10px" }}>🔑 포털 관리</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <button onClick={async () => {
                      if (!latestConsult) { alert("연결된 상담이 없습니다"); return; }
                      const tokenRes = await fetch("/api/register-token", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"create", consultationId:latestConsult.id, name:selectedUser.name, phone:userPhone}) });
                      const td = await tokenRes.json();
                      if (!td.ok) { alert("토큰 생성 실패"); return; }
                      const link = `https://emfrontier.team/register?token=${td.token}`;
                      const res = await fetch("/api/alimtalk", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ consultation:{...latestConsult, registerLink:link}, templateType:"register_portal" }) });
                      const d = await res.json();
                      if (d.ok) showSuccess("✅ 회원가입 링크 발송 완료");
                      else { navigator.clipboard.writeText(link); showSuccess("📋 링크 복사됨 (알림톡 실패)"); }
                    }} style={{ flex:1, padding:"10px", backgroundColor:"#0369A1", color:"#FFF", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
                      📲 가입 링크 발송
                    </button>
                    <button onClick={async () => {
                      if (!latestConsult) { alert("연결된 상담이 없습니다"); return; }
                      const tokenRes = await fetch("/api/upload-token", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({action:"create", consultationId:latestConsult.id, name:selectedUser.name, phone:userPhone}) });
                      const td = await tokenRes.json();
                      if (!td.ok) { alert("토큰 생성 실패"); return; }
                      const link = `https://emfrontier.team/upload?token=${td.token}`;
                      const docText = userDocList.length > 0 ? `\n\n필요 서류 (${userDocList.length}개):\n` + userDocList.map((d,i)=>`${i+1}. ${d}`).join("\n") : "";
                      const res = await fetch("/api/alimtalk", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ consultation:{...latestConsult, manager:admin?.name, managerPhone:admin?.phone, uploadLink:link, docList:docText}, templateType:"docs_request_link" }) });
                      const d = await res.json();
                      if (d.ok) { setUserUploadLinkSent(true); showSuccess("✅ 서류 링크 발송 완료"); setTimeout(()=>setUserUploadLinkSent(false),4000); }
                      else { navigator.clipboard.writeText(link); showSuccess("📋 링크 복사됨 (알림톡 실패)"); }
                    }} style={{ flex:1, padding:"10px", backgroundColor:userUploadLinkSent?"#16A34A":userUploadLinkSending?"#334155":"#0F766E", color:"#FFF", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>
                      {userUploadLinkSent ? "✅ 발송완료" : "📎 서류 링크 발송"}
                    </button>
                  </div>

                  {/* 서류 체크리스트 */}
                  <div style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px", marginBottom: "8px", border: "1px solid #0F766E" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showUserDocChecklist ? "12px" : "0" }}>
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#34D399", margin: 0 }}>📎 서류 체크리스트 {userDocList.length > 0 && <span style={{ backgroundColor: "#065F46", color: "#34D399", padding: "1px 7px", borderRadius: "999px", fontSize: "11px", marginLeft: "6px" }}>{userDocList.length}선택</span>}</p>
                      <button onClick={() => setShowUserDocChecklist(p=>!p)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "12px" }}>{showUserDocChecklist ? "▲ 접기" : "▼ 펼치기"}</button>
                    </div>
                    {showUserDocChecklist && (
                      <>
                        {[
                          { section: "[필수]", items: ["사업자등록증","사업자등록증명","신분증 사본","재무제표","부가세 자료","통장내역","거래처 계약서/발주서","4대보험 가입자 명부","국세 완납증명서","지방세 완납증명서"] },
                          { section: "[재무]", items: ["매출증빙","세금신고서","대출내역서(개인,사업자)","KCB/NICE 점수"] },
                          { section: "[사업]", items: ["사업계획서","자금사용계획"] },
                          { section: "[추가]", items: ["공동인증서 개인 및 범용","계약서"] },
                        ].map(group => (
                          <div key={group.section} style={{ marginBottom: "10px" }}>
                            <p style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", marginBottom: "6px" }}>{group.section}</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                              {group.items.map(item => {
                                const checked = userDocList.includes(item);
                                return (
                                  <button key={item} onClick={() => setUserDocList(p => checked ? p.filter(d=>d!==item) : [...p, item])}
                                    style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                                      border: `1px solid ${checked ? "#34D399" : "#334155"}`,
                                      backgroundColor: checked ? "#052E1C" : "#1E293B",
                                      color: checked ? "#34D399" : "#64748B" }}>
                                    {checked ? "✓ " : ""}{item}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button onClick={() => setUserDocList(["사업자등록증","사업자등록증명","신분증 사본","재무제표","부가세 자료","통장내역","거래처 계약서/발주서","4대보험 가입자 명부","국세 완납증명서","지방세 완납증명서"])}
                            style={{ flex:1, padding:"6px", backgroundColor:"#1E3A5F", color:"#60A5FA", border:"1px solid #3B82F6", borderRadius:"6px", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>
                            필수 전체선택
                          </button>
                          <button onClick={() => setUserDocList([])}
                            style={{ padding:"6px 12px", backgroundColor:"#1E293B", color:"#94A3B8", border:"1px solid #334155", borderRadius:"6px", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>
                            초기화
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {isPortal && (
                    <div style={{ padding:"10px 12px", backgroundColor:"#0F172A", borderRadius:"8px", border:"1px solid #334155" }}>
                      <p style={{ fontSize:"11px", color:"#64748B", marginBottom:"4px" }}>포털 비밀번호 변경</p>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <input id="user-pw-input" placeholder="새 비밀번호" style={{ flex:1, padding:"8px 12px", backgroundColor:"#1E293B", border:"1px solid #334155", borderRadius:"8px", fontSize:"13px", color:"#F1F5F9", outline:"none" }} />
                        <button onClick={async () => {
                          const pw = (document.getElementById("user-pw-input") as HTMLInputElement)?.value;
                          if (!pw || pw.length < 6) { alert("6자 이상 입력해주세요"); return; }
                          const dbRes = await fetch("/api/db?key=clientUsers").then(r=>r.json()).catch(()=>({value:[]}));
                          const cu = dbRes.value || [];
                          const updated = cu.map((u: {phone:string;password:string}) => u.phone?.replace(/-/g,"")=== userPhone?.replace(/-/g,"") ? {...u, password:pw} : u);
                          await fetch("/api/db", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({key:"clientUsers", value:updated}) });
                          setClientPortalUsers(updated);
                          showSuccess("✅ 비밀번호 변경 완료");
                        }} style={{ padding:"8px 14px", backgroundColor:"#7C3AED", color:"#FFF", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>변경</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 이메일 발송 */}
                <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "10px" }}>📧 이메일 발송</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                    {["접수대기", "상담예약", "서류요청", "신청진행", "상담완료", "종결"].map(s => (
                      <button key={s} onClick={() => setUserEmailStatus(s)}
                        style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                          border: `2px solid ${userEmailStatus === s ? "#3B82F6" : "#334155"}`,
                          backgroundColor: userEmailStatus === s ? "rgba(59,130,246,0.15)" : "#0F172A",
                          color: userEmailStatus === s ? "#60A5FA" : "#64748B" }}>{s}</button>
                    ))}
                  </div>
                  <button onClick={sendUserEmail} disabled={userEmailSending}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700",
                      cursor: userEmailSending ? "not-allowed" : "pointer",
                      backgroundColor: userEmailSent ? "#16A34A" : userEmailSending ? "#334155" : "#0F766E", color: "#FFF" }}>
                    {userEmailSent ? "✓ 이메일 발송완료!" : userEmailSending ? "📧 전송 중..." : `📧 ${userEmailStatus} 이메일 발송`}
                  </button>
                </div>

                {/* 카카오 알림톡 */}
                <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "10px" }}>💬 카카오 알림톡</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                    {[
                      { value: "register", label: "접수확인" },
                      { value: "consult_reserve", label: "상담예약" },
                      { value: "docs_request", label: "서류요청" },
                      { value: "fund_apply", label: "자금신청" },
                      { value: "approved", label: "승인완료" },
                      { value: "rejected", label: "미승인" },
                      { value: "remind", label: "리마인드" },
                      { value: "consult_done", label: "상담종결" },
                      { value: "extra_apply", label: "추가신청" },
                      { value: "new_fund", label: "신규자금" },
                      { value: "review", label: "후기요청" },
                    ].map(t => (
                      <button key={t.value} onClick={() => setUserAlimTemplate(t.value)}
                        style={{ padding: "5px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer",
                          border: `2px solid ${userAlimTemplate === t.value ? "#F59E0B" : "#334155"}`,
                          backgroundColor: userAlimTemplate === t.value ? "rgba(245,158,11,0.15)" : "#0F172A",
                          color: userAlimTemplate === t.value ? "#F59E0B" : "#64748B" }}>{t.label}</button>
                    ))}
                  </div>
                  <button onClick={sendUserAlimtalk} disabled={userAlimSending}
                    style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700",
                      cursor: userAlimSending ? "not-allowed" : "pointer",
                      backgroundColor: userAlimSent ? "#16A34A" : userAlimSending ? "#334155" : "#B45309", color: "#FFF" }}>
                    {userAlimSent ? "✓ 알림톡 발송완료!" : userAlimSending ? "⏳ 전송 중..." : `💬 ${userAlimTemplate} 알림톡 발송`}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}
        {/* Success Banner */}
        {successBanner && (
          <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 100, backgroundColor: "#052E1C", border: "2px solid #10B981", borderRadius: "12px", padding: "14px 20px", color: "#34D399", fontSize: "14px", fontWeight: "700", fontFamily: font, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: "320px" }}>
            {successBanner}
          </div>
        )}

        {/* Fail Modal */}
        {failModal?.visible && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
            <div style={{ backgroundColor: "#1E293B", borderRadius: "16px", padding: "28px", maxWidth: "400px", width: "100%", border: "2px solid #EF4444", fontFamily: font }}>
              <p style={{ fontSize: "18px", fontWeight: "800", color: "#EF4444", marginBottom: "16px" }}>❌ 알림톡 발송 실패</p>
              <div style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "14px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontSize: "13px", color: "#CBD5E1" }}>👤 고객명: <strong>{failModal.clientName}</strong></p>
                <p style={{ fontSize: "13px", color: "#CBD5E1" }}>📞 연락처: {failModal.phone}</p>
                <p style={{ fontSize: "13px", color: "#FCA5A5" }}>❌ 실패사유: {failModal.error}</p>
              </div>
              {failModal.registerLink && (
                <div style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "8px" }}>링크를 직접 복사해서 전달해주세요:</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <code style={{ fontSize: "11px", color: "#60A5FA", wordBreak: "break-all", flex: 1 }}>{failModal.registerLink}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(failModal.registerLink!); showSuccess("📋 링크 복사됨"); }}
                      style={{ padding: "6px 14px", backgroundColor: "#1E3A5F", color: "#60A5FA", border: "1px solid #3B82F6", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}>
                      📋 링크 복사
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleFailModalRetry}
                  disabled={failModalRetrying}
                  style={{ flex: 1, padding: "12px", backgroundColor: failModalRetrying ? "#334155" : "#2563EB", color: "#FFF", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: failModalRetrying ? "not-allowed" : "pointer" }}>
                  {failModalRetrying ? "⏳ 재발송 중..." : "🔄 재발송"}
                </button>
                <button
                  onClick={() => setFailModal(null)}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#334155", color: "#CBD5E1", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                  ✕ 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
              {/* Consult Detail Overlay */}
              {selectedConsult && showConsultDetail && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, overflowY: "auto", padding: "16px" }}>
                  <div style={{ maxWidth: "640px", margin: "0 auto", width: "100%" }}>
                    {/* Header */}
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <div>
                          <p style={{ fontSize: "10px", color: "#64748B" }}>{selectedConsult.id}</p>
                          <p style={{ fontSize: "16px", fontWeight: "900", color: "#F1F5F9" }}>📋 상담 상세 수정</p>
                        </div>
                        <button onClick={() => { setSelectedConsult(null); setShowConsultDetail(false); }}
                          style={{ width: "30px", height: "30px", backgroundColor: "#334155", border: "none", borderRadius: "50%", color: "#94A3B8", cursor: "pointer", fontSize: "16px" }}>×</button>
                      </div>

                      {/* 신청 내용 수정 */}
                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "8px" }}>👤 고객 정보 수정</p>
                      <div className="consult-detail-grid">
                        {([
                          ["이름", cName, setCName, "text"],
                          ["연락처", cPhone, setCPhone, "text"],
                          ["이메일", cEmail, setCEmail, "email"],
                          ["나이", cAge, setCAge, "text"],
                          ["성별", cGender, setCGender, "text"],
                          ["업종", cBizType, setCBizType, "text"],
                          ["업력", cBizPeriod, setCBizPeriod, "text"],
                          ["연매출(원)", cRevenue, setCRevenue, "number"],
                          ["NICE점수", cNice, setCNice, "number"],
                          ["KCB점수", cKcb, setCKcb, "number"],
                          ["희망금액", cDesiredAmount, setCDesiredAmount, "text"],
                        ] as [string, string, (v: string) => void, string][]).map(([label, val, setter, type]) => (
                          <div key={label} style={{ padding: "6px 8px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                            <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>{label}</p>
                            <input
                              type={type}
                              value={val}
                              onChange={e => setter(e.target.value)}
                              style={{ ...inp, width: "100%", fontSize: "12px", padding: "4px 8px" }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* 기대출 5종 입력 */}
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", marginBottom: "8px" }}>🏦 기대출 상세 (종류별)</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {([
                            ["1금융권", cDebtFirst, setCDebtFirst],
                            ["2금융권", cDebtSecond, setCDebtSecond],
                            ["카드론", cDebtCard, setCDebtCard],
                            ["캐피탈", cDebtCapital, setCDebtCapital],
                            ["정책자금", cDebtPolicy, setCDebtPolicy],
                          ] as [string, string, (v:string)=>void][]).map(([label, val, setter]) => (
                            <div key={label} style={{ padding: "6px 8px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                              <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>{label}</p>
                              <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder="0"
                                style={{ ...inp, width: "100%", fontSize: "12px", padding: "4px 8px" }} />
                            </div>
                          ))}
                          <div style={{ padding: "6px 8px", backgroundColor: "#1E3A5F", borderRadius: "8px", border: "1px solid #3B82F6" }}>
                            <p style={{ fontSize: "10px", color: "#93C5FD", marginBottom: "3px" }}>합계</p>
                            <p style={{ fontSize: "13px", fontWeight: "800", color: "#60A5FA" }}>
                              {[cDebtFirst,cDebtSecond,cDebtCard,cDebtCapital,cDebtPolicy].reduce((s,v)=>s+(Number(v)||0),0).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <p style={{ fontSize: "10px", color: "#64748B", marginBottom: "3px" }}>문의 내용</p>
                        <textarea value={cInquiry} onChange={e => setCInquiry(e.target.value)} rows={2}
                          style={{ ...inp, width: "100%", resize: "vertical", fontSize: "12px" }} />
                      </div>
                    </div>

                    {/* 기대출 상세 */}
                    {selectedConsult.debtDetail && Object.values(selectedConsult.debtDetail).some(v => v && v !== "0") && (
                      <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "10px" }}>🏦 기대출 상세</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {([
                            ["1금융권", selectedConsult.debtDetail.first],
                            ["2금융권", selectedConsult.debtDetail.second],
                            ["카드론", selectedConsult.debtDetail.cardLoan],
                            ["캐피탈", selectedConsult.debtDetail.capital],
                            ["정책자금", selectedConsult.debtDetail.policy],
                          ] as [string, string][]).map(([k, v]) => (
                            <div key={k} style={{ padding: "8px 10px", backgroundColor: "#0F172A", borderRadius: "8px" }}>
                              <p style={{ fontSize: "10px", color: "#64748B" }}>{k}</p>
                              <p style={{ fontSize: "13px", fontWeight: "700", color: v && v !== "0" ? "#F1F5F9" : "#334155", marginTop: "2px" }}>
                                {v && v !== "0" ? `${Number(v).toLocaleString()}원` : "-"}
                              </p>
                            </div>
                          ))}
                          <div style={{ padding: "8px 10px", backgroundColor: "#1E3A5F", borderRadius: "8px", border: "1px solid #3B82F6" }}>
                            <p style={{ fontSize: "10px", color: "#93C5FD" }}>합계</p>
                            <p style={{ fontSize: "13px", fontWeight: "800", color: "#60A5FA", marginTop: "2px" }}>
                              {[
                                selectedConsult.debtDetail.first,
                                selectedConsult.debtDetail.second,
                                selectedConsult.debtDetail.cardLoan,
                                selectedConsult.debtDetail.capital,
                                selectedConsult.debtDetail.policy,
                              ].reduce((s, v) => s + (Number(v)||0), 0).toLocaleString()}원
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 상담 관리 */}
                    <div style={{ backgroundColor: "#1E293B", borderRadius: "12px", border: "1px solid #334155", padding: "14px 16px", marginBottom: "10px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#F1F5F9", marginBottom: "10px" }}>📊 상담 상태 관리</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                        {CONSULT_STATUS_LIST.map(s => {
                          const sc = CONSULT_STATUS_COLORS[s];
                          const isActive = cNewStatus === s;
                          return (
                            <button key={s} onClick={() => setCNewStatus(s)}
                              style={{ padding: "5px 9px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", cursor: "pointer", border: `2px solid ${isActive ? sc.border : "#334155"}`, backgroundColor: isActive ? sc.darkBg : "#0F172A", color: isActive ? sc.darkText : "#64748B" }}>
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>담당 매니저</label>
                          <input value={cAssigned} onChange={e => setCAssigned(e.target.value)} placeholder="담당자 이름"
                            style={{ ...inp, width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>상담 예약일시</label>
                          <input value={cDate} onChange={e => setCDate(e.target.value)} placeholder="예: 2026-04-20 14:00"
                            style={{ ...inp, width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>관리자 메모</label>
                          <textarea value={cMemo} onChange={e => setCMemo(e.target.value)} rows={3}
                            placeholder="내부 메모..." style={{ ...inp, width: "100%", resize: "vertical", lineHeight: "1.7" }} />
                        </div>
                      </div>
                      {/* 회원가입 링크 발송 */}
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <button onClick={() => { setShowConvertForm(p=>!p); setConvertPassword(""); }}
                          style={{ flex: 1, padding: "11px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", backgroundColor: convertDone ? "#16A34A" : "#7C3AED", color: "#FFF" }}>
                          {convertDone ? "✓ 회원 전환 완료!" : "👤 회원으로 전환"}
                        </button>
                        <button onClick={sendRegisterLink} disabled={registerLinkSending}
                          style={{ flex: 1, padding: "11px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: registerLinkSending ? "not-allowed" : "pointer", backgroundColor: registerLinkSent ? "#16A34A" : registerLinkSending ? "#334155" : "#0369A1", color: "#FFF" }}>
                          {registerLinkSent ? "✅ 링크 발송완료" : registerLinkSending ? "⏳ 발송중..." : "📲 회원가입 링크 발송"}
                        </button>
                      </div>
                      {/* 직접 비번 입력 폼 */}
                      {showConvertForm && (
                        <div style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px", marginBottom: "8px", border: "1px solid #7C3AED" }}>
                          <p style={{ fontSize: "12px", color: "#A78BFA", marginBottom: "8px", fontWeight: "700" }}>🔐 직접 비밀번호 설정</p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <input
                              value={convertPassword}
                              onChange={e => setConvertPassword(e.target.value)}
                              placeholder="비밀번호 입력 (6자 이상)"
                              style={{ flex: 1, padding: "9px 12px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", fontSize: "13px", color: "#F1F5F9", outline: "none" }}
                            />
                            <button onClick={async () => {
                              if (convertPassword.length < 6) { alert("비밀번호는 6자 이상이어야 합니다"); return; }
                              // confirm 없이 직접 저장
                              const dbRes = await fetch("/api/db?key=clientUsers").then(r=>r.json()).catch(()=>({value:[]}));
                              const cu: Array<{id:string;name:string;phone:string;email?:string;password:string;createdAt:string}> = dbRes.value || [];
                              const exists = cu.find(u => u.name === selectedConsult?.name && u.phone === selectedConsult?.phone);
                              let updated;
                              if (exists) {
                                updated = cu.map(u => u.name === selectedConsult?.name && u.phone === selectedConsult?.phone ? {...u, password: convertPassword} : u);
                              } else {
                                updated = [...cu, { id: Date.now().toString(), name: selectedConsult!.name, phone: selectedConsult!.phone, email: selectedConsult!.email || "", password: convertPassword, createdAt: new Date().toISOString() }];
                              }
                              await fetch("/api/db", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({key:"clientUsers", value:updated}) });
                              setShowConvertForm(false);
                              setSelectedConsult(null);
                              setShowConsultDetail(false);
                              setTab("members");
                              showSuccess("✅ 회원 개설 + 비밀번호 설정 완료");
                            }} style={{ padding: "9px 16px", backgroundColor: "#7C3AED", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                              ✅ 개설
                            </button>
                          </div>
                        </div>
                      )}
                      {registerLinkToken && (
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <code style={{ fontSize: "11px", color: "#60A5FA", flex: 1, wordBreak: "break-all" }}>{`https://emfrontier.team/register?token=${registerLinkToken}`}</code>
                          <button onClick={() => { navigator.clipboard.writeText(`https://emfrontier.team/register?token=${registerLinkToken}`); showSuccess("📋 링크 복사됨"); }}
                            style={{ padding: "5px 12px", backgroundColor: "#1E3A5F", color: "#60A5FA", border: "1px solid #3B82F6", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                            📋 복사
                          </button>
                        </div>
                      )}

                      {/* 서류 제출 링크 발송 */}
                      {/* 서류 체크리스트 */}
                      <div style={{ backgroundColor: "#0F172A", borderRadius: "10px", padding: "12px", marginBottom: "8px", border: "1px solid #0F766E" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showDocChecklist ? "12px" : "0" }}>
                          <p style={{ fontSize: "12px", fontWeight: "700", color: "#34D399", margin: 0 }}>📎 서류 체크리스트 {selectedDocs.length > 0 && <span style={{ backgroundColor: "#065F46", color: "#34D399", padding: "1px 7px", borderRadius: "999px", fontSize: "11px", marginLeft: "6px" }}>{selectedDocs.length}선택</span>}</p>
                          <button onClick={() => setShowDocChecklist(p=>!p)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "12px" }}>{showDocChecklist ? "▲ 접기" : "▼ 펼치기"}</button>
                        </div>
                        {showDocChecklist && (
                          <>
                            {[
                              { section: "[필수]", items: ["사업자등록증","사업자등록증명","신분증 사본","재무제표","부가세 자료","통장내역","거래처 계약서/발주서","4대보험 가입자 명부","국세 완납증명서","지방세 완납증명서"] },
                              { section: "[재무]", items: ["매출증빙","세금신고서","대출내역서(개인,사업자)","KCB/NICE 점수"] },
                              { section: "[사업]", items: ["사업계획서","자금사용계획"] },
                              { section: "[추가]", items: ["공동인증서(개인/범용)","계약서"] },
                            ].map(group => (
                              <div key={group.section} style={{ marginBottom: "10px" }}>
                                <p style={{ fontSize: "11px", fontWeight: "700", color: "#F59E0B", marginBottom: "6px" }}>{group.section}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                  {group.items.map(item => {
                                    const checked = selectedDocs.includes(item);
                                    return (
                                      <button key={item} onClick={() => setSelectedDocs(p => checked ? p.filter(d=>d!==item) : [...p, item])}
                                        style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer",
                                          border: `1px solid ${checked ? "#34D399" : "#334155"}`,
                                          backgroundColor: checked ? "#052E1C" : "#1E293B",
                                          color: checked ? "#34D399" : "#64748B" }}>
                                        {checked ? "✓ " : ""}{item}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                              <button onClick={() => setSelectedDocs(["사업자등록증","사업자등록증명","신분증 사본","재무제표","부가세 자료","통장내역","거래처 계약서/발주서","4대보험 가입자 명부","국세 완납증명서","지방세 완납증명서"])}
                                style={{ flex:1, padding:"6px", backgroundColor:"#1E3A5F", color:"#60A5FA", border:"1px solid #3B82F6", borderRadius:"6px", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>
                                필수 전체선택
                              </button>
                              <button onClick={() => setSelectedDocs([])}
                                style={{ padding:"6px 12px", backgroundColor:"#1E293B", color:"#94A3B8", border:"1px solid #334155", borderRadius:"6px", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>
                                초기화
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => sendUploadLink(selectedDocs)} disabled={uploadLinkSending}
                        style={{ width: "100%", padding: "11px", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: uploadLinkSending ? "not-allowed" : "pointer", backgroundColor: uploadLinkSent ? "#16A34A" : uploadLinkSending ? "#334155" : "#0F766E", color: "#FFF", marginBottom: "8px" }}>
                        {uploadLinkSent ? "✅ 서류 링크 발송완료" : uploadLinkSending ? "⏳ 발송중..." : `📎 서류 제출 링크 발송${selectedDocs.length > 0 ? ` (${selectedDocs.length}개 서류)` : ""}`}
                      </button>
                      {uploadLinkToken && (
                        <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <code style={{ fontSize: "11px", color: "#34D399", flex: 1, wordBreak: "break-all" }}>{`https://emfrontier.team/upload?token=${uploadLinkToken}`}</code>
                          <button onClick={() => { navigator.clipboard.writeText(`https://emfrontier.team/upload?token=${uploadLinkToken}`); showSuccess("📋 링크 복사됨"); }}
                            style={{ padding: "5px 12px", backgroundColor: "#052E1C", color: "#34D399", border: "1px solid #10B981", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                            📋 복사
                          </button>
                        </div>
                      )}

                      <button onClick={saveConsult}
                        style={{ width: "100%", padding: "11px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", backgroundColor: cSaved ? "#16A34A" : "#2563EB", color: "#FFF", marginBottom: "8px" }}>
                        {cSaved ? "✓ 저장됨" : "💾 전체 저장"}
                      </button>

                      {/* SOHO 등급 재측정 결과 */}
                      {gradeResult && (
                        <div style={{ backgroundColor: "#0F172A", border: `2px solid ${gradeResult.grade === "A" ? "#16A34A" : gradeResult.grade === "B" ? "#3B82F6" : gradeResult.grade === "C" ? "#D97706" : "#EF4444"}`, borderRadius: "12px", padding: "16px", marginBottom: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <p style={{ fontSize: "13px", fontWeight: "800", color: "#F1F5F9" }}>📊 SOHO 등급 재측정 결과</p>
                            <button onClick={() => setGradeResult(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "16px" }}>×</button>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
                            <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: `${gradeResult.grade === "A" ? "#16A34A" : gradeResult.grade === "B" ? "#3B82F6" : gradeResult.grade === "C" ? "#D97706" : "#EF4444"}20`, border: `2px solid ${gradeResult.grade === "A" ? "#16A34A" : gradeResult.grade === "B" ? "#3B82F6" : gradeResult.grade === "C" ? "#D97706" : "#EF4444"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: "24px", fontWeight: "900", color: gradeResult.grade === "A" ? "#16A34A" : gradeResult.grade === "B" ? "#3B82F6" : gradeResult.grade === "C" ? "#D97706" : "#EF4444" }}>{gradeResult.grade}</span>
                            </div>
                            <div>
                              <p style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "2px" }}>SOHO 등급</p>
                              <p style={{ fontSize: "18px", fontWeight: "900", color: gradeResult.grade === "A" ? "#16A34A" : gradeResult.grade === "B" ? "#3B82F6" : gradeResult.grade === "C" ? "#D97706" : "#EF4444" }}>{gradeResult.grade === "A" ? "최우수" : gradeResult.grade === "B" ? "우량" : gradeResult.grade === "C" ? "보통" : "주의"}</p>
                              <p style={{ fontSize: "12px", color: "#64748B" }}>점수: {gradeResult.score}pt</p>
                            </div>
                          </div>
                          <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "8px" }}>🏦 가능한 정책자금 ({gradeResult.funds.length}건)</p>
                          {gradeResult.funds.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#EF4444" }}>현재 조건에 맞는 자금이 없습니다.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {gradeResult.funds.map(f => (
                                <div key={f.id} style={{ backgroundColor: "#1E293B", borderRadius: "8px", padding: "10px 12px", border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#F1F5F9", marginBottom: "2px" }}>{f.name}</p>
                                    <p style={{ fontSize: "11px", color: "#94A3B8" }}>최대 {Number(f.maxAmount).toLocaleString()}원 · {f.interestRate}</p>
                                  </div>
                                  <span style={{ fontSize: "10px", backgroundColor: "#1E3A5F", color: "#60A5FA", padding: "3px 8px", borderRadius: "999px", fontWeight: "700", flexShrink: 0 }}>{f.category}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 📊 자금 현황 */}
                      <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "12px", padding: "14px", marginBottom: "8px" }}>
                        <p style={{ fontSize: "13px", fontWeight: "800", color: "#60A5FA", marginBottom: "12px" }}>📊 자금 현황</p>

                        {/* 자금 추가 폼 - 직접 입력 */}
                        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                          <input
                            value={newFundName}
                            onChange={e => setNewFundName(e.target.value)}
                            placeholder="자금명 직접 입력 (예: 소진공 일반경영안정자금)"
                            style={{ ...inp, flex: 2, minWidth: "160px", fontSize: "12px" }}
                          />
                          <input
                            value={newFundAmount}
                            onChange={e => setNewFundAmount(e.target.value)}
                            placeholder="승인금액 (예: 5,000만원)"
                            style={{ ...inp, flex: 1, minWidth: "100px", fontSize: "12px" }}
                          />
                          <button
                            onClick={handleFundAdd}
                            disabled={!newFundName.trim()}
                            style={{ padding: "9px 14px", backgroundColor: newFundName.trim() ? "#2563EB" : "#334155", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: newFundName.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                            + 자금 추가
                          </button>
                        </div>

                        {/* 자금 목록 */}
                        {(!selectedConsult.funds || selectedConsult.funds.length === 0) ? (
                          <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "12px 0" }}>등록된 자금이 없습니다</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {selectedConsult.funds.map(fund => {
                              const statusColor = FUND_STATUS_COLORS[fund.status] || "#94A3B8";
                              return (
                                <div key={fund.id} style={{ backgroundColor: "#1E293B", borderRadius: "10px", border: `1px solid ${statusColor}40`, padding: "12px" }}>
                                  {/* 자금명 + 삭제 */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div>
                                      <p style={{ fontSize: "13px", fontWeight: "800", color: "#F1F5F9" }}>{fund.fundName}</p>
                                      {fund.amount && <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>💰 {fund.amount}만원</p>}
                                    </div>
                                    <button
                                      onClick={() => handleFundDelete(fund.id)}
                                      style={{ padding: "4px 10px", backgroundColor: "#450A0A", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", fontSize: "12px", cursor: "pointer", flexShrink: 0 }}>
                                      🗑️
                                    </button>
                                  </div>
                                  {/* 상태 버튼 8개 — 클릭 시 임시 선택만, 저장 버튼으로 확정 */}
                                  <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
                                    {FUND_STATUS_LIST.map(st => {
                                      const isPending = (pendingFundStatus[fund.id] ?? fund.status) === st;
                                      const isCurrentSaved = fund.status === st;
                                      const col = FUND_STATUS_COLORS[st] || "#94A3B8";
                                      return (
                                        <button
                                          key={st}
                                          onClick={() => {
                                            setPendingFundStatus(prev => ({ ...prev, [fund.id]: st }));
                                          }}
                                          style={{
                                            padding: "5px 9px",
                                            fontSize: "11px",
                                            fontWeight: "700",
                                            borderRadius: "6px",
                                            border: isPending ? `2px solid ${col}` : "1px solid #334155",
                                            backgroundColor: isPending ? `${col}25` : "#0F172A",
                                            color: isPending ? col : "#64748B",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                            opacity: isCurrentSaved && !isPending ? 0.5 : 1,
                                          }}>
                                          {st}
                                          {isCurrentSaved && <span style={{ marginLeft: "3px", fontSize: "9px" }}>✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {/* 저장 버튼 — 선택된 상태가 현재 저장된 상태와 다를 때만 표시 */}
                                  {pendingFundStatus[fund.id] && pendingFundStatus[fund.id] !== fund.status && (
                                    <button
                                      onClick={() => {
                                        const newSt = pendingFundStatus[fund.id];
                                        handleFundStatus(fund.id, newSt as import("@/lib/store").FundStatus, true);
                                        setPendingFundStatus(prev => { const n = { ...prev }; delete n[fund.id]; return n; });
                                      }}
                                      style={{
                                        marginTop: "8px",
                                        width: "100%",
                                        padding: "8px 0",
                                        backgroundColor: "#3B82F6",
                                        color: "#FFF",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                      }}>
                                      💾 저장 및 알림톡 발송 → {pendingFundStatus[fund.id]}
                                    </button>
                                  )}
                                  <p style={{ fontSize: "10px", color: "#475569", marginTop: "6px" }}>마지막 업데이트: {fund.updatedAt}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* ✅ 접수완료 버튼 (접수대기 상태일 때만) */}
                      {selectedConsult.status === "접수대기" && (
                        <button
                          disabled={assigningId === selectedConsult.id}
                          onClick={() => handleAssign(selectedConsult)}
                          style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "800", cursor: assigningId === selectedConsult.id ? "not-allowed" : "pointer", backgroundColor: assigningId === selectedConsult.id ? "#334155" : "#10B981", color: "#FFF", marginBottom: "8px" }}>
                          {assigningId === selectedConsult.id ? "⏳ 처리중..." : "✅ 예약완료"}
                        </button>
                      )}

                      {/* ↩️ 접수취소 버튼 (접수대기 아닐 때 + 담당자 본인 또는 슈퍼어드민) */}
                      {selectedConsult.status !== "접수대기" &&
                        (selectedConsult.assignedTo === admin?.username || admin?.role === "superadmin") && (
                        <button
                          onClick={() => handleUnassign(selectedConsult)}
                          style={{ width: "100%", padding: "12px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", backgroundColor: "#EF4444", color: "#FFF", marginBottom: "8px" }}>
                          ↩️ 접수취소
                        </button>
                      )}

                      {/* 알림톡 발송실패 재발송 */}
                      {selectedConsult.alimtalkStatus === "failed" && (
                        <div style={{ backgroundColor: "#450A0A", border: "1px solid #EF4444", borderRadius: "10px", padding: "10px 14px", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#FCA5A5" }}>❌ 알림톡 발송실패</span>
                          <button
                            onClick={() => handleResendAlimtalk(selectedConsult)}
                            style={{ padding: "6px 14px", backgroundColor: "#F59E0B", color: "#FFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", flexShrink: 0 }}>
                            🔄 재발송
                          </button>
                        </div>
                      )}

                      {/* 알림톡 성공 표시 */}
                      {selectedConsult.alimtalkStatus === "sent" && (
                        <div style={{ backgroundColor: "#052E1C", border: "1px solid #10B981", borderRadius: "10px", padding: "8px 14px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#34D399" }}>✅ 알림톡 발송완료 {selectedConsult.alimtalkSentAt ? new Date(selectedConsult.alimtalkSentAt).toLocaleString("ko-KR").slice(0, 16) : ""}</span>
                        </div>
                      )}

                      {/* 확시 배정이력 토글 (superadmin 전용) */}
                      {admin?.role === "superadmin" && selectedConsult.assignedAt && (
                        <div style={{ marginBottom: "8px" }}>
                          <button
                            onClick={() => setShowHistory(h => !h)}
                            style={{ width: "100%", padding: "8px", backgroundColor: "#1E293B", border: "1px solid #334155", borderRadius: "8px", color: "#94A3B8", fontSize: "12px", fontWeight: "600", cursor: "pointer", textAlign: "left" }}>
                            📋 배정 이력 보기 {showHistory ? "▲" : "▼"}
                          </button>
                          {showHistory && (
                            <div style={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", padding: "12px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <p style={{ fontSize: "12px", color: "#94A3B8" }}>👤 담당자: {selectedConsult.assignedName || "-"} (@{selectedConsult.assignedTo || "-"})</p>
                              <p style={{ fontSize: "12px", color: "#94A3B8" }}>📅 배정일시: {selectedConsult.assignedAt ? new Date(selectedConsult.assignedAt).toLocaleString("ko-KR") : "-"}</p>
                              <p style={{ fontSize: "12px", color: "#94A3B8" }}>📝 배정로그: {selectedConsult.assignLog || "-"}</p>
                              <p style={{ fontSize: "12px", color: "#94A3B8" }}>
                                📱 알림톡: {selectedConsult.alimtalkStatus === "sent" ? "✅ 발송성공" : selectedConsult.alimtalkStatus === "failed" ? "❌ 발송실패" : "—"}
                                {selectedConsult.alimtalkSentAt && ` / ${new Date(selectedConsult.alimtalkSentAt).toLocaleString("ko-KR").slice(0, 16)}`}
                              </p>
                              {selectedConsult.alimtalkError && (
                                <p style={{ fontSize: "11px", color: "#EF4444" }}>오류: {selectedConsult.alimtalkError}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={sendStatusEmail} disabled={emailSending}
                        style={{ width: "100%", padding: "11px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: emailSending ? "not-allowed" : "pointer", backgroundColor: emailSent ? "#16A34A" : emailSending ? "#334155" : "#0F766E", color: "#FFF", marginTop: "8px" }}>
                        {emailSent ? "✓ 이메일 발송완료!" : emailSending ? "📧 전송 중..." : `📧 이메일 발송 (${emailTemplate || cNewStatus})`}
                      </button>
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#60A5FA", marginBottom: "6px" }}>📧 이메일 템플릿</p>
                        <select
                          value={emailTemplate}
                          onChange={e => {
                            setEmailTemplate(e.target.value);
                            if (e.target.value && selectedConsult) {
                              setEmailText(buildAlimText(e.target.value, selectedConsult));
                            } else {
                              setEmailText("");
                            }
                          }}
                          style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #60A5FA", fontSize: "13px", fontFamily: "inherit", backgroundColor: "#1E2D47", color: "#E2E8F0", marginBottom: "8px" }}
                        >
                          {EMAIL_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <textarea
                          value={emailText}
                          onChange={e => setEmailText(e.target.value)}
                          placeholder="추가 메모 또는 특이사항 (선택적)"
                          rows={3}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", fontSize: "13px", fontFamily: "inherit", resize: "vertical", backgroundColor: "#1E2D47", color: "#E2E8F0" }}
                        />
                      </div>
                      <div style={{ marginTop: "12px" }}>
                        <p style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B", marginBottom: "6px" }}>💬 알림톡 발송</p>
                        {/* 템플릿 선택 */}
                        <select
                          value={alimTemplate}
                          onChange={e => {
                            setAlimTemplate(e.target.value);
                            if (e.target.value && selectedConsult) {
                              setAlimText(buildAlimText(e.target.value, selectedConsult));
                            } else {
                              setAlimText("");
                            }
                          }}
                          style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #F59E0B", fontSize: "13px", fontFamily: "inherit", backgroundColor: "#1E2D47", color: "#E2E8F0", marginBottom: "8px" }}
                        >
                          {ALIM_TEMPLATES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        {/* 직접 작성 (선택적) */}
                        <textarea
                          value={alimText}
                          onChange={e => setAlimText(e.target.value)}
                          placeholder="템플릿 선택 시 내용이 자동 입력됩니다.\n직접 수정하거나 새로 작성할 수 있어요."
                          rows={7}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", fontSize: "13px", fontFamily: "inherit", resize: "vertical", backgroundColor: "#1E2D47", color: "#E2E8F0" }}
                        />
                      </div>
                      <button onClick={sendAlimtalk} disabled={alimSending}
                        style={{ width: "100%", padding: "11px", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: alimSending ? "not-allowed" : "pointer", backgroundColor: alimSent ? "#16A34A" : alimSending ? "#334155" : "#F59E0B", color: "#FFF", marginTop: "8px" }}>
                        {alimSent ? "✓ 알림톡 발송완료!" : alimSending ? "💬 전송 중..." : `💬 현재 상태로 알림톡 발송 (${cNewStatus})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}

        {deleteConfirm && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}>
            <div style={{ backgroundColor: "#1E293B", borderRadius: "14px", padding: "28px", maxWidth: "340px", width: "100%", border: "1px solid #334155" }}>
              <p style={{ fontSize: "20px", textAlign: "center", marginBottom: "10px" }}>⚠️</p>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#F1F5F9", textAlign: "center", marginBottom: "6px" }}>회원을 삭제하시겠습니까?</p>
              <p style={{ fontSize: "13px", color: "#94A3B8", textAlign: "center", marginBottom: "22px" }}>
                {users.find(u => u.id === deleteConfirm)?.name}<br />삭제 후 복구할 수 없습니다.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "11px", backgroundColor: "#334155", color: "#CBD5E1", fontSize: "13px", fontWeight: "600", border: "none", borderRadius: "8px", cursor: "pointer" }}>취소</button>
                <button onClick={() => handleDeleteUser(deleteConfirm)} style={{ flex: 1, padding: "11px", backgroundColor: "#DC2626", color: "#FFF", fontSize: "13px", fontWeight: "700", border: "none", borderRadius: "8px", cursor: "pointer" }}>삭제</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
