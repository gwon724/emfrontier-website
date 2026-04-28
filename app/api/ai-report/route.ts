import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client } = body;
  if (!client) return NextResponse.json({ error: "client data required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  const prompt = `당신은 정책자금 전문 컨설턴트입니다. 아래 소상공인 고객 정보를 바탕으로 상세한 분석을 수행하고, 반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

## 고객 정보
- 이름: ${client.name}
- 성별/나이: ${client.gender || "미입력"} / ${client.age || "미입력"}세
- 업종: ${client.businessType || "미입력"}
- 업력: ${client.businessPeriod || "미입력"}
- 연매출: ${client.annual_revenue ? Number(client.annual_revenue).toLocaleString() + "원" : "미입력"}
- NICE신용점수: ${client.nice_score || "미입력"}
- KCB신용점수: ${client.kcb_score || "미입력"}
- 기대출 합계: ${client.currentDebt ? Number(client.currentDebt).toLocaleString() + "원" : "0원"}
- 희망금액: ${client.desiredAmount ? Number(client.desiredAmount).toLocaleString() + "원" : "미입력"}
- SOHO 등급: ${client.grade || "미산출"}
- 담당 매니저: ${client.assignedName || "미배정"}

## 가능한 정책자금
${client.funds && client.funds.length > 0
  ? client.funds.map((f: {name:string; maxAmount:string|number; interestRate:string; category:string}) =>
    `- ${f.name}: 최대 ${Number(f.maxAmount).toLocaleString()}원, 금리 ${f.interestRate}, 카테고리 ${f.category}`
  ).join("\n")
  : "해당 조건의 정책자금 없음"}

## 응답 JSON 형식 (이 형식 그대로, 한국어로 내용 채워서 반환)
{
  "grade": {
    "label": "SOHO 등급 한줄 요약 (예: A등급 · 최우수 · 75점)",
    "summary": "등급 상세 설명 2~3문장. 신용점수, 업력, 연매출 기반으로 왜 이 등급인지 설명.",
    "score": 75,
    "maxScore": 90,
    "recFundCount": 2,
    "maxPossibleAmount": "2억원 이상"
  },
  "swot": {
    "strengths": ["강점 항목1", "강점 항목2", "강점 항목3"],
    "weaknesses": ["약점 항목1", "약점 항목2"],
    "opportunities": ["기회 항목1", "기회 항목2", "기회 항목3"],
    "risks": ["리스크 항목1", "리스크 항목2"]
  },
  "actionPlan": [
    { "step": 1, "title": "즉시 실행 (1~2주)", "desc": "구체적인 행동 방안 설명", "priority": "high" },
    { "step": 2, "title": "단기 실행 (1개월)", "desc": "구체적인 행동 방안 설명", "priority": "medium" },
    { "step": 3, "title": "중기 실행 (3개월)", "desc": "구체적인 행동 방안 설명", "priority": "low" }
  ],
  "fundStrategy": [
    { "name": "자금명", "amount": "최대 XX억원", "strategy": "이 자금 신청 전략 및 주의사항", "probability": "높음" }
  ],
  "overallComment": "종합 의견 및 전문가 권고사항. 3~4문장으로 상세하게."
}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const rawText = await res.text();
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json({ error: "AI 응답이 비어있습니다" }, { status: 500 });
    }
    let data: { content?: Array<{text:string}>; error?: {message:string} };
    try { data = JSON.parse(rawText); } catch { return NextResponse.json({ error: "응답 파싱 오류: " + rawText.slice(0,200) }, { status: 500 }); }
    if (!res.ok) return NextResponse.json({ error: data.error?.message || "AI 오류" }, { status: 500 });
    const text = data.content?.[0]?.text || "";
    // JSON 파싱 시도
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ ok: true, structured: parsed });
      }
    } catch { /* fallback to text */ }
    return NextResponse.json({ ok: true, report: text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
