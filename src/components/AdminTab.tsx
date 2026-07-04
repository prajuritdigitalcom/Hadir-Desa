import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Settings, 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  Megaphone, 
  ShieldCheck, 
  Smartphone,
  CheckCircle,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Eye,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";
import { Employee, SystemSettings, Holiday, Announcement, AuditLog, DeviceSession } from "../types";

export default function AdminTab() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Navigation inside Admin Panel
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "employees" | "work_hours" | "location" | "holidays" | "announcements" | "device_locks" | "correction" | "audit"
  >("dashboard");

  // Admin Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);

  // Form State
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form Temp Inputs - Employee
  const [empName, setEmpName] = useState("");
  const [empPos, setEmpPos] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empPhoto, setEmpPhoto] = useState("");
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // Form Temp Inputs - Holiday
  const [holDate, setHolDate] = useState("");
  const [holName, setHolName] = useState("");
  const [holType, setHolType] = useState<"nasional" | "cuti_bersama" | "desa">("nasional");

  // Form Temp Inputs - Announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // Form Temp Inputs - Location Settings
  const [locLat, setLocLat] = useState(-7.161048);
  const [locLng, setLocLng] = useState(111.725902);
  const [locRad, setLocRad] = useState(50);

  // Form Temp Inputs - Work Hours
  const [whInStart, setWhInStart] = useState("06:00");
  const [whInEnd, setWhInEnd] = useState("08:00");
  const [whOutMin, setWhOutMin] = useState("12:00");
  const [whOutMax, setWhOutMax] = useState("20:00");
  const [whToler, setWhToler] = useState(15);
  const [whPass, setWhPass] = useState("");

  // Form Temp Inputs - Correction
  const [corEmpId, setCorEmpId] = useState("");
  const [corDate, setCorDate] = useState("");
  const [corIn, setCorIn] = useState("07:00");
  const [corOut, setCorOut] = useState("15:00");
  const [corStatus, setCorStatus] = useState<"Hadir" | "Cuti" | "Tugas Luar">("Hadir");
  const [corReason, setCorReason] = useState("");

  // Session Token
  const [token, setToken] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("hadirdesa_admin_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAdminLoggedIn(true);
      setAdminEmail(localStorage.getItem("hadirdesa_admin_email") || "admin@desa.go.id");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput || "admin@desa.go.id", password: passwordInput })
      });
      
      let data: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (res.ok) {
        localStorage.setItem("hadirdesa_admin_token", data.token);
        localStorage.setItem("hadirdesa_admin_email", data.email);
        setToken(data.token);
        setAdminEmail(data.email);
        setIsAdminLoggedIn(true);
        setPasswordInput("");
      } else {
        setLoginError(data.error || "Password Admin salah.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Clean up verbose HTML error response if any
      const errMsg = err?.message || String(err);
      if (errMsg.includes("<!DOCTYPE") || errMsg.includes("<html")) {
        setLoginError("Koneksi gagal atau server bermasalah (Response non-JSON/500/504). Pastikan server/database terhubung.");
      } else {
        setLoginError(`Koneksi gagal: ${errMsg}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hadirdesa_admin_token");
    localStorage.removeItem("hadirdesa_admin_email");
    setToken("");
    setIsAdminLoggedIn(false);
  };

  const handleResetPassword = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengembalikan kata sandi admin ke default ('admindesa')?")) {
      return;
    }
    setIsResetting(true);
    setResetMessage("");
    setLoginError("");
    try {
      const res = await fetch("/api/admin/reset-password-default", {
        method: "POST"
      });
      
      let data: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
      }

      if (res.ok) {
        setResetMessage(data.message || "Kata sandi berhasil direset!");
        setPasswordInput("admindesa"); // prefill for easy access!
      } else {
        setLoginError(data.error || "Gagal mereset kata sandi.");
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes("<!DOCTYPE") || errMsg.includes("<html")) {
        setLoginError("Gagal menghubungi server: Server mengembalikan error non-JSON. Periksa log server Vercel.");
      } else {
        setLoginError(`Gagal menghubungi server untuk mereset kata sandi: ${errMsg}`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  // Fetch admin content
  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [empRes, setRes, holRes, annRes, sessRes, auditRes, todayRes] = await Promise.all([
        fetch("/api/admin/employees", { headers }),
        fetch("/api/admin/settings", { headers }),
        fetch("/api/admin/holidays", { headers }),
        fetch("/api/admin/announcements", { headers }),
        fetch("/api/admin/device_sessions", { headers }),
        fetch("/api/admin/audit_logs", { headers }),
        fetch("/api/public/attendance/today")
      ]);

      if (empRes.ok && setRes.ok && holRes.ok && annRes.ok && sessRes.ok && auditRes.ok && todayRes.ok) {
        const empData = await empRes.json();
        const setData = await setRes.json();
        const holData = await holRes.json();
        const annData = await annRes.json();
        const sessData = await sessRes.json();
        const auditData = await auditRes.json();
        const todayData = await todayRes.json();

        setEmployees(empData);
        setSettings(setData);
        setHolidays(holData);
        setAnnouncements(annData);
        setDeviceSessions(sessData);
        setAuditLogs(auditData);
        setTodayAttendance(todayData);

        // Prepopulate locations & work hours forms
        setLocLat(setData.office_latitude);
        setLocLng(setData.office_longitude);
        setLocRad(setData.radius_geofence);
        
        setWhInStart(setData.jam_masuk_mulai);
        setWhInEnd(setData.jam_masuk_normal_berakhir);
        setWhOutMin(setData.jam_pulang_minimal);
        setWhOutMax(setData.jam_pulang_maksimal);
        setWhToler(setData.toleransi_keterlambatan);
        setWhPass(setData.admin_password || "admindesa");
      } else if (empRes.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn && token) {
      loadAdminData();
    }
  }, [isAdminLoggedIn, token, activeSubTab]);

  const triggerAlert = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // CRUD - Employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({ name: empName, position: empPos, phone: empPhone, photo_url: empPhoto });

    try {
      let res;
      if (editingEmpId) {
        res = await fetch(`/api/admin/employees/${editingEmpId}`, { method: "PUT", headers, body });
      } else {
        res = await fetch("/api/admin/employees", { method: "POST", headers, body });
      }

      if (res.ok) {
        triggerAlert(editingEmpId ? "Perangkat desa berhasil diubah." : "Perangkat desa berhasil ditambahkan.");
        setEmpName("");
        setEmpPos("");
        setEmpPhone("");
        setEmpPhoto("");
        setEditingEmpId(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateEmployee = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menonaktifkan perangkat desa ini?")) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert("Perangkat desa berhasil dinonaktifkan.");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD - Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({ holiday_date: holDate, holiday_name: holName, holiday_type: holType });

    try {
      const res = await fetch("/api/admin/holidays", { method: "POST", headers, body });
      if (res.ok) {
        triggerAlert("Hari libur berhasil ditambahkan.");
        setHolDate("");
        setHolName("");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert("Hari libur berhasil dihapus.");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD - Announcements
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({ title: annTitle, content: annContent });

    try {
      let res;
      if (editingAnnId) {
        res = await fetch(`/api/admin/announcements/${editingAnnId}`, { method: "PUT", headers, body });
      } else {
        res = await fetch("/api/admin/announcements", { method: "POST", headers, body });
      }

      if (res.ok) {
        triggerAlert(editingAnnId ? "Pengumuman berhasil diubah." : "Pengumuman berhasil dibuat.");
        setAnnTitle("");
        setAnnContent("");
        setEditingAnnId(null);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        triggerAlert("Pengumuman berhasil dihapus.");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings - Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({
      office_latitude: parseFloat(locLat.toString()),
      office_longitude: parseFloat(locLng.toString()),
      radius_geofence: parseInt(locRad.toString())
    });

    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers, body });
      if (res.ok) {
        triggerAlert("Lokasi & Geofence berhasil disimpan.");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings - Work Hours & Pass
  const handleSaveWorkHours = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({
      jam_masuk_mulai: whInStart,
      jam_masuk_normal_berakhir: whInEnd,
      jam_pulang_minimal: whOutMin,
      jam_pulang_maksimal: whOutMax,
      toleransi_keterlambatan: parseInt(whToler.toString()),
      admin_password: whPass
    });

    try {
      const res = await fetch("/api/admin/settings", { method: "POST", headers, body });
      if (res.ok) {
        triggerAlert("Jam kerja & kata sandi admin diperbarui.");
        // If password is changed, update token to stay logged in
        localStorage.setItem("hadirdesa_admin_token", whPass);
        setToken(whPass);
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Session Locks
  const handleResetSession = async (employeeId?: string) => {
    try {
      const res = await fetch("/api/admin/device_sessions/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        triggerAlert(employeeId ? "Sesi perangkat dibersihkan." : "Semua sesi perangkat dibersihkan.");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Manual Correction
  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!corEmpId || !corDate) {
      alert("Pilih Perangkat Desa dan Tanggal terlebih dahulu.");
      return;
    }

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const body = JSON.stringify({
      employee_id: corEmpId,
      attendance_date: corDate,
      checkin_time: corStatus === "Hadir" ? corIn : "00:00",
      checkout_time: corStatus === "Hadir" ? corOut : "00:00",
      status: corStatus,
      reason: corReason
    });

    try {
      const res = await fetch("/api/admin/attendance/correct", { method: "POST", headers, body });
      if (res.ok) {
        triggerAlert("Koreksi absensi berhasil disimpan.");
        setCorReason("");
        setCorEmpId("");
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="space-y-6 pb-20 select-none">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A3981] p-2 shadow-md">
            <LockKeyhole className="h-7 w-7 text-amber-400" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-extrabold text-[#0A3981]">Login Admin Desa</h2>
          <p className="text-[11px] text-slate-500 font-medium">Autentikasi pengurus HadirDesa Ringintunggal.</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Akun</label>
              <input
                type="email"
                placeholder="Masukkan email akun admin..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi</label>
              <input
                type="password"
                placeholder="Masukkan password admin..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 rounded-xl p-3 whitespace-pre-wrap break-words text-left max-h-60 overflow-y-auto font-mono leading-relaxed">
                <div className="font-sans font-bold mb-1 uppercase tracking-wider text-[10px] text-rose-700">Detail Kesalahan (Error Details):</div>
                {loginError}
              </div>
            )}

            {resetMessage && (
              <p className="text-emerald-700 text-[11px] font-bold text-center bg-emerald-50 border border-emerald-150 rounded-xl p-3 leading-relaxed">
                {resetMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#0A3981] hover:bg-blue-800 text-white font-heading font-bold text-xs py-3.5 rounded-xl transition active:scale-95 uppercase tracking-wider shadow-sm"
            >
              Autentikasi Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-[#0A3981]">Dasbor Admin</h2>
          <p className="text-[11px] text-slate-500 font-medium">{adminEmail}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-bold text-xs"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Status alerts */}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center animate-bounce">
          {statusMsg}
        </div>
      )}

      {/* Admin Navigation Scroll Rail */}
      <div className="flex space-x-2 overflow-x-auto pb-1 -mx-4 px-4 mask-gradient scrollbar-thin">
        {[
          { label: "Ikhtisar", value: "dashboard", icon: ShieldCheck },
          { label: "Perangkat", value: "employees", icon: Users },
          { label: "Koreksi", value: "correction", icon: History },
          { label: "Jam Kerja", value: "work_hours", icon: Clock },
          { label: "Lokasi GPS", value: "location", icon: MapPin },
          { label: "Hari Libur", value: "holidays", icon: Calendar },
          { label: "Pengumuman", value: "announcements", icon: Megaphone },
          { label: "Sesi Perangkat", value: "device_locks", icon: Smartphone },
          { label: "Audit Log", value: "audit", icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveSubTab(tab.value as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold font-heading border transition shrink-0 ${
                activeSubTab === tab.value 
                  ? "bg-[#0A3981] border-[#0A3981] text-white shadow-sm" 
                  : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3981] border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Perangkat</span>
                  <span className="text-2xl font-bold font-heading text-slate-700">{employees.length}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Persentase Hadir</span>
                  <span className="text-2xl font-bold font-heading text-emerald-600">
                    {todayAttendance.length > 0 
                      ? Math.round((todayAttendance.filter(a => a.record.status === "Hadir" || a.record.status === "Sedang Bertugas").length / employees.length) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>

              {/* Status List for today */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <h4 className="font-heading text-xs font-bold text-slate-800">Status Kehadiran Hari Ini</h4>
                <div className="space-y-2">
                  {todayAttendance.map((item: any) => (
                    <div key={item.employee_id} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.record.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.record.status === 'Sedang Bertugas' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {item.record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. MANAGE EMPLOYEES */}
          {activeSubTab === "employees" && (
            <div className="space-y-4">
              {/* Form Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="font-heading text-xs font-bold text-slate-800">
                  {editingEmpId ? "Ubah Perangkat Desa" : "Tambah Perangkat Desa"}
                </h3>
                <form onSubmit={handleSaveEmployee} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama lengkap perangkat..."
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Jabatan (cth: Kaur Keuangan)..."
                    value={empPos}
                    onChange={(e) => setEmpPos(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nomor Telepon..."
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
                  />
                  <input
                    type="text"
                    placeholder="Link Foto Profil (opsional)..."
                    value={empPhoto}
                    onChange={(e) => setEmpPhoto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                    >
                      Simpan
                    </button>
                    {editingEmpId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingEmpId(null);
                          setEmpName("");
                          setEmpPos("");
                          setEmpPhone("");
                          setEmpPhoto("");
                        }}
                        className="bg-slate-100 text-slate-600 py-2.5 px-4 rounded-xl text-xs font-bold font-heading"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-2">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.photo_url}
                        alt={emp.name}
                        className="h-10 w-10 rounded-full object-cover border"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{emp.position}</p>
                        {!emp.active && (
                          <span className="text-[8px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded-full border border-rose-100">Nonaktif</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingEmpId(emp.id);
                          setEmpName(emp.name);
                          setEmpPos(emp.position);
                          setEmpPhone(emp.phone);
                          setEmpPhoto(emp.photo_url);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      {emp.active && (
                        <button
                          onClick={() => handleDeactivateEmployee(emp.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MANUAL KOREKSI */}
          {activeSubTab === "correction" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="font-heading text-xs font-bold text-slate-800">Koreksi Absensi Manual</h3>
                <form onSubmit={handleSaveCorrection} className="space-y-3">
                  <select
                    value={corEmpId}
                    onChange={(e) => setCorEmpId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Perangkat Desa --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={corDate}
                    onChange={(e) => setCorDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />

                  <select
                    value={corStatus}
                    onChange={(e) => setCorStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Tugas Luar">Tugas Luar</option>
                  </select>

                  {corStatus === "Hadir" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Jam Masuk</span>
                        <input
                          type="text"
                          placeholder="07:00"
                          value={corIn}
                          onChange={(e) => setCorIn(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Jam Pulang</span>
                        <input
                          type="text"
                          placeholder="15:30"
                          value={corOut}
                          onChange={(e) => setCorOut(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Alasan koreksi (cth: Lupa checkout)..."
                    value={corReason}
                    onChange={(e) => setCorReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                  >
                    Simpan Koreksi
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 4. WORK HOURS */}
          {activeSubTab === "work_hours" && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
              <h3 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Pengaturan Jam Kerja & Akun</h3>
              <form onSubmit={handleSaveWorkHours} className="space-y-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Mulai Jam Masuk</span>
                  <input
                    type="text"
                    value={whInStart}
                    onChange={(e) => setWhInStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Batas Jam Masuk Normal</span>
                  <input
                    type="text"
                    value={whInEnd}
                    onChange={(e) => setWhInEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Jam Pulang Minimal</span>
                    <input
                      type="text"
                      value={whOutMin}
                      onChange={(e) => setWhOutMin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Jam Pulang Maksimal</span>
                    <input
                      type="text"
                      value={whOutMax}
                      onChange={(e) => setWhOutMax(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Toleransi Keterlambatan (menit)</span>
                  <input
                    type="number"
                    value={whToler}
                    onChange={(e) => setWhToler(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Ubah Sandi Admin</span>
                  <input
                    type="text"
                    value={whPass}
                    onChange={(e) => setWhPass(e.target.value)}
                    className="w-full bg-slate-50 border border-[#0A3981] rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                >
                  Simpan Pengaturan Jam Kerja
                </button>
              </form>
            </div>
          )}

          {/* 5. LOCATION GEOFENCE */}
          {activeSubTab === "location" && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
              <h3 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Lokasi Kantor Desa (Balai Desa)</h3>
              <form onSubmit={handleSaveLocation} className="space-y-3">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Latitude Balai Desa</span>
                  <input
                    type="text"
                    value={locLat}
                    onChange={(e) => setLocLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Longitude Balai Desa</span>
                  <input
                    type="text"
                    value={locLng}
                    onChange={(e) => setLocLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase mb-1">Radius Geofence Aman (Meter)</span>
                  <input
                    type="number"
                    value={locRad}
                    onChange={(e) => setLocRad(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                >
                  Simpan Koordinat Kantor
                </button>
              </form>
            </div>
          )}

          {/* 6. HARI LIBUR */}
          {activeSubTab === "holidays" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="font-heading text-xs font-bold text-slate-800">Tambah Hari Libur / Cuti Bersama</h3>
                <form onSubmit={handleAddHoliday} className="space-y-3">
                  <input
                    type="date"
                    value={holDate}
                    onChange={(e) => setHolDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Nama hari libur (cth: Libur Desa Bersama)..."
                    value={holName}
                    onChange={(e) => setHolName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />
                  <select
                    value={holType}
                    onChange={(e) => setHolType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="nasional">Nasional</option>
                    <option value="cuti_bersama">Cuti Bersama</option>
                    <option value="desa">Libur Khusus Desa</option>
                  </select>

                  <button
                    type="submit"
                    className="w-full bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                  >
                    Tambah Hari Libur
                  </button>
                </form>
              </div>

              {/* Holiday list */}
              <div className="space-y-2">
                {holidays.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">{h.holiday_name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{h.holiday_date}</p>
                      <span className="text-[8px] uppercase tracking-wide bg-amber-50 text-amber-700 font-bold border px-2 py-0.5 rounded-full block mt-1.5 w-max">
                        {h.holiday_type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. ANNOUNCEMENTS */}
          {activeSubTab === "announcements" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="font-heading text-xs font-bold text-slate-800">
                  {editingAnnId ? "Ubah Pengumuman" : "Buat Pengumuman Baru"}
                </h3>
                <form onSubmit={handleSaveAnnouncement} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Judul pengumuman..."
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="Isi konten pengumuman..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                    required
                  />

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#0A3981] text-white py-2.5 rounded-xl text-xs font-bold font-heading uppercase"
                    >
                      Posting
                    </button>
                    {editingAnnId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnId(null);
                          setAnnTitle("");
                          setAnnContent("");
                        }}
                        className="bg-slate-100 text-slate-600 py-2.5 px-4 rounded-xl text-xs font-bold font-heading"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-2">
                {announcements.map(ann => (
                  <div key={ann.id} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            setEditingAnnId(ann.id);
                            setAnnTitle(ann.title);
                            setAnnContent(ann.content);
                          }}
                          className="p-1 text-blue-600 rounded-lg hover:bg-slate-50"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1 text-rose-600 rounded-lg hover:bg-slate-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      Posted: {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. DEVICE LOCKS */}
          {activeSubTab === "device_locks" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xs font-bold text-slate-800">Sesi Kunci Perangkat Aktif</h3>
                  <button
                    onClick={() => handleResetSession()}
                    className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-lg font-bold font-heading transition"
                  >
                    Reset Semua Kunci
                  </button>
                </div>

                {deviceSessions.length > 0 ? (
                  <div className="space-y-2">
                    {deviceSessions.map(sess => (
                      <div key={sess.id} className="bg-slate-50 border rounded-xl p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{sess.employee_name}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">Device ID: {sess.device_id}</p>
                          <span className="text-[8px] bg-red-100 text-red-700 font-mono px-1.5 py-0.5 rounded-full font-bold">LOCKED</span>
                        </div>
                        <button
                          onClick={() => handleResetSession(sess.employee_id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg font-bold font-heading bg-white text-[10px]"
                        >
                          Reset Sesi
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-6">
                    <Smartphone className="h-8 w-8 mx-auto text-slate-200 mb-1.5" />
                    <span>Tidak ada sesi perangkat yang sedang dikunci hari ini.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 9. AUDIT LOGS */}
          {activeSubTab === "audit" && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
              <h3 className="font-heading text-xs font-bold text-slate-800">Catatan Aktivitas Admin (Audit Logs)</h3>
              <div className="space-y-3 divide-y divide-slate-50 max-h-96 overflow-y-auto pr-1">
                {auditLogs.map(log => (
                  <div key={log.id} className="pt-2.5 text-[11px] leading-normal">
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-slate-700">{log.action}</span>
                      <span className="text-slate-400 text-[9px] font-mono font-medium">
                        {new Date(log.created_at).toLocaleTimeString("id-ID")}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] mt-0.5">Target: {log.target} | Admin: {log.admin_email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
