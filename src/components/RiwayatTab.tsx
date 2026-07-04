import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  User, 
  Search, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Plane, 
  Clock, 
  CalendarRange,
  Download
} from "lucide-react";
import { Employee, Attendance } from "../types";

export default function RiwayatTab({ preselectedEmployeeId }: { preselectedEmployeeId?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [range, setRange] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load employees
  useEffect(() => {
    fetch("/api/public/employees")
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error(err));
  }, []);

  // Update selected employee from props if present
  useEffect(() => {
    if (preselectedEmployeeId) {
      setSelectedEmployeeId(preselectedEmployeeId);
      setRange("month");
    }
  }, [preselectedEmployeeId]);

  // Fetch history based on filters
  const fetchHistory = () => {
    setLoading(true);
    let url = `/api/public/attendance/history?range=${range}&employeeId=${selectedEmployeeId}`;
    if (range === "custom" && startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedEmployeeId, range, startDate, endDate]);

  // Calculations for Ringkasan Bulanan (or filter range summary)
  const getSummary = () => {
    const totalDays = history.length;
    const hadir = history.filter(h => h.status === "Hadir").length;
    const sedangBertugas = history.filter(h => h.status === "Sedang Bertugas").length;
    const cuti = history.filter(h => h.status === "Cuti").length;
    const tugasLuar = history.filter(h => h.status === "Tugas Luar").length;
    const libur = history.filter(h => h.status === "Libur").length;
    const tidakHadir = history.filter(h => h.status === "Belum Hadir" || h.status === "Checkout Terlewat").length;

    const totalMinutes = history.reduce((sum, h) => sum + (h.total_minutes || 0), 0);
    const avgMinutes = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;

    const formatHours = (minutes: number) => {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hrs}j ${mins}m`;
    };

    const attendanceRate = totalDays > 0 ? Math.round(((hadir + sedangBertugas + tugasLuar) / totalDays) * 100) : 0;

    return {
      totalDays,
      hadir: hadir + sedangBertugas,
      tidakHadir,
      cuti,
      tugasLuar,
      libur,
      totalHours: formatHours(totalMinutes),
      avgHours: formatHours(avgMinutes),
      attendanceRate
    };
  };

  const summary = getSummary();

  // Calendar render helper (for July 2026, as current system time is July 2026!)
  const renderCalendar = () => {
    if (selectedEmployeeId === "all") return null;

    const daysInMonth = 31; // July has 31 days
    const calendarDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `2026-07-${d.toString().padStart(2, "0")}`;
      
      // Look for attendance record on this day
      const record = history.find(h => h.attendance_date === dateStr);
      
      let symbol = "➖";
      let style = "text-slate-300 bg-slate-50 border-slate-100";
      let statusText = "Tidak Ada Data";

      if (record) {
        if (record.status === "Hadir" || record.status === "Sedang Bertugas") {
          symbol = "✅";
          style = "text-emerald-700 bg-emerald-50 border-emerald-200 font-bold";
          statusText = "Hadir";
        } else if (record.status === "Belum Hadir" || record.status === "Checkout Terlewat") {
          symbol = "❌";
          style = "text-rose-700 bg-rose-50 border-rose-200 font-bold";
          statusText = "Sakit / Alpa";
        } else if (record.status === "Cuti") {
          symbol = "C";
          style = "text-purple-700 bg-purple-50 border-purple-200 font-bold";
          statusText = "Cuti";
        } else if (record.status === "Tugas Luar") {
          symbol = "T";
          style = "text-cyan-700 bg-cyan-50 border-cyan-200 font-bold";
          statusText = "Tugas Luar";
        } else if (record.status === "Libur") {
          symbol = "L";
          style = "text-amber-700 bg-amber-50 border-amber-200 font-bold";
          statusText = "Libur";
        }
      }

      calendarDays.push({
        day: d,
        symbol,
        style,
        statusText
      });
    }

    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-heading text-xs font-bold text-[#0A3981] uppercase tracking-wider">Kalender Kehadiran Bulanan (Juli 2026)</h4>
          <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full font-bold text-slate-500">
            {employees.find(e => e.id === selectedEmployeeId)?.name}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 text-center">
          {calendarDays.map(cd => (
            <div 
              key={cd.day} 
              className={`p-2 rounded-xl border text-xs flex flex-col items-center justify-center space-y-1 ${cd.style}`}
              title={`${cd.day} Juli 2026: ${cd.statusText}`}
            >
              <span className="text-[9px] text-slate-400 font-bold font-mono">{cd.day.toString().padStart(2, "0")}</span>
              <span className="text-sm">{cd.symbol}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-1 pt-2 text-[10px] text-slate-400 text-center border-t border-slate-50 font-bold font-heading">
          <div>✅ Hadir</div>
          <div>❌ Absen</div>
          <div>C Cuti</div>
          <div>T Tugas</div>
          <div>L Libur</div>
        </div>
      </div>
    );
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    // Header
    const headers = ["Nama", "Jabatan", "Tanggal", "Jam Masuk", "Jam Pulang", "Status", "Total Menit"];
    const rows = history.map(h => [
      h.employee_name,
      h.employee_position,
      h.attendance_date,
      h.checkin_time,
      h.checkout_time || "-",
      h.status,
      h.total_minutes
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_${selectedEmployeeId}_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-[#0A3981]">Riwayat Kehadiran</h2>
          <p className="text-[11px] text-slate-500 font-medium">Transparansi penuh data absensi perangkat desa.</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-heading hover:bg-emerald-500 transition active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor</span>
          </button>
        )}
      </div>

      {/* Filter Controls Card */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 space-y-4">
        {/* Filter Perangkat */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pilih Perangkat Desa</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981]"
            >
              <option value="all">Semua Perangkat Desa</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Rentang Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Filter Periode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Hari Ini", value: "today" },
                { label: "Kemarin", value: "yesterday" },
                { label: "Minggu Ini", value: "week" },
                { label: "Bulan Ini", value: "month" },
                { label: "Semua", value: "all" },
                { label: "Kustom", value: "custom" }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`py-2 rounded-xl text-xs font-bold font-heading border transition ${
                    range === opt.value 
                      ? "bg-[#0A3981] border-[#0A3981] text-white shadow-sm" 
                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {range === "custom" && (
            <>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dari Tanggal</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-[#0A3981]"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sampai Tanggal</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-[#0A3981]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ringkasan Bulanan / Statistika Panel */}
      {selectedEmployeeId !== "all" && history.length > 0 && (
        <div className="rounded-2xl bg-[#0A3981] text-white p-5 shadow-md space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
            <BarChart3 className="h-4 w-4" />
            <span className="font-heading">Ringkasan Kehadiran</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-300 block uppercase font-medium">Hadir</span>
              <span className="text-base font-bold font-heading">{summary.hadir} Hari</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-300 block uppercase font-medium">Cuti / Tugas</span>
              <span className="text-base font-bold font-heading">{summary.cuti + summary.tugasLuar} Hari</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5">
              <span className="text-[9px] text-slate-300 block uppercase font-medium">Rasio Hadir</span>
              <span className="text-base font-bold font-heading text-amber-300">{summary.attendanceRate}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10 text-slate-200">
            <div>
              Total Jam Kerja: <span className="font-bold text-white font-mono">{summary.totalHours}</span>
            </div>
            <div className="text-right">
              Rerata Harian: <span className="font-bold text-white font-mono">{summary.avgHours}</span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View for specific employee */}
      {renderCalendar()}

      {/* Log History list */}
      <div className="space-y-3">
        <h3 className="font-heading text-sm font-bold text-[#0A3981]">Daftar Histori Absensi</h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0A3981] border-t-transparent"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((record) => (
              <div 
                key={record.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 transition space-y-3"
              >
                {/* Header Identity & Date */}
                <div className="flex justify-between items-start pb-2.5 border-b border-slate-50">
                  <div>
                    <h4 className="font-heading text-xs font-bold text-slate-800">{record.employee_name}</h4>
                    <p className="text-[9px] text-slate-400 font-semibold">{record.employee_position}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-[#0A3981] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {new Date(record.attendance_date).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                    </span>
                    <span className={`block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border text-center ${
                      record.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      record.status === 'Sedang Bertugas' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                      record.status === 'Cuti' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      record.status === 'Tugas Luar' ? 'bg-cyan-50 text-cyan-700 border-cyan-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                {/* Checkin / Checkout log details */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Masuk</span>
                    <span className="font-mono font-bold text-slate-700">{record.checkin_time || "-"}</span>
                    {record.checkin_distance !== undefined && record.checkin_distance > 0 && (
                      <span className="block text-[8px] text-slate-400 mt-0.5">GPS: {record.checkin_distance}m</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight block">Pulang</span>
                    <span className="font-mono font-bold text-slate-700">{record.checkout_time || "-"}</span>
                    {record.checkout_distance !== undefined && record.checkout_distance !== null && (
                      <span className="block text-[8px] text-slate-400 mt-0.5">GPS: {record.checkout_distance}m</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-tight block font-semibold">Total Durasi</span>
                    <span className="font-mono font-bold text-emerald-600 block">
                      {record.checkout_time ? `${Math.floor(record.total_minutes / 60)}j ${record.total_minutes % 60}m` : "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center text-slate-400">
            <CalendarRange className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium">Tidak ada data kehadiran yang terekam dalam filter ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
