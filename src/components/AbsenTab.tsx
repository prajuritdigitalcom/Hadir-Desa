import { useState, useEffect } from "react";
import { 
  MapPin, 
  MapPinOff, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock, 
  HelpCircle,
  Smartphone,
  Navigation,
  Loader2
} from "lucide-react";
import { Employee, SystemSettings } from "../types";

export default function AbsenTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  
  // Geolocation and GPS State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [useSimulation, setUseSimulation] = useState(false);
  
  // Device ID & Session state
  const [deviceId, setDeviceId] = useState("");
  const [lockedSession, setLockedSession] = useState<{ employeeId: string; name: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Status updates
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" | null }>({ text: "", type: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Browser Validation
  const [isChrome, setIsChrome] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  // Browser Check effect
  useEffect(() => {
    const checkBrowser = async () => {
      const ua = navigator.userAgent;
      
      // 1. Check if it's Brave
      let isBrave = false;
      if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
        try {
          isBrave = await (navigator as any).brave.isBrave();
        } catch (e) {
          console.error(e);
        }
      }
      
      // 2. Chrome UA verification
      const hasChromeToken = ua.includes("Chrome") || ua.includes("CriOS");
      
      // We block non-Chrome browsers by checking for their known tokens
      const isEdge = ua.includes("Edg") || ua.includes("Edge");
      const isOpera = ua.includes("OPR") || ua.includes("Opera");
      const isFirefox = ua.includes("Firefox") || ua.includes("FxAn");
      const isSamsung = ua.includes("SamsungBrowser");
      const isSafariOnly = ua.includes("Safari") && !hasChromeToken; // Standard Safari contains Safari but not Chrome
      
      const allowed = hasChromeToken && !isBrave && !isEdge && !isOpera && !isFirefox && !isSamsung && !isSafariOnly;
      setIsChrome(allowed);
    };
    
    checkBrowser();
  }, []);

  // 1. Generate / Retrieve unique device ID
  useEffect(() => {
    let dId = localStorage.getItem("hadirdesa_device_id");
    if (!dId) {
      dId = `dev_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem("hadirdesa_device_id", dId);
    }
    setDeviceId(dId);
  }, []);

  // 2. Fetch active employees & settings
  const loadInitialData = () => {
    fetch("/api/public/employees")
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error(err));

    fetch("/api/public/settings")
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 3. Check for locked session on this device
  const checkDeviceLock = () => {
    if (!deviceId) return;
    
    // Check locked session from server
    fetch("/api/public/attendance/today")
      .then(res => res.json())
      .then((data: any[]) => {
        // Find if this device is locked by looking at any "Sedang Bertugas" in today's attendance, or we can check the db
        // Let's call a fetch or determine from today's list. 
        // In our server, device session maps deviceId to locked sessions. Let's ask server or find any "Sedang Bertugas"
        // Let's make an endpoint in server, or simpler: since we know device_id lock is managed on server,
        // we can fetch the state of device locks.
        // Let's check device session locks in today's records or let's create a small check logic.
        // Let's assume we can fetch active sessions. Wait, let's fetch /api/public/attendance/today.
        // If an employee status is "Sedang Bertugas" and device lock applies, let's check localStorage session cache!
        const localLock = localStorage.getItem("hadirdesa_session_lock");
        if (localLock) {
          try {
            const parsed = JSON.parse(localLock);
            setLockedSession(parsed);
            setIsLocked(true);
            setSelectedEmpId(parsed.employeeId);
          } catch (e) {
            localStorage.removeItem("hadirdesa_session_lock");
          }
        } else {
          setLockedSession(null);
          setIsLocked(false);
        }
      });
  };

  useEffect(() => {
    checkDeviceLock();
  }, [deviceId]);

  // 4. Retrieve GPS coordinates
  const triggerGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    setStatusMsg({ text: "", type: null });

    if (useSimulation && settings) {
      // Simulate location exactly at office
      setTimeout(() => {
        setLatitude(settings.office_latitude);
        setLongitude(settings.office_longitude);
        setGpsLoading(false);
      }, 500);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung layanan lokasi GPS.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsLoading(false);
      },
      (error) => {
        console.error("GPS Error:", error);
        let msg = "Gagal mengambil lokasi GPS. Silakan berikan izin akses lokasi.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin lokasi ditolak. Mohon aktifkan izin GPS di peramban Anda.";
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (settings) {
      triggerGPS();
    }
  }, [useSimulation, settings]);

  // Haversine Distance Helper for UI display
  const calculateUiDistance = () => {
    if (!latitude || !longitude || !settings) return null;
    const R = 6371e3;
    const lat1 = latitude;
    const lon1 = longitude;
    const lat2 = settings.office_latitude;
    const lon2 = settings.office_longitude;

    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const currentDistance = calculateUiDistance();

  // Perform Check In
  const handleCheckIn = async () => {
    if (!selectedEmpId) {
      setStatusMsg({ text: "Silakan pilih nama perangkat desa terlebih dahulu.", type: "error" });
      return;
    }
    if (latitude === null || longitude === null) {
      setStatusMsg({ text: "Lokasi GPS belum didapatkan. Mohon ambil lokasi kembali.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ text: "", type: null });

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          latitude,
          longitude,
          deviceId
        })
      });

      const result = await response.json();
      if (response.ok) {
        setStatusMsg({ text: result.message, type: "success" });
        
        // Save local session lock
        const selectedEmp = employees.find(e => e.id === selectedEmpId);
        const lockInfo = { employeeId: selectedEmpId, name: selectedEmp?.name || "Perangkat" };
        localStorage.setItem("hadirdesa_session_lock", JSON.stringify(lockInfo));
        setLockedSession(lockInfo);
        setIsLocked(true);
        loadInitialData();
      } else {
        setStatusMsg({ text: result.error || "Gagal melakukan absen masuk.", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Perform Check Out
  const handleCheckOut = async () => {
    if (!selectedEmpId) {
      setStatusMsg({ text: "Silakan pilih nama perangkat desa terlebih dahulu.", type: "error" });
      return;
    }
    if (latitude === null || longitude === null) {
      setStatusMsg({ text: "Lokasi GPS belum didapatkan. Mohon ambil lokasi kembali.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg({ text: "", type: null });

    try {
      const response = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          latitude,
          longitude,
          deviceId
        })
      });

      const result = await response.json();
      if (response.ok) {
        setStatusMsg({ text: result.message, type: "success" });
        
        // Remove local session lock
        localStorage.removeItem("hadirdesa_session_lock");
        setLockedSession(null);
        setIsLocked(false);
        setSelectedEmpId("");
        loadInitialData();
      } else {
        setStatusMsg({ text: result.error || "Gagal melakukan absen pulang.", type: "error" });
      }
    } catch (err) {
      setStatusMsg({ text: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isChrome) {
    const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="space-y-6 pb-20 select-none animate-fade-in">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-rose-700">Akses Terbuka Dibatasi</h2>
          <p className="text-[11px] text-slate-500 font-medium">Sistem Keamanan Absensi Perangkat Desa.</p>
        </div>

        <div className="rounded-3xl bg-white border border-rose-100 p-6 shadow-sm space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-sm font-bold text-slate-800">Gunakan Browser Google Chrome</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Untuk menjamin keunikan sesi perangkat (<span className="font-semibold text-slate-800">Device ID Lock</span>) dan mencegah manipulasi absensi dengan berpindah peramban (browser), Anda **wajib menggunakan Google Chrome** resmi.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Petunjuk Akses:</h4>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Salin tautan (link) website absensi di bawah ini.</li>
              <li>Buka aplikasi <span className="font-semibold text-slate-800">Google Chrome</span> di HP Anda.</li>
              <li>Tempelkan (paste) tautan tersebut ke kolom alamat Google Chrome.</li>
              <li>Lakukan absensi masuk/pulang seperti biasa.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-center text-xs font-mono select-all text-slate-600 truncate">
              {window.location.href}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full bg-[#0A3981] hover:bg-blue-800 text-white font-heading font-bold text-xs p-3.5 rounded-xl shadow-md transition active:scale-95"
            >
              {copied ? "Tautan Berhasil Disalin! ✓" : "Salin Tautan Website"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Page Header */}
      <div>
        <h2 className="font-heading text-lg font-extrabold text-[#0A3981]">Absensi Geofence</h2>
        <p className="text-[11px] text-slate-500 font-medium">Hanya berlaku di area Balai Desa Ringintunggal.</p>
      </div>

      {/* Device Lock Banner */}
      {isLocked && lockedSession && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center space-x-3 text-amber-800">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold font-heading">Perangkat Ini Sedang Terkunci</h4>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
              Terkunci atas nama <span className="font-bold">{lockedSession.name}</span>. Sesi lock akan terlepas otomatis setelah sukses absen pulang (checkout).
            </p>
          </div>
        </div>
      )}

      {/* Geofence GPS Diagnostics Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center space-x-2">
            <Navigation className="h-4 w-4 text-[#0A3981]" />
            <h3 className="font-heading text-xs font-bold text-slate-800 uppercase tracking-wider">Validasi Geolocation</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Radius: {settings?.radius_geofence || 50}m</span>
        </div>

        {/* GPS Coords output / Diagnostics */}
        {gpsLoading ? (
          <div className="flex flex-col items-center justify-center py-4 text-slate-500 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#0A3981]" />
            <span className="text-xs font-medium">Mendapatkan koordinat presisi...</span>
          </div>
        ) : latitude !== null && longitude !== null ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="text-[8px] text-slate-400 font-bold uppercase">Latitude</span>
                <p className="text-xs font-mono font-bold text-slate-700">{latitude.toFixed(6)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                <span className="text-[8px] text-slate-400 font-bold uppercase">Longitude</span>
                <p className="text-xs font-mono font-bold text-slate-700">{longitude.toFixed(6)}</p>
              </div>
            </div>

            {/* Distance calculation message */}
            {currentDistance !== null && settings && (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                currentDistance <= settings.radius_geofence
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <div className="flex items-center space-x-2">
                  <MapPin className={`h-5 w-5 ${currentDistance <= settings.radius_geofence ? "text-emerald-600" : "text-rose-600"}`} />
                  <div>
                    <h5 className="text-xs font-bold font-heading">
                      {currentDistance <= settings.radius_geofence ? "Dalam Area Kantor" : "Di Luar Area Kantor"}
                    </h5>
                    <p className="text-[10px] opacity-80">Jarak: {currentDistance} meter dari balai desa</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold">
                  {currentDistance <= settings.radius_geofence ? "Valid ✅" : "Ditolak ❌"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center text-slate-400">
            <MapPinOff className="h-6 w-6 mx-auto mb-1.5 text-slate-300" />
            <p className="text-xs font-medium leading-relaxed">Belum ada data koordinat lokasi GPS.</p>
            {gpsError && <p className="text-[10px] text-rose-500 mt-2 font-medium">{gpsError}</p>}
          </div>
        )}

        <div className="flex space-x-2.5">
          <button
            onClick={triggerGPS}
            disabled={gpsLoading}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2.5 rounded-xl text-xs font-bold font-heading transition active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <span>Dapatkan GPS</span>
          </button>

          {/* Simulation toggle */}
          <button
            onClick={() => setUseSimulation(prev => !prev)}
            className={`flex-1 p-2.5 rounded-xl text-xs font-bold font-heading transition active:scale-95 border flex items-center justify-center ${
              useSimulation 
                ? "bg-amber-100 border-amber-300 text-amber-800" 
                : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <span>Simulasi Kantor</span>
          </button>
        </div>
      </div>

      {/* Main Absen Actions Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
        {/* Name Selection */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Nama Perangkat Desa</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            disabled={isLocked}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0A3981] disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">-- Pilih Nama Anda --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
            ))}
          </select>
        </div>

        {/* Status updates notifications */}
        {statusMsg.text && (
          <div className={`p-3 rounded-xl border flex items-start space-x-2 text-xs font-medium leading-relaxed ${
            statusMsg.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {statusMsg.type === "success" ? <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Absen Buttons row */}
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          {/* Checkin button */}
          <button
            onClick={handleCheckIn}
            disabled={isLocked || isSubmitting || gpsLoading || latitude === null}
            className="bg-[#0A3981] hover:bg-blue-800 text-white font-heading font-bold text-[10.5px] p-3.5 rounded-xl shadow-md transition hover:shadow-lg hover:-translate-y-0.5 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 disabled:shadow-none disabled:-translate-y-0 active:scale-95 uppercase tracking-wider"
          >
            Absen Masuk (Check-In)
          </button>

          {/* Checkout button */}
          <button
            onClick={handleCheckOut}
            disabled={isSubmitting || gpsLoading || latitude === null}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-[10.5px] p-3.5 rounded-xl shadow-md transition hover:shadow-lg hover:-translate-y-0.5 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 disabled:shadow-none disabled:-translate-y-0 active:scale-95 uppercase tracking-wider"
          >
            Absen Pulang (Check-Out)
          </button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-[11px] text-slate-500 leading-relaxed">
        <div className="flex items-center space-x-1 font-bold text-[#0A3981]">
          <HelpCircle className="h-4 w-4" />
          <span className="font-heading">Panduan Absensi</span>
        </div>
        <ul className="list-disc pl-4 space-y-1 font-medium">
          <li>Pastikan Anda berada di area Balai Desa Ringintunggal (maksimal 50 meter).</li>
          <li>Klik "Dapatkan GPS" untuk melacak titik koordinat Anda saat ini.</li>
          <li>Pilih nama Anda, kemudian tekan "Absen Masuk" jika baru datang, atau "Absen Pulang" jika hendak pulang bekerja.</li>
          <li>Satu perangkat terkunci untuk satu sesi absen demi mencegah titip absen.</li>
        </ul>
      </div>
    </div>
  );
}
