import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  History as HistoryIcon, 
  Fingerprint, 
  ShieldAlert, 
  Wifi, 
  Battery, 
  MapPin,
  Clock
} from "lucide-react";

import Splash from "./components/Splash";
import BerandaTab from "./components/BerandaTab";
import RiwayatTab from "./components/RiwayatTab";
import AbsenTab from "./components/AbsenTab";
import AdminTab from "./components/AdminTab";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"beranda" | "riwayat" | "absen" | "admin">("beranda");
  const [selectedHistoryEmpId, setSelectedHistoryEmpId] = useState<string | undefined>(undefined);
  
  // Status Bar Live Time
  const [statusTime, setStatusTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setStatusTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEmployeeHistory = (empId: string) => {
    setSelectedHistoryEmpId(empId);
    setActiveTab("riwayat");
  };

  const handleNavigateToTab = (tab: string) => {
    if (tab === "absen") setActiveTab("absen");
    if (tab === "beranda") setActiveTab("beranda");
  };

  return (
    <div id="applet-root" className="min-h-screen bg-slate-900 flex items-center justify-center font-sans antialiased">
      {/* Background decoration for desktop views */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 select-none pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.div
            key="app-frame"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-[430px] h-screen sm:h-[844px] bg-[#f8fafc] sm:rounded-[40px] sm:shadow-[0_0_50px_rgba(0,0,0,0.4)] border border-slate-800/80 overflow-hidden relative flex flex-col"
          >
            {/* Mobile Status Bar */}
            <div className="bg-[#0A3981] text-white px-6 pt-3 pb-2 flex justify-between items-center text-[11px] font-bold font-heading select-none shrink-0">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-amber-400" />
                <span>{statusTime} WIB</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-emerald-500 px-1.5 py-0.5 rounded text-white font-mono leading-none">GPS</span>
                <Wifi className="h-3.5 w-3.5 text-slate-300" />
                <Battery className="h-3.5 w-3.5 text-slate-300" />
              </div>
            </div>

            {/* Custom Village Header Banner */}
            <div className="bg-[#0A3981] text-white px-5 py-4 flex items-center justify-between shadow-sm border-b border-blue-900 shrink-0 select-none">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-1 rounded-xl shadow-md">
                  <img
                    src="https://i.ibb.co.com/DfLZtBrh/icon-ringintunggal-1.webp"
                    alt="Logo Ringintunggal"
                    className="h-7 w-7 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h1 className="font-heading text-sm font-black tracking-wide leading-tight">HADIRDESA</h1>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider leading-none">Ringintunggal</p>
                </div>
              </div>
              
              <div className="flex flex-col text-right text-[9px] font-mono opacity-60">
                <span>BOJONEGORO</span>
                <span>JAWA TIMUR</span>
              </div>
            </div>

            {/* Main scrollable content view */}
            <div className="flex-1 overflow-y-auto px-5 pt-5 pb-24 scrollbar-none bg-[#f8fafc]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === "beranda" && (
                    <BerandaTab 
                      onSelectEmployeeHistory={handleSelectEmployeeHistory} 
                      onNavigateToTab={handleNavigateToTab}
                    />
                  )}
                  
                  {activeTab === "riwayat" && (
                    <RiwayatTab preselectedEmployeeId={selectedHistoryEmpId} />
                  )}
                  
                  {activeTab === "absen" && (
                    <AbsenTab />
                  )}
                  
                  {activeTab === "admin" && (
                    <AdminTab />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Bottom Tab Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 flex justify-around items-center shadow-lg z-10 shrink-0 select-none">
              {/* Tab: Beranda */}
              <button
                onClick={() => {
                  setActiveTab("beranda");
                  setSelectedHistoryEmpId(undefined);
                }}
                className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${
                  activeTab === "beranda" ? "text-[#0A3981] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Home className={`h-5 w-5 ${activeTab === "beranda" ? "scale-110" : ""}`} />
                <span className="text-[10px] font-heading font-semibold tracking-tight">Beranda</span>
              </button>

              {/* Tab: Riwayat */}
              <button
                onClick={() => {
                  setActiveTab("riwayat");
                  setSelectedHistoryEmpId(undefined);
                }}
                className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${
                  activeTab === "riwayat" ? "text-[#0A3981] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <HistoryIcon className={`h-5 w-5 ${activeTab === "riwayat" ? "scale-110" : ""}`} />
                <span className="text-[10px] font-heading font-semibold tracking-tight">Riwayat</span>
              </button>

              {/* Tab: Absen */}
              <button
                onClick={() => {
                  setActiveTab("absen");
                  setSelectedHistoryEmpId(undefined);
                }}
                className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${
                  activeTab === "absen" ? "text-[#0A3981] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div className={`p-2 rounded-full -mt-6 shadow-md border ${
                  activeTab === "absen" 
                    ? "bg-[#0A3981] border-[#0A3981] text-amber-400 scale-110" 
                    : "bg-white border-slate-100 text-slate-500 hover:text-slate-700"
                } transition-all duration-300`}>
                  <Fingerprint className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-heading font-semibold tracking-tight">Absen</span>
              </button>

              {/* Tab: Admin */}
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setSelectedHistoryEmpId(undefined);
                }}
                className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition ${
                  activeTab === "admin" ? "text-[#0A3981] font-bold" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <ShieldAlert className={`h-5 w-5 ${activeTab === "admin" ? "scale-110" : ""}`} />
                <span className="text-[10px] font-heading font-semibold tracking-tight">Admin</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
