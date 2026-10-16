import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

// Middleware imports
import { apiLimiter, authLimiter } from "./src/server/middleware/rateLimit";

// Route imports
import authRoutes from "./src/server/routes/auth";
import profileRoutes from "./src/server/routes/profile";
import linkRoutes from "./src/server/routes/links";
import publicRoutes from "./src/server/routes/public";
import analyticsRoutes from "./src/server/routes/analytics";

// Firebase credential health check
import { checkFirebaseConnection } from "./src/server/firebaseAdmin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // ─── Step 1: Validate Firebase credentials BEFORE starting ──────────────
  // If service-account.json is revoked/invalid, this will print a clear
  // error message and crash immediately instead of silently failing later.
  console.log("🔥 Checking Firebase connection...");
  await checkFirebaseConnection();
  console.log("✅ Firebase connected successfully.");
  // ────────────────────────────────────────────────────────────────────────

  const app = express();
  const PORT = 3000;

  // Body parsing with size limit
  app.use(express.json({ limit: '1mb' }));

  // CORS — flexible in dev, restricted in production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const defaultOrigin = process.env.APP_URL || `http://localhost:${PORT}`;

    if (process.env.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', origin || defaultOrigin);
    } else {
      res.header('Access-Control-Allow-Origin', defaultOrigin);
    }

    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // API routes with rate limiting
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/profile", apiLimiter, profileRoutes);
  app.use("/api/links", apiLimiter, linkRoutes);
  app.use("/api/public", apiLimiter, publicRoutes);
  app.use("/api/analytics", apiLimiter, analyticsRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Global JSON error handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}


startServer().catch((err) => {
  // Print the error clearly and exit — don't let the server start in a broken state
  console.error(err.message);
  process.exit(1);
});
