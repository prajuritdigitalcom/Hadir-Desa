import express from "express";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { 
  Employee, 
  Attendance, 
  SystemSettings, 
  Holiday, 
  Announcement, 
  AuditLog, 
  DeviceSession,
  PublicStats
} from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_PATH = path.join(process.cwd(), "db.json");

interface DBStructure {
  employees: Employee[];
  attendance: Attendance[];
  settings: SystemSettings;
  holidays: Holiday[];
  announcements: Announcement[];
  audit_logs: AuditLog[];
  device_sessions: DeviceSession[];
}

let globalDB: DBStructure | null = null;
let dbDirty = false;
let isConnectedToSupabase = false;
let isConnectedToSupabaseOnce = false;
let lastSupabaseError: string | null = null;

let supabaseClient: any = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  
  const url = (process.env.SUPABASE_URL || "https://xtaqulieahpvzztlrqwp.supabase.co").trim();
  const key = (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_F39FBkiHAG7wpNeBxX5XlA_A4R-ocB2").trim();
  
  try {
    supabaseClient = createClient(url, key);
  } catch (err) {
    console.error("Gagal menginisialisasi client Supabase:", err);
    supabaseClient = null;
  }
  return supabaseClient;
}

function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return false;
  }
  
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  
  return (
    cleanUrl !== "" &&
    cleanKey !== "" &&
    !cleanUrl.includes("YOUR_") &&
    !cleanKey.includes("YOUR_") &&
    cleanUrl !== "MY_SUPABASE_URL" &&
    cleanKey !== "MY_SUPABASE_KEY"
  );
}

async function loadFromSupabase(): Promise<DBStructure> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const client = getSupabase();
  if (!client) {
    throw new Error("Supabase client is not initialized.");
  }

  const fetchPromise = (async () => {
    try {
      const { data, error } = await client
        .from("hadirdesa_store")
        .select("data")
        .eq("id", "main_db")
        .single();

      if (error) {
        if (error.code === "PGRST116") { // Record not found
          const initialDB = getLocalInitialDB();
          const { error: insertError } = await client
            .from("hadirdesa_store")
            .insert({ id: "main_db", data: initialDB });
          
          if (insertError) {
            console.error("Failed to seed initial DB to Supabase:", insertError);
            throw insertError;
          }
          return initialDB;
        }
        throw error;
      }

      if (data && data.data) {
        return data.data as DBStructure;
      }
      throw new Error("No data returned from Supabase.");
    } catch (err: any) {
      console.error("Error in loadFromSupabase fetchPromise:", err);
      throw err;
    }
  })();

  // Handle background rejection to prevent unhandled promise rejection crashes
  fetchPromise.catch((err) => {
    console.warn("fetchPromise background rejection (ignored after race/timeout):", err);
  });

  // Use Promise.race to abort after 4 seconds to prevent cold start / function timeouts
  return Promise.race([
    fetchPromise,
    new Promise<DBStructure>((_, reject) =>
      setTimeout(() => reject(new Error("Koneksi Supabase timeout (melebihi 4 detik).")), 4000)
    )
  ]);
}

async function saveToSupabase(data: DBStructure) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const client = getSupabase();
  if (!client) {
    return;
  }

  const savePromise = (async () => {
    try {
      const { error } = await client
        .from("hadirdesa_store")
        .upsert({ id: "main_db", data, updated_at: new Date().toISOString() });

      if (error) {
        console.error("Error writing to Supabase:", error);
        throw error;
      }
    } catch (err: any) {
      console.error("Error in saveToSupabase savePromise:", err);
      throw err;
    }
  })();

  // Handle background rejection to prevent unhandled promise rejection crashes
  savePromise.catch((err) => {
    console.warn("savePromise background rejection (ignored after race/timeout):", err);
  });

  return Promise.race([
    savePromise,
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error("Penyimpanan Supabase timeout (melebihi 4 detik).")), 4000)
    )
  ]);
}

// Haversine Distance helper
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

function getLocalDateString(offsetDays = 0) {
  const date = new Date();
  // Adjust to Indonesian West Time (WIB, UTC+7) + offsetDays
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wibDate = new Date(utc + 3600000 * 7 + (offsetDays * 24 * 60 * 60 * 1000));
  return wibDate.toISOString().split("T")[0];
}

