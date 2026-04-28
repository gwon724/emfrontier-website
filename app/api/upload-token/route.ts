import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "uploadTokens.json");

interface UploadToken {
  token: string;
  consultationId: string;
  name: string;
  phone: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

function readTokens(): UploadToken[] {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf-8")); } catch { return []; }
}

function writeTokens(tokens: UploadToken[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

// GET /api/upload-token?token=xxx → 검증
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false, error: "token required" });
  const tokens = readTokens();
  const t = tokens.find(t => t.token === token);
  if (!t) return NextResponse.json({ ok: false, error: "invalid" });
  if (new Date() > new Date(t.expiresAt)) return NextResponse.json({ ok: false, error: "expired" });
  return NextResponse.json({ ok: true, name: t.name, phone: t.phone, consultationId: t.consultationId });
}

// POST { action: "create", ... } | { action: "use", token }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const tokens = readTokens();

  if (body.action === "create") {
    const token = "up_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = new Date();
    const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const t: UploadToken = {
      token, consultationId: body.consultationId, name: body.name, phone: body.phone,
      createdAt: now.toISOString(), expiresAt: expires.toISOString(), used: false,
    };
    tokens.push(t);
    writeTokens(tokens);
    return NextResponse.json({ ok: true, token });
  }

  if (body.action === "use") {
    const idx = tokens.findIndex(t => t.token === body.token);
    if (idx !== -1) { tokens[idx].used = true; writeTokens(tokens); }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "unknown action" });
}
