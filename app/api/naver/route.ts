import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ACCESS_LICENSE = process.env.NAVER_SA_ACCESS_LICENSE!;
const SECRET_KEY = process.env.NAVER_SA_SECRET_KEY!;
const CUSTOMER_ID = process.env.NAVER_SA_CUSTOMER_ID!;
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

function getNaverSAHeaders(method: string, path: string) {
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${method}.${path}`;
  const signature = crypto
    .createHmac("sha256", Buffer.from(SECRET_KEY, "utf8"))
    .update(message)
    .digest("base64");
  return {
    "X-Timestamp": timestamp,
    "X-API-KEY": ACCESS_LICENSE,
    "X-Customer": CUSTOMER_ID,
    "X-Signature": signature,
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "summary";

  try {
    if (type === "trend") {
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setMonth(start.getMonth() - 3);
      const startDate = start.toISOString().slice(0, 10);

      const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
        method: "POST",
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          timeUnit: "week",
          keywordGroups: [
            { groupName: "정책자금", keywords: ["정책자금"] },
            { groupName: "소상공인대출", keywords: ["소상공인대출"] },
            { groupName: "사업자대출", keywords: ["사업자대출"] },
          ],
        }),
      });
      const data = await res.json();
      return NextResponse.json({ ok: true, type: "trend", data });
    }

    if (type === "stat") {
      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      const startDate = start.toISOString().slice(0, 10);
      const path = `/stats?dateFrom=${startDate}&dateTo=${endDate}&timeUnit=day&fields=impCnt,clkCnt,salesAmt,ctr,cpc,avgRnk`;
      const res = await fetch(`https://api.naver.com${path}`, {
        headers: getNaverSAHeaders("GET", path),
      });
      const data = await res.json();
      return NextResponse.json({ ok: true, type: "stat", data });
    }

    if (type === "summary") {
      const path = "/ncc/campaigns";
      const res = await fetch(`https://api.naver.com${path}`, {
        headers: getNaverSAHeaders("GET", path),
      });
      const data = await res.json();
      return NextResponse.json({ ok: true, type: "campaigns", data });
    }

    return NextResponse.json({ ok: false, error: "unknown type" });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
