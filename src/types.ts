export interface Employee {
  id: string;
  name: string;
  position: string;
  phone: string;
  photo_url: string;
  active: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string; // YYYY-MM-DD
  checkin_time: string; // HH:MM
  checkout_time: string | null; // HH:MM
  total_minutes: number;
  checkin_latitude: number;
  checkin_longitude: number;
  checkout_latitude: number | null;
  checkout_longitude: number | null;
  checkin_distance: number;
  checkout_distance: number | null;
  status: 'Hadir' | 'Sedang Bertugas' | 'Belum Hadir' | 'Checkout Terlewat' | 'Cuti' | 'Tugas Luar' | 'Libur';
  created_at: string;
}

export interface SystemSettings {
  office_latitude: number;
  office_longitude: number;
  radius_geofence: number; // in meters
  jam_masuk_mulai: string; // HH:MM
  jam_masuk_normal_berakhir: string; // HH:MM
  jam_pulang_minimal: string; // HH:MM
  jam_pulang_maksimal: string; // HH:MM
  toleransi_keterlambatan: number; // in minutes
  admin_password?: string; // stored securely
}

export interface Holiday {
  id: string;
  holiday_date: string; // YYYY-MM-DD
  holiday_name: string;
  holiday_type: 'nasional' | 'cuti_bersama' | 'desa';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_email: string;
  action: string;
  target: string;
  created_at: string;
}

export interface DeviceSession {
  id: string;
  device_id: string;
  employee_id: string;
  employee_name: string;
  checkin_time: string;
  status: 'locked' | 'released';
}

export interface PublicStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onDutyToday: number;
  attendancePercentage: number;
  supabaseConnected?: boolean;
  supabaseError?: string | null;
}