function getLocalInitialDB(): DBStructure {
  const constructInitialDB = (): DBStructure => {
    const initialDB: DBStructure = {
      employees: [
        { id: "1", name: "Gatot Suhartono", position: "Kepala Desa", phone: "081234567890", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", active: true, created_at: new Date().toISOString() },
        { id: "2", name: "Budi Santoso", position: "Sekretaris Desa", phone: "081234567891", photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150", active: true, created_at: new Date().toISOString() },
        { id: "3", name: "Siti Aminah", position: "Kaur Keuangan", phone: "081234567892", photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", active: true, created_at: new Date().toISOString() },
        { id: "4", name: "Ahmad Fauzi", position: "Kaur Pembangunan", phone: "081234567893", photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", active: true, created_at: new Date().toISOString() },
        { id: "5", name: "Dewi Lestari", position: "Kaur Umum", phone: "081234567894", photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", active: true, created_at: new Date().toISOString() },
        { id: "6", name: "Hendra Wijaya", position: "Kasi Pemerintahan", phone: "081234567895", photo_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", active: true, created_at: new Date().toISOString() },
        { id: "7", name: "Rini Amalia", position: "Kasi Pelayanan", phone: "081234567896", photo_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150", active: true, created_at: new Date().toISOString() }
      ],
      attendance: [],
      settings: {
        office_latitude: -7.161048,
        office_longitude: 111.725902,
        radius_geofence: 50,
        jam_masuk_mulai: "06:00",
        jam_masuk_normal_berakhir: "08:00",
        jam_pulang_minimal: "12:00",
        jam_pulang_maksimal: "20:00",
        toleransi_keterlambatan: 15,
        admin_password: "admindesa"
      },
      holidays: [
        { id: "h1", holiday_date: "2026-08-17", holiday_name: "Hari Kemerdekaan RI", holiday_type: "nasional" },
        { id: "h2", holiday_date: "2026-07-07", holiday_name: "Tahun Baru Islam 1448 H", holiday_type: "nasional" }
      ],
      announcements: [
        { id: "a1", title: "Pelayanan Prima HadirDesa", content: "Dengan aplikasi HadirDesa Ringintunggal, mari kita tingkatkan kedisiplinan dan transparansi pelayanan publik untuk seluruh masyarakat desa Ringintunggal.", active: true, created_at: new Date().toISOString() },
        { id: "a2", title: "Rapat Evaluasi Triwulan", content: "Diberitahukan kepada seluruh perangkat desa, rapat koordinasi bulanan akan dilaksanakan pada hari Senin jam 09:00 WIB.", active: true, created_at: new Date().toISOString() }
      ],
      audit_logs: [
        { id: "log1", admin_email: "system@ringintunggal.go.id", action: "Sistem Diinisialisasi", target: "Aplikasi", created_at: new Date().toISOString() }
      ],
      device_sessions: []
    };

    // Seed history data
    const todayStr = getLocalDateString(0);
    const dates = [
      getLocalDateString(-1),
      getLocalDateString(-2),
      getLocalDateString(-3),
      getLocalDateString(-4)
    ];
    let idCounter = 100;
    
    dates.forEach(date => {
      if (date === "2026-07-02") {
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "1",
          attendance_date: date,
          checkin_time: "07:05",
          checkout_time: "15:30",
          total_minutes: 505,
          checkin_latitude: -7.161048,
          checkin_longitude: 111.725902,
          checkout_latitude: -7.161048,
          checkout_longitude: 111.725902,
          checkin_distance: 2.5,
          checkout_distance: 1.2,
          status: "Hadir",
          created_at: `${date}T07:05:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "2",
          attendance_date: date,
          checkin_time: "07:15",
          checkout_time: "15:45",
          total_minutes: 510,
          checkin_latitude: -7.161042,
          checkin_longitude: 111.725909,
          checkout_latitude: -7.161042,
          checkout_longitude: 111.725909,
          checkin_distance: 4.1,
          checkout_distance: 3.5,
          status: "Hadir",
          created_at: `${date}T07:15:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "3",
          attendance_date: date,
          checkin_time: "07:30",
          checkout_time: "15:15",
          total_minutes: 465,
          checkin_latitude: -7.161050,
          checkin_longitude: 111.725895,
          checkout_latitude: -7.161050,
          checkout_longitude: 111.725895,
          checkin_distance: 1.8,
          checkout_distance: 2.1,
          status: "Hadir",
          created_at: `${date}T07:30:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "4",
          attendance_date: date,
          checkin_time: "08:15",
          checkout_time: "16:00",
          total_minutes: 465,
          checkin_latitude: -7.162000,
          checkin_longitude: 111.726000,
          checkout_latitude: -7.162000,
          checkout_longitude: 111.726000,
          checkin_distance: 110.5,
          checkout_distance: 110.5,
          status: "Tugas Luar",
          created_at: `${date}T08:15:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "5",
          attendance_date: date,
          checkin_time: "07:02",
          checkout_time: "15:05",
          total_minutes: 483,
          checkin_latitude: -7.161040,
          checkin_longitude: 111.725915,
          checkout_latitude: -7.161040,
          checkout_longitude: 111.725915,
          checkin_distance: 3.0,
          checkout_distance: 2.8,
          status: "Hadir",
          created_at: `${date}T07:02:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "6",
          attendance_date: date,
          checkin_time: "00:00",
          checkout_time: "00:00",
          total_minutes: 0,
          checkin_latitude: 0,
          checkin_longitude: 0,
          checkout_latitude: null,
          checkout_longitude: null,
          checkin_distance: 0,
          checkout_distance: null,
          status: "Cuti",
          created_at: `${date}T00:00:00Z`
        });
        initialDB.attendance.push({
          id: `att_${idCounter++}`,
          employee_id: "7",
          attendance_date: date,
          checkin_time: "07:45",
          checkout_time: "15:20",
          total_minutes: 455,
          checkin_latitude: -7.161045,
          checkin_longitude: 111.725900,
          checkout_latitude: -7.161045,
          checkout_longitude: 111.725900,
          checkin_distance: 2.2,
          checkout_distance: 1.9,
          status: "Hadir",
          created_at: `${date}T07:45:00Z`
        });
      } else {
        initialDB.employees.forEach(emp => {
          initialDB.attendance.push({
            id: `att_${idCounter++}`,
            employee_id: emp.id,
            attendance_date: date,
            checkin_time: "07:10",
            checkout_time: "15:15",
            total_minutes: 485,
            checkin_latitude: -7.161048,
            checkin_longitude: 111.725902,
            checkout_latitude: -7.161048,
            checkout_longitude: 111.725902,
            checkin_distance: 1.0,
            checkout_distance: 1.0,
            status: "Hadir",
            created_at: `${date}T07:10:00Z`
          });
        });
      }
    });

    initialDB.attendance.push({
      id: `att_${idCounter++}`,
      employee_id: "1",
      attendance_date: todayStr,
      checkin_time: "07:05",
      checkout_time: null,
      total_minutes: 0,
      checkin_latitude: -7.161048,
      checkin_longitude: 111.725902,
      checkout_latitude: null,
      checkout_longitude: null,
      checkin_distance: 0.5,
      checkout_distance: null,
      status: "Sedang Bertugas",
      created_at: `${todayStr}T07:05:00Z`
    });
    initialDB.attendance.push({
      id: `att_${idCounter++}`,
      employee_id: "2",
      attendance_date: todayStr,
      checkin_time: "07:12",
      checkout_time: "15:00",
      total_minutes: 468,
      checkin_latitude: -7.161042,
      checkin_longitude: 111.725909,
      checkout_latitude: -7.161042,
      checkout_longitude: 111.725909,
      checkin_distance: 3.2,
      checkout_distance: 2.1,
      status: "Hadir",
      created_at: `${todayStr}T07:12:00Z`
    });
    initialDB.attendance.push({
      id: `att_${idCounter++}`,
      employee_id: "3",
      attendance_date: todayStr,
      checkin_time: "07:45",
      checkout_time: null,
      total_minutes: 0,
      checkin_latitude: -7.161050,
      checkin_longitude: 111.725895,
      checkout_latitude: null,
      checkout_longitude: null,
      checkin_distance: 1.4,
      checkout_distance: null,
      status: "Sedang Bertugas",
      created_at: `${todayStr}T07:45:00Z`
    });

    initialDB.device_sessions.push({
      id: "ds_1",
      device_id: "mock_device_gatot",
      employee_id: "1",
      employee_name: "Gatot Suhartono",
      checkin_time: `${todayStr}T07:05:00Z`,
      status: "locked"
    });
    initialDB.device_sessions.push({
      id: "ds_2",
      device_id: "mock_device_siti",
      employee_id: "3",
      employee_name: "Siti Aminah",
      checkin_time: `${todayStr}T07:45:00Z`,
      status: "locked"
    });

    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2), "utf-8");
    } catch (err) {
      // ignore
    }
    return initialDB;
  };

  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      if (data && data.trim()) {
        return JSON.parse(data);
      }
    }
  } catch (err) {
    console.error("Gagal membaca db.json lokal, membuat ulang:", err);
  }

  return constructInitialDB();
}

function readDB(): DBStructure {
  if (globalDB) {
    return globalDB;
  }
  return getLocalInitialDB();
}

function writeDB(data: DBStructure) {
  globalDB = data;
  dbDirty = true;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // ignore on read-only filesystems (like Vercel)
  }
}

// Admin auth middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const dbData = readDB();
  const password = dbData.settings.admin_password || "admindesa";
  
  if (authHeader && authHeader === `Bearer ${password}`) {
    next();
  } else {
    res.status(401).json({ error: "Sesi admin tidak valid atau kata sandi salah." });
  }
}

// Log audit action helper
function logAudit(action: string, target: string, email = "admin@ringintunggal.go.id") {
  const dbData = readDB();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    admin_email: email,
    action,
    target,
    created_at: new Date().toISOString()
  };
  dbData.audit_logs.unshift(log);
  // Keep logs capped at 200 for size
  if (dbData.audit_logs.length > 200) {
    dbData.audit_logs = dbData.audit_logs.slice(0, 200);
  }
  writeDB(dbData);
}

// APIs
app.use("/api", async (req, res, next) => {
  try {
    console.log(`[API Request] Method: ${req.method}, Path: ${req.path}`);
    if (globalDB === null) {
      console.log("[API Middleware] globalDB is null, initializing...");
      if (isSupabaseConfigured()) {
        console.log("[API Middleware] Supabase is configured. Attempting to load...");
        try {
          globalDB = await loadFromSupabase();
          isConnectedToSupabase = true;
          isConnectedToSupabaseOnce = true;
          lastSupabaseError = null;
          console.log("[API Middleware] Successfully connected to Supabase and loaded database.");
        } catch (err: any) {
          console.error("[API Middleware] Failed to load from Supabase, falling back to local file:", err);
          globalDB = getLocalInitialDB();
          isConnectedToSupabase = false;
          lastSupabaseError = err?.message || String(err);
        }
      } else {
        console.log("[API Middleware] Supabase NOT configured. Loading local db.json...");
        globalDB = getLocalInitialDB();
        isConnectedToSupabase = false;
        lastSupabaseError = "Supabase configuration is missing or invalid in server environment variables.";
      }
    } else if (isSupabaseConfigured()) {
      isConnectedToSupabase = isConnectedToSupabaseOnce;
    }

    if (!globalDB) {
      throw new Error("Critical Error: globalDB is null after initialization attempts!");
    }

    // Intercept response to write back dirty database to Supabase before sending!
    const originalJson = res.json;
    res.json = async function (this: express.Response, body?: any) {
      if (dbDirty && globalDB && isSupabaseConfigured()) {
        console.log("[API Response Interceptor] Database is dirty, saving to Supabase...");
        try {
          await saveToSupabase(globalDB);
          dbDirty = false;
          console.log("[API Response Interceptor] Successfully saved dirty DB to Supabase.");
        } catch (err) {
          console.error("[API Response Interceptor] Failed to save to Supabase:", err);
        }
      }
      return originalJson.call(this, body);
    } as any;

    next();
  } catch (err: any) {
    console.error("[API Middleware] CRITICAL UNHANDLED ERROR:", err);
    next(err);
  }
});

app.get("/api/public/settings", (req, res) => {
  const dbData = readDB();
  // Don't send the password in public settings!
  const { admin_password, ...safeSettings } = dbData.settings;
  res.json(safeSettings);
});

app.get("/api/public/announcements", (req, res) => {
  const dbData = readDB();
  res.json(dbData.announcements.filter(a => a.active));
});

app.get("/api/public/employees", (req, res) => {
  const dbData = readDB();
  res.json(dbData.employees.filter(e => e.active));
});

// Helper: Calculate statistics for today
function getTodayStats() {
  const dbData = readDB();
  const today = getLocalDateString();
  const activeEmployees = dbData.employees.filter(e => e.active);
  const totalEmployees = activeEmployees.length;

  if (totalEmployees === 0) {
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      onDutyToday: 0,
      attendancePercentage: 0
    };
  }

  // Find attendance for today
  const todayAttendance = dbData.attendance.filter(a => a.attendance_date === today);
  
  // Counts
  let presentToday = 0;
  let onDutyToday = 0;
  let absentToday = 0;

  activeEmployees.forEach(emp => {
    const record = todayAttendance.find(a => a.employee_id === emp.id);
    if (record) {
      if (record.status === "Hadir") {
        presentToday++;
      } else if (record.status === "Sedang Bertugas") {
        onDutyToday++;
      } else if (record.status === "Cuti" || record.status === "Tugas Luar" || record.status === "Libur") {
        // Technically they aren't marked as "Belum Hadir" or "Hadir" normally but counts as present / active tasks
        presentToday++;
      }
    } else {
      absentToday++;
    }
  });

  const presentSum = presentToday + onDutyToday;
  const attendancePercentage = Math.round((presentSum / totalEmployees) * 100);

  return {
    totalEmployees,
    presentToday: presentSum,
    absentToday,
    onDutyToday,
    attendancePercentage
  };
}

app.get("/api/public/stats", (req, res) => {
  res.json({
    ...getTodayStats(),
    supabaseConnected: isConnectedToSupabase,
    supabaseError: lastSupabaseError
  });
});

app.get("/api/public/attendance/today", (req, res) => {
  const dbData = readDB();
  const today = getLocalDateString();
  const activeEmployees = dbData.employees.filter(e => e.active);
  
  const result = activeEmployees.map(emp => {
    const record = dbData.attendance.find(a => a.employee_id === emp.id && a.attendance_date === today);
    return {
      employee_id: emp.id,
      name: emp.name,
      position: emp.position,
      photo_url: emp.photo_url,
      record: record || {
        id: `virtual_${emp.id}`,
        employee_id: emp.id,
        attendance_date: today,
        checkin_time: "-",
        checkout_time: "-",
        total_minutes: 0,
        status: "Belum Hadir" as const
      }
    };
  });

  res.json(result);
});

app.get("/api/public/attendance/history", (req, res) => {
  const dbData = readDB();
  const { range, employeeId, startDate, endDate } = req.query;
  
  let filtered = [...dbData.attendance];

  if (employeeId && employeeId !== "all") {
    filtered = filtered.filter(a => a.employee_id === employeeId);
  }

  const todayStr = getLocalDateString();
  const today = new Date(todayStr);

  if (range && range !== "all") {
    if (range === "today") {
      filtered = filtered.filter(a => a.attendance_date === todayStr);
    } else if (range === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesStr = yesterday.toISOString().split("T")[0];
      filtered = filtered.filter(a => a.attendance_date === yesStr);
    } else if (range === "week") {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(a => new Date(a.attendance_date) >= oneWeekAgo);
    } else if (range === "month") {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filtered = filtered.filter(a => new Date(a.attendance_date) >= oneMonthAgo);
    } else if (range === "custom" && startDate && endDate) {
      filtered = filtered.filter(a => a.attendance_date >= (startDate as string) && a.attendance_date <= (endDate as string));
    }
  }

  // Attach employee data
  const result = filtered.map(a => {
    const emp = dbData.employees.find(e => e.id === a.employee_id);
    return {
      ...a,
      employee_name: emp ? emp.name : "Mantan Perangkat",
      employee_position: emp ? emp.position : "Jabatan",
      employee_photo: emp ? emp.photo_url : ""
    };
  }).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date) || b.checkin_time.localeCompare(a.checkin_time));

  res.json(result);
});

// DEVICE ATTENDANCE PROCESS
app.post("/api/attendance/checkin", (req, res) => {
  const { employeeId, latitude, longitude, deviceId } = req.body;
  if (!employeeId || latitude === undefined || longitude === undefined || !deviceId) {
    return res.status(400).json({ error: "Data checkin tidak lengkap." });
  }

  const dbData = readDB();
  const employee = dbData.employees.find(e => e.id === employeeId && e.active);
  if (!employee) {
    return res.status(404).json({ error: "Perangkat desa tidak ditemukan atau tidak aktif." });
  }

  const today = getLocalDateString();

  // Check if already checked in today
  const existingRecord = dbData.attendance.find(a => a.employee_id === employeeId && a.attendance_date === today);
  if (existingRecord) {
    return res.status(400).json({ error: "Anda sudah melakukan absen masuk hari ini." });
  }

  // Validate geofence
  const officeLat = dbData.settings.office_latitude;
  const officeLng = dbData.settings.office_longitude;
  const radius = dbData.settings.radius_geofence;
  const distance = haversineDistance(latitude, longitude, officeLat, officeLng);

  if (distance > radius) {
    return res.status(400).json({ 
      error: `Anda berada di luar area Balai Desa Ringintunggal (Jarak: ${Math.round(distance)}m). Silakan melakukan absensi dari kantor desa.` 
    });
  }

  // Validate device session lock
  const lockedSession = dbData.device_sessions.find(s => s.device_id === deviceId && s.status === "locked");
  if (lockedSession && lockedSession.employee_id !== employeeId) {
    return res.status(400).json({ 
      error: `Perangkat ini sedang dikunci oleh sesi absensi milik ${lockedSession.employee_name}. Mohon gunakan perangkat lain atau hubungi admin.` 
    });
  }

  // Prevent employee from checking in if they are already checked in on another device
  const employeeSession = dbData.device_sessions.find(s => s.employee_id === employeeId && s.status === "locked");
  if (employeeSession) {
    return res.status(400).json({ 
      error: `Anda sudah checkin di perangkat lain. Mohon lakukan checkout terlebih dahulu.` 
    });
  }

  // Create attendance record
  const now = new Date();
  // WIB Time (UTC+7)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wibTime = new Date(utc + 3600000 * 7);
  const timeString = wibTime.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  const newRecord: Attendance = {
    id: `att_${Date.now()}`,
    employee_id: employeeId,
    attendance_date: today,
    checkin_time: timeString,
    checkout_time: null,
    total_minutes: 0,
    checkin_latitude: latitude,
    checkin_longitude: longitude,
    checkout_latitude: null,
    checkout_longitude: null,
    checkin_distance: parseFloat(distance.toFixed(1)),
    checkout_distance: null,
    status: "Sedang Bertugas",
    created_at: now.toISOString()
  };

  dbData.attendance.push(newRecord);

  // Lock device session
  const newSession: DeviceSession = {
    id: `ds_${Date.now()}`,
    device_id: deviceId,
    employee_id: employeeId,
    employee_name: employee.name,
    checkin_time: now.toISOString(),
    status: "locked"
  };
  dbData.device_sessions.push(newSession);

  writeDB(dbData);
  res.json({ message: "Absen masuk berhasil dilakukan! Selamat bekerja.", record: newRecord });
});

app.post("/api/attendance/checkout", (req, res) => {
  const { employeeId, latitude, longitude, deviceId } = req.body;
  if (!employeeId || latitude === undefined || longitude === undefined || !deviceId) {
    return res.status(400).json({ error: "Data checkout tidak lengkap." });
  }

  const dbData = readDB();
  const today = getLocalDateString();

  // Find attendance record
  const record = dbData.attendance.find(a => a.employee_id === employeeId && a.attendance_date === today);
  if (!record) {
    return res.status(404).json({ error: "Data absen masuk hari ini tidak ditemukan. Silakan absen masuk terlebih dahulu." });
  }
  if (record.status === "Hadir") {
    return res.status(400).json({ error: "Anda sudah melakukan absen pulang hari ini." });
  }

  // Validate geofence
  const officeLat = dbData.settings.office_latitude;
  const officeLng = dbData.settings.office_longitude;
  const radius = dbData.settings.radius_geofence;
  const distance = haversineDistance(latitude, longitude, officeLat, officeLng);

  if (distance > radius) {
    return res.status(400).json({ 
      error: `Anda berada di luar area Balai Desa Ringintunggal (Jarak: ${Math.round(distance)}m). Silakan melakukan absensi dari kantor desa.` 
    });
  }

  // Validate device session lock
  const lockedSession = dbData.device_sessions.find(s => s.device_id === deviceId && s.status === "locked");
  if (lockedSession && lockedSession.employee_id !== employeeId) {
    return res.status(400).json({ 
      error: `Perangkat ini terkunci untuk absensi ${lockedSession.employee_name}.` 
    });
  }

  // Calculate times
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wibTime = new Date(utc + 3600000 * 7);
  const timeString = wibTime.toTimeString().split(" ")[0].substring(0, 5); // HH:MM

  // Parse check-in and check-out to calculate total minutes
  const [inH, inM] = record.checkin_time.split(":").map(Number);
  const [outH, outM] = timeString.split(":").map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);

  record.checkout_time = timeString;
  record.checkout_latitude = latitude;
  record.checkout_longitude = longitude;
  record.checkout_distance = parseFloat(distance.toFixed(1));
  record.total_minutes = totalMinutes > 0 ? totalMinutes : 0;
  record.status = "Hadir";

  // Release device session(s) for this employee/device
  dbData.device_sessions = dbData.device_sessions.filter(
    s => !(s.employee_id === employeeId || s.device_id === deviceId)
  );

  writeDB(dbData);
  res.json({ message: "Absen pulang berhasil dilakukan! Terima kasih atas dedikasi Anda.", record });
});

// ADMIN AUTH
app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    console.log(`[Login Attempt] Received login request for email: ${email}`);
    
    if (!password) {
      console.warn("[Login Attempt] Password input is missing.");
      return res.status(400).json({ error: "Kata sandi tidak boleh kosong." });
    }

    const dbData = readDB();
    if (!dbData) {
      console.error("[Login Attempt] dbData is null or undefined.");
      return res.status(500).json({ error: "Database tidak terinisialisasi." });
    }
    
    // Ensure settings exists
    if (!dbData.settings) {
      console.log("[Login Attempt] settings is missing in database, initializing default settings...");
      dbData.settings = {
        office_latitude: -7.161048,
        office_longitude: 111.725902,
        radius_geofence: 50,
        jam_masuk_mulai: "06:00",
        jam_masuk_normal_berakhir: "08:00",
        jam_pulang_minimal: "12:00",
        jam_pulang_maksimal: "20:00",
        toleransi_keterlambatan: 15,
        admin_password: "admindesa"
      };
      writeDB(dbData);
    }
    
    const correctPassword = dbData.settings.admin_password || "admindesa";

    if (password === correctPassword) {
      console.log("[Login Attempt] Login successful!");
      res.json({ token: correctPassword, email: email || "admin@ringintunggal.go.id" });
    } else {
      console.warn("[Login Attempt] Incorrect password entered.");
      res.status(400).json({ error: "Kata sandi admin salah." });
    }
  } catch (error: any) {
    console.error("[Login Attempt] Exception caught:", error);
    res.status(500).json({ error: `Gagal memproses login: ${error?.message || error}` });
  }
});

app.post("/api/admin/reset-password-default", (req, res) => {
  try {
    const dbData = readDB();
    if (!dbData) {
      return res.status(500).json({ error: "Database tidak terinisialisasi." });
    }
    
    if (!dbData.settings) {
      dbData.settings = {
        office_latitude: -7.161048,
        office_longitude: 111.725902,
        radius_geofence: 50,
        jam_masuk_mulai: "06:00",
        jam_masuk_normal_berakhir: "08:00",
        jam_pulang_minimal: "12:00",
        jam_pulang_maksimal: "20:00",
        toleransi_keterlambatan: 15,
        admin_password: "admindesa"
      };
    } else {
      dbData.settings.admin_password = "admindesa";
    }
    
    // Write back and mark dirty to sync to Supabase
    writeDB(dbData);
    
    res.json({ message: "Kata sandi admin berhasil direset kembali ke 'admindesa'. Silakan login menggunakan password default tersebut." });
  } catch (error: any) {
    console.error("Error in reset password endpoint:", error);
    res.status(500).json({ error: `Gagal mereset kata sandi: ${error?.message || error}` });
  }
});

// ADMIN - MANAGE EMPLOYEES
app.get("/api/admin/employees", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.employees);
});

app.post("/api/admin/employees", requireAdmin, (req, res) => {
  const { name, position, phone, photo_url } = req.body;
  if (!name || !position) {
    return res.status(400).json({ error: "Nama dan Jabatan wajib diisi." });
  }

  const dbData = readDB();
  const newEmp: Employee = {
    id: `emp_${Date.now()}`,
    name,
    position,
    phone: phone || "-",
    photo_url: photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    active: true,
    created_at: new Date().toISOString()
  };

  dbData.employees.push(newEmp);
  writeDB(dbData);
  logAudit(`Menambah Perangkat Desa: ${name}`, "Perangkat Desa");
  res.json(newEmp);
});

app.put("/api/admin/employees/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, position, phone, photo_url, active } = req.body;

  const dbData = readDB();
  const empIndex = dbData.employees.findIndex(e => e.id === id);
  if (empIndex === -1) {
    return res.status(404).json({ error: "Perangkat desa tidak ditemukan." });
  }

  const currentEmp = dbData.employees[empIndex];
  dbData.employees[empIndex] = {
    ...currentEmp,
    name: name !== undefined ? name : currentEmp.name,
    position: position !== undefined ? position : currentEmp.position,
    phone: phone !== undefined ? phone : currentEmp.phone,
    photo_url: photo_url !== undefined ? photo_url : currentEmp.photo_url,
    active: active !== undefined ? active : currentEmp.active,
  };

  writeDB(dbData);
  logAudit(`Mengubah Perangkat Desa: ${currentEmp.name}`, "Perangkat Desa");
  res.json(dbData.employees[empIndex]);
});

app.delete("/api/admin/employees/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  const emp = dbData.employees.find(e => e.id === id);
  if (!emp) {
    return res.status(404).json({ error: "Perangkat desa tidak ditemukan." });
  }

  // Deactivate or soft-delete instead of hard-delete to keep attendance history intact!
  emp.active = false;
  writeDB(dbData);
  logAudit(`Menonaktifkan Perangkat Desa: ${emp.name}`, "Perangkat Desa");
  res.json({ message: `Perangkat desa ${emp.name} berhasil dinonaktifkan.` });
});

// ADMIN - SETTINGS
app.get("/api/admin/settings", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.settings);
});

app.post("/api/admin/settings", requireAdmin, (req, res) => {
  const newSettings = req.body;
  const dbData = readDB();

  dbData.settings = {
    ...dbData.settings,
    ...newSettings,
    updated_at: new Date().toISOString()
  };

  writeDB(dbData);
  logAudit("Mengubah Pengaturan Sistem", "Pengaturan");
  res.json(dbData.settings);
});

// ADMIN - HOLIDAYS
app.get("/api/admin/holidays", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.holidays);
});

app.post("/api/admin/holidays", requireAdmin, (req, res) => {
  const { holiday_date, holiday_name, holiday_type } = req.body;
  if (!holiday_date || !holiday_name) {
    return res.status(400).json({ error: "Tanggal dan Nama libur wajib diisi." });
  }

  const dbData = readDB();
  const newHoliday: Holiday = {
    id: `hol_${Date.now()}`,
    holiday_date,
    holiday_name,
    holiday_type: holiday_type || "desa"
  };

  dbData.holidays.push(newHoliday);
  writeDB(dbData);
  logAudit(`Menambah Hari Libur: ${holiday_name}`, "Hari Libur");
  res.json(newHoliday);
});

app.delete("/api/admin/holidays/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  const holiday = dbData.holidays.find(h => h.id === id);
  if (!holiday) {
    return res.status(404).json({ error: "Hari libur tidak ditemukan." });
  }

  dbData.holidays = dbData.holidays.filter(h => h.id !== id);
  writeDB(dbData);
  logAudit(`Menghapus Hari Libur: ${holiday.holiday_name}`, "Hari Libur");
  res.json({ message: "Hari libur berhasil dihapus." });
});

// ADMIN - ANNOUNCEMENTS
app.get("/api/admin/announcements", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.announcements);
});

app.post("/api/admin/announcements", requireAdmin, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Judul dan Konten pengumuman wajib diisi." });
  }

  const dbData = readDB();
  const newAnn: Announcement = {
    id: `ann_${Date.now()}`,
    title,
    content,
    active: true,
    created_at: new Date().toISOString()
  };

  dbData.announcements.unshift(newAnn);
  writeDB(dbData);
  logAudit(`Membuat Pengumuman: ${title}`, "Pengumuman");
  res.json(newAnn);
});

app.put("/api/admin/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, content, active } = req.body;

  const dbData = readDB();
  const annIndex = dbData.announcements.findIndex(a => a.id === id);
  if (annIndex === -1) {
    return res.status(404).json({ error: "Pengumuman tidak ditemukan." });
  }

  const currentAnn = dbData.announcements[annIndex];
  dbData.announcements[annIndex] = {
    ...currentAnn,
    title: title !== undefined ? title : currentAnn.title,
    content: content !== undefined ? content : currentAnn.content,
    active: active !== undefined ? active : currentAnn.active,
  };

  writeDB(dbData);
  logAudit(`Mengubah Pengumuman: ${currentAnn.title}`, "Pengumuman");
  res.json(dbData.announcements[annIndex]);
});

app.delete("/api/admin/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  const ann = dbData.announcements.find(a => a.id === id);
  if (!ann) {
    return res.status(404).json({ error: "Pengumuman tidak ditemukan." });
  }

  dbData.announcements = dbData.announcements.filter(a => a.id !== id);
  writeDB(dbData);
  logAudit(`Menghapus Pengumuman: ${ann.title}`, "Pengumuman");
  res.json({ message: "Pengumuman berhasil dihapus." });
});

// ADMIN - DEVICE SESSIONS
app.get("/api/admin/device_sessions", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.device_sessions);
});

app.post("/api/admin/device_sessions/reset", requireAdmin, (req, res) => {
  const { employeeId, deviceId } = req.body;
  const dbData = readDB();

  let targetName = "Sesi Perangkat";
  if (employeeId) {
    const emp = dbData.employees.find(e => e.id === employeeId);
    if (emp) targetName = `Sesi ${emp.name}`;
    dbData.device_sessions = dbData.device_sessions.filter(s => s.employee_id !== employeeId);
  } else if (deviceId) {
    dbData.device_sessions = dbData.device_sessions.filter(s => s.device_id !== deviceId);
  } else {
    // Reset all
    dbData.device_sessions = [];
    targetName = "Semua Sesi Perangkat";
  }

  writeDB(dbData);
  logAudit(`Mereset ${targetName}`, "Sesi Perangkat");
  res.json({ message: `${targetName} berhasil di-reset dan dilepas.` });
});

// ADMIN - CORRECTION & MANUAL ATTENDANCE
app.post("/api/admin/attendance/correct", requireAdmin, (req, res) => {
  const { employee_id, attendance_date, checkin_time, checkout_time, status, reason } = req.body;
  if (!employee_id || !attendance_date || !status) {
    return res.status(400).json({ error: "ID Perangkat, Tanggal, dan Status wajib ditentukan." });
  }

  const dbData = readDB();
  const employee = dbData.employees.find(e => e.id === employee_id);
  if (!employee) {
    return res.status(404).json({ error: "Perangkat desa tidak ditemukan." });
  }

  // Find existing record for that date
  let record = dbData.attendance.find(a => a.employee_id === employee_id && a.attendance_date === attendance_date);
  
  let totalMinutes = 0;
  if (checkin_time && checkout_time) {
    const [inH, inM] = checkin_time.split(":").map(Number);
    const [outH, outM] = checkout_time.split(":").map(Number);
    totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes = 0;
  }

  if (record) {
    // Update
    record.checkin_time = checkin_time || record.checkin_time;
    record.checkout_time = checkout_time || record.checkout_time;
    record.status = status;
    record.total_minutes = totalMinutes || record.total_minutes;
  } else {
    // Create new
    record = {
      id: `att_${Date.now()}`,
      employee_id,
      attendance_date,
      checkin_time: checkin_time || "07:00",
      checkout_time: checkout_time || null,
      total_minutes: totalMinutes,
      checkin_latitude: dbData.settings.office_latitude,
      checkin_longitude: dbData.settings.office_longitude,
      checkout_latitude: checkout_time ? dbData.settings.office_latitude : null,
      checkout_longitude: checkout_time ? dbData.settings.office_longitude : null,
      checkin_distance: 0,
      checkout_distance: checkout_time ? 0 : null,
      status,
      created_at: new Date().toISOString()
    };
    dbData.attendance.push(record);
  }

  writeDB(dbData);
  logAudit(`Koreksi Absensi ${employee.name} tgl ${attendance_date}: ${status} (${reason || 'tanpa alasan'})`, "Absensi");
  res.json(record);
});

// ADMIN - AUDIT LOGS
app.get("/api/admin/audit_logs", requireAdmin, (req, res) => {
  const dbData = readDB();
  res.json(dbData.audit_logs);
});

// GLOBAL ERROR HANDLER MIDDLEWARE
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("=== GLOBAL SERVER ERROR ===");
  console.error(`Method: ${req.method} | URL: ${req.url}`);
  console.error(`Message: ${err?.message || err}`);
  console.error(`Stack: ${err?.stack || "No stack trace available"}`);
  console.error("===========================");
  
  res.status(500).json({
    error: "Terjadi kesalahan internal server (Global Server Error).",
    message: err?.message || String(err),
    stack: err?.stack,
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Initialize DB seeding on server startup
try {
  readDB();
} catch (err) {
  console.error("Gagal memuat awal database:", err);
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
