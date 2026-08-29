import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, false);
        return;
      }
      const replitDomains = (process.env["REPLIT_DOMAINS"] ?? "").split(",").map(d => `https://${d.trim()}`).filter(Boolean);
      const trusted =
        replitDomains.some(d => origin === d || origin.startsWith(d)) ||
        /\.replit\.dev$/.test(origin) ||
        /\.repl\.co$/.test(origin) ||
        origin === "http://localhost:5173";
      callback(null, trusted);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Trust Replit's reverse proxy so secure session cookies work on production
app.set("trust proxy", 1);

app.use("/api", router);

export default app;
