export default async function handler(req: any, res: any) {
  try {
    const serverModule = await import("../server");
    const app = serverModule.default;
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: `Gagal Memuat Server (Dynamic Import Error): ${err?.message || err}\nStack: ${err?.stack || ""}`,
      message: err?.message || String(err),
      stack: err?.stack,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
        HAS_SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      }
    });
  }
}

