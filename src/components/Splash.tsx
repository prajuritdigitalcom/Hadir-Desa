import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashProps {
  onComplete: () => void;
  key?: string;
}

export default function Splash({ onComplete }: SplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Allow exit animation to finish
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="splash-screen"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0A3981] p-8 text-white select-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Top Decorative Elements */}
          <div className="w-full flex justify-between opacity-20 text-xs font-mono">
            <span>HADIRDESA V1.0</span>
            <span>BOJONEGORO SMART VILLAGE</span>
          </div>

          {/* Center Brand */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white p-2 shadow-2xl"
            >
              <img
                src="https://i.ibb.co.com/DfLZtBrh/icon-ringintunggal-1.webp"
                alt="Logo Ringintunggal"
                className="h-20 w-20 object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="font-heading text-2xl font-bold tracking-wider"
            >
              HADIRDESA
            </motion.h1>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-1 font-heading text-lg font-semibold text-amber-400 tracking-wide"
            >
              RINGINTUNGGAL
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mt-4 max-w-xs text-sm font-light text-slate-200"
            >
              Sistem Transparansi Kehadiran Perangkat Desa Bojonegoro Jawa Timur
            </motion.p>
          </div>

          {/* Bottom Footer & Loader */}
          <div className="flex flex-col items-center">
            <div className="mb-6 flex space-x-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]"></span>
              <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400"></span>
            </div>
            
            <div className="text-center opacity-40 text-[10px] font-mono tracking-widest uppercase">
              PEMERINTAH KABUPATEN BOJONEGORO
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
