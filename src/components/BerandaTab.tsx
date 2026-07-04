import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  MapPin, 
  Megaphone,
  Briefcase
} from "lucide-react";
import { PublicStats, Announcement } from "../types";

interface TodayAttendanceItem {
  employee_id: string;
  name: string;
  position: string;
  photo_url: string;
  record: {
    id: string;
    employee_id: string;
    attendance_date: string;
    checkin_time: string;
    checkout_time: string | null;
    total_minutes: number;
    status: 'Hadir' | 'Sedang Bertugas' | 'Belum Hadir' | 'Checkout Terlewat' | 'Cuti' | 'Tugas Luar' | 'Libur';
    checkin_distance?: number;
    checkout_distance?: number | null;
  };
}

interface BerandaTabProps {
  onSelectEmployeeHistory: (empId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function BerandaTab({ onSelectEmployeeHistory, onNavigateToTab }: BerandaTabProps) {
  const [stats, setStats] = useState<PublicStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onDutyToday: 0,
    attendancePercentage: 0
  });
  const [attendance, setAttendance] = useState<TodayAttendanceItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateTime, setDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDay = dateTime.toLocaleDateString("id-ID", { weekday: "long" });
  const formattedDate = dateTime.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const formattedTime = dateTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const fetchData = async () => {
    try {
      const [statsRes, attRes, annRes] = await Promise.all([
        fetch("/api/public/stats"),
        fetch("/api/public/attendance/today"),
        fetch("/api/public/announcements")
      ]);

      if (statsRes.ok && attRes.ok && annRes.ok) {
        const statsData = await statsRes.json();
        const attData = await attRes.json();
        const annData = await annRes.json();

        setStats(statsData);
        setAttendance(attData);
        setAnnouncements(annData);
      }
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filter attendance by search query
  const filteredAttendance = attendance.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for status badge styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Hadir":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Sedang Bertugas":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "Belum Hadir":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Cuti":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Tugas Luar":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Checkout Terlewat":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Libur":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  // Helper for formatting duration
  const formatMinutes = (minutes: number) => {
    if (!minutes) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins} Menit`;
    return `${hrs} Jam ${mins} Menit`;
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-[#0A3981]" />
        <p className="mt-4 text-sm font-medium">Memuat data transparansi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Premium Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0A3981] via-[#0F4C9B] to-[#1D63B8] text-white p-6 shadow-md border border-blue-950/20">
        {/* Header Row: Live Time & Database Status */}
        <div className="flex items-center justify-between gap-2 mb-5 relative z-10">
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-[10px] font-bold font-mono tracking-wider text-amber-300 uppercase">
              {formattedDay}, {formattedDate} • {formattedTime} WIB
            </span>
          </div>

          {stats.supabaseConnected ? (
            <div className="flex items-center space-x-1.5 bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] font-extrabold font-mono tracking-widest text-emerald-300 uppercase">
                Supabase Connected
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-amber-500/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-[9px] font-extrabold font-mono tracking-widest text-amber-300 uppercase">
                Local Storage
              </span>
            </div>
          )}
        </div>

        {/* Brand identity & introduction */}
        <div className="space-y-2 relative z-10">
          <h2 className="font-heading text-xl font-black tracking-tight leading-tight pt-1">
            Sistem Transparansi Absensi
          </h2>
          <p className="text-[11px] text-blue-100/90 leading-relaxed font-medium">
            Portal data kehadiran terintegrasi perangkat desa secara real-time demi mewujudkan pelayanan yang andal, akuntabel, dan transparan.
          </p>
        </div>
      </div>

      {/* Attendance Circular Stats Row 1: Kehadiran Hari Ini */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Kehadiran Hari Ini</span>
          <div className="text-2xl font-bold font-heading text-[#0A3981]">
            {stats.attendancePercentage}%
          </div>
          <p className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">{stats.presentToday}</span> dari <span className="font-bold">{stats.totalEmployees}</span> perangkat hadir bertugas
          </p>
        </div>
        
        {/* Radial progress ring */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="26"
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              className="stroke-emerald-500 transition-all duration-500"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - stats.attendancePercentage / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs font-bold text-emerald-600 font-heading">{stats.attendancePercentage}%</span>
        </div>
      </div>

      {/* Attendance Stats Row 2: Bertugas, Belum Hadir, Terlewat */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-blue-50 p-1.5 text-blue-600 mb-1.5">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Bertugas</span>
          <span className="text-lg font-bold font-heading text-blue-700 mt-0.5">{stats.onDutyToday}</span>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-slate-50 p-1.5 text-slate-500 mb-1.5">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Belum Hadir</span>
          <span className="text-lg font-bold font-heading text-slate-600 mt-0.5">{stats.absentToday}</span>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-rose-50 p-1.5 text-rose-500 mb-1.5">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Terlewat</span>
          <span className="text-lg font-bold font-heading text-rose-600 mt-0.5">
            {attendance.filter(item => item.record.status === "Checkout Terlewat").length}
          </span>
        </div>
      </div>

      {/* Quick Action Button for Absen */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0A3981] to-blue-700 p-4 text-white shadow-md flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-heading text-sm font-bold">Lakukan Absensi Anda?</h3>
          <p className="text-[11px] text-slate-200">Gunakan GPS & pastikan berada di area Balai Desa.</p>
        </div>
        <button 
          onClick={() => onNavigateToTab("absen")}
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded-xl text-xs font-bold font-heading transition shadow-sm active:scale-95 shrink-0"
        >
          Absen Sekarang
        </button>
      </div>

      {/* Directory / Real-Time Status List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-[#0A3981]">Daftar Kehadiran Hari Ini</h3>
          <div className="flex items-center space-x-1.5">
            {stats.supabaseConnected && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold tracking-wider">
                SUPABASE
              </span>
            )}
            <span className="text-[9px] bg-[#0A3981]/10 text-[#0A3981] px-2 py-0.5 rounded-full font-mono font-bold">LIVE</span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau jabatan perangkat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-[#0A3981] focus:ring-1 focus:ring-[#0A3981]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {filteredAttendance.length > 0 ? (
            filteredAttendance.map(item => (
              <div 
                key={item.employee_id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition"
              >
                {/* Top: Identity & Status */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={item.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-100 bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-heading text-xs font-bold text-slate-800">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{item.position}</p>
                    </div>
                  </div>
                  
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(item.record.status)}`}>
                    {item.record.status}
                  </span>
                </div>

                {/* Bottom: Times & Distance */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight font-medium">Masuk</span>
                    <p className="text-xs font-mono font-bold text-slate-700">{item.record.checkin_time || "-"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight font-medium">Pulang</span>
                    <p className="text-xs font-mono font-bold text-slate-700">{item.record.checkout_time || "-"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight font-medium">Jam Kerja</span>
                    <p className="text-xs font-mono font-bold text-emerald-600">
                      {item.record.checkout_time ? formatMinutes(item.record.total_minutes) : "-"}
                    </p>
                  </div>
                </div>

                {/* Additional Info: GPS Distance if available */}
                {item.record.checkin_distance !== undefined && item.record.checkin_distance > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-[#0A3981]" />
                      <span>Absen dari {item.record.checkin_distance}m dari Balai Desa</span>
                    </span>
                    <button 
                      onClick={() => onSelectEmployeeHistory(item.employee_id)}
                      className="text-[#0A3981] font-bold tracking-tight hover:underline"
                    >
                      Lihat Histori
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Tidak ada perangkat desa yang cocok dengan pencarian Anda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
