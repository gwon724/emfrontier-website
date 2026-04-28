import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client } = body;
  if (!client) return NextResponse.json({ error: "client data required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  const prompt = `당신은 정책자금 전문 컨설턴트입니다. 아래 소상공인 고객 정보를 바탕으로 전문적인 분석 보고서를 작성해주세요.

## 고객 정보
- 이름: ${client.name}
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

아래 형식으로 한국어 보고서를 작성해주세요. 각 섹션은 명확하게 구분하고 실용적인 내용으로 작성해주세요:

# 📋 고객 분석 보고서

## 1. 고객 현황 요약
(고객의 전반적인 사업 현황과 금융 상태를 2-3문장으로 요약)

## 2. SOHO 등급 분석
(등급 판정 이유, 점수에 영향을 미친 요소, 등급 개선 방법)

## 3. SWOT 분석
**강점 (Strengths)**
- 

**약점 (Weaknesses)**
- 

**기회 (Opportunities)**
- 

**위협 (Threats)**
- 

## 4. 추천 정책자금 분석
(가능한 자금별 신청 전략과 주의사항)

## 5. 컨설팅 액션플랜
(우선순위별 단계적 실행 계획, 구체적인 일정 포함)

## 6. 종합 의견
(전문가 의견 및 최종 권고사항)`;

  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error?.message || "AI 오류" }, { status: 500 });
    const text = data.content?.[0]?.text || "";
    return NextResponse.json({ ok: true, report: text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
