import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client } = body;
  if (!client) return NextResponse.json({ error: "client data required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  if (!apiKey) return NextResponse.json({ error: "API key missing" }, { status: 500 });

  // 업종별 동종업계 데이터
  const industryData: Record<string, { market: string; trend: string; competition: string; outlook: string }> = {
    "음식점/카페": {
      market: "국내 외식업 시장 규모 약 180조 원(2025년 기준). 배달앱 기반 온라인 주문 비중 35% 돌파.",
      trend: "건강식·간편식 수요 증가, 1인 가구 타겟 소용량 메뉴 트렌드, 키오스크·로봇 배달 자동화 확산.",
      competition: "폐업률 업종 최고 수준(연간 약 25~30%). 프랜차이즈와 1인 소규모 점포 간 양극화 심화.",
      outlook: "고물가·배달비 상승으로 수익성 악화 지속. 브랜드화·전문성·독특한 컨셉 차별화 업소 생존 유리.",
    },
    "도소매업": {
      market: "국내 소매업 시장 약 560조 원. 이커머스 점유율 30% 초과, 오프라인 소매 매출 감소세 지속.",
      trend: "옴니채널 전략(온·오프 병행), 라이브커머스 성장, 새벽배송·당일배송 물류 경쟁 심화.",
      competition: "쿠팡·네이버·카카오 등 플랫폼 공룡 vs 전문 카테고리 소매점 경쟁. 가격 경쟁보다 큐레이션·경험 차별화 중요.",
      outlook: "오프라인 단독 운영은 위기. 온라인 병행·SNS 마케팅·구독 모델 도입 여부가 생존 핵심 변수.",
    },
    "서비스업": {
      market: "서비스업 GDP 기여도 60% 이상. 인적 서비스 노동집약 구조로 인건비 상승 압박 지속.",
      trend: "비대면·디지털 서비스 전환 가속, 구독경제 모델 확산, AI 기반 서비스 자동화 시작.",
      competition: "진입장벽 낮아 경쟁 과열. 전문 자격·브랜드 신뢰도·고객 충성도가 핵심 경쟁력.",
      outlook: "AI·자동화 도입으로 인건비 절감 가능한 업체 유리. 고부가가치 전문 서비스로 포지셔닝 필요.",
    },
    "제조업": {
      market: "중소 제조업 생산액 약 650조 원. 수출 의존도 높아 환율·글로벌 경기 변동 직접 영향.",
      trend: "스마트공장 보급 확대(정부 2026년까지 3만 개 목표), ESG 경영·탄소중립 대응 의무화 강화.",
      competition: "원자재 가격·에너지 비용 급등으로 원가 압박. 대기업 납품 의존도 높은 구조 취약성 존재.",
      outlook: "스마트공장·자동화 투자 업체는 경쟁력 상승. 소재·부품·장비(소부장) 분야 정책 지원 활발.",
    },
    "건설업": {
      market: "건설업 수주액 2025년 약 280조 원. 공공 인프라·신재생에너지 시설 공사 증가.",
      trend: "모듈러 건축·BIM 디지털화, 탄소중립 친환경 건축 의무화, 리모델링 시장 성장.",
      competition: "원자재(철근·시멘트) 가격 급등으로 수익성 악화. 소규모 건설사 도산 위험 증가.",
      outlook: "GTX·신도시 개발 등 공공 인프라 발주 지속. 에너지 효율·그린 리모델링 전문성 보유 업체 유망.",
    },
    "IT/소프트웨어": {
      market: "국내 IT 서비스 시장 약 15조 원(2025년). SaaS·클라우드 전환 수요 폭발적 증가.",
      trend: "생성형 AI 서비스 통합, 마이크로서비스 아키텍처, 보안·개인정보 규제 강화.",
      competition: "글로벌 빅테크(AWS, Azure, Google) 클라우드 시장 지배. 국내 중소 IT기업은 버티컬 SaaS로 차별화.",
      outlook: "AI 역량 보유 기업 밸류에이션 급등. 인재 확보 경쟁 심화로 인건비 상승 지속.",
    },
    "교육": {
      market: "사교육 시장 약 26조 원(2025년 통계청 기준). 온라인 교육 플랫폼 성장세 지속.",
      trend: "AI 개인화 학습, 성인 평생교육 수요 증가, 직업·기술 교육 니즈 확대.",
      competition: "대형 에듀테크 플랫폼(클래스101, 클래스유 등)과 전통 학원 간 경쟁. 소규모 전문 교육 틈새시장 존재.",
      outlook: "저출산으로 K-12 사교육 시장 장기 축소 예상. 성인 직무교육·AI 활용 개인화 콘텐츠로 전환 필요.",
    },
    "의료/헬스케어": {
      market: "디지털 헬스케어 시장 2026년 5조 원 예상. 원격진료 제도화 논의 본격화.",
      trend: "웨어러블 건강 모니터링, 예방의학·건강관리 서비스, 고령화 관련 케어 수요 급증.",
      competition: "대형 의료법인과 동네 의원 간 격차 심화. 전문 클리닉·특화 서비스로 차별화 필요.",
      outlook: "고령사회 진입으로 헬스케어 수요 구조적 증가. 디지털 전환·원격진료 대응 여부가 중장기 경쟁력 결정.",
    },
    "부동산": {
      market: "부동산 중개업 약 10만 개 사업체. 고금리 영향으로 거래량 2022년 대비 40% 감소.",
      trend: "프롭테크 플랫폼(직방·다방) 성장, AI 가격 예측 서비스 확산, 임대관리 통합 서비스 수요 증가.",
      competition: "대형 프랜차이즈 중개법인과 개인 공인중개사 경쟁. 정보 비대칭 감소로 단순 중개 수수료 압박.",
      outlook: "2026년 하반기 금리 인하 시 거래 회복 기대. 투자 자문·자산관리 고부가 서비스로 업그레이드 필요.",
    },
  };

  const bizType = client.businessType || "";
  const industryInfo = industryData[bizType] || {
    market: `${bizType || "해당 업종"} 시장은 지속적인 변화 속에서 디지털 전환과 경쟁 심화가 진행 중입니다.`,
    trend: "비대면·온라인 전환, AI 활용 효율화, 지속가능경영 트렌드가 전 업종에 걸쳐 확산되고 있습니다.",
    competition: "진입장벽 변화와 플랫폼 기반 경쟁자 등장으로 기존 사업 모델 재검토가 필요한 시점입니다.",
    outlook: "전문성·차별화·디지털 역량을 갖춘 사업체의 경쟁력이 강화되는 방향으로 시장이 재편될 전망입니다.",
  };

  const prompt = `당신은 소상공인·중소기업 전문 컨설턴트 겸 산업 분석가입니다.
아래 고객 정보와 동종업계 데이터를 바탕으로 심층적인 AI 기업 분석 보고서를 작성해주세요.

## 고객 정보
- 이름: ${client.name}
- 업종: ${client.businessType || "미입력"}
- 업력: ${client.businessPeriod || "미입력"}
- 연매출: ${client.annual_revenue ? Number(client.annual_revenue).toLocaleString() + "원" : "미입력"}
- NICE신용점수: ${client.nice_score || "미입력"}
- KCB신용점수: ${client.kcb_score || "미입력"}
- 현재 기대출 합계: ${client.currentDebt ? Number(client.currentDebt).toLocaleString() + "원" : "0원"}
- 희망 대출금액: ${client.desiredAmount ? Number(client.desiredAmount).toLocaleString() + "원" : "미입력"}
- SOHO 신용등급: ${client.grade || "미산출"} 등급
- 담당 매니저: ${client.assignedName || "미배정"}

## 동종업계 현황 데이터 (${bizType || "해당 업종"})
- 시장 규모·현황: ${industryInfo.market}
- 최신 트렌드: ${industryInfo.trend}
- 경쟁 환경: ${industryInfo.competition}
- 향후 전망: ${industryInfo.outlook}

## 추천 가능 정책자금
${client.funds && client.funds.length > 0
  ? client.funds.map((f: {name:string; maxAmount:string|number; interestRate:string; category:string}) =>
    `- ${f.name}: 최대 ${Number(f.maxAmount).toLocaleString()}원, 금리 ${f.interestRate}, 분류: ${f.category}`
  ).join("\n")
  : "현재 조건에 맞는 추천 정책자금 없음 (신용점수 또는 매출 조건 미충족)"}

---

아래 형식으로 전문적이고 실용적인 한국어 보고서를 작성해주세요.
각 섹션을 충실하게 작성하되, 고객의 실제 데이터를 반드시 반영하세요.

# 📊 AI 기업 분석 보고서

## 1. 경영 현황 요약
(고객의 업종, 업력, 매출, 신용 상태를 종합하여 현재 경영 상황을 3~4문장으로 요약)

## 2. 동종업계 시장 분석
(위에 제공된 동종업계 데이터를 바탕으로 현재 시장 환경, 주요 트렌드, 경쟁 구도를 구체적으로 분석. 고객이 이 시장에서 차지하는 위치 평가)

## 3. SWOT 분석

**💪 강점 (Strengths)**
- (고객의 실제 데이터 기반 강점 3~4가지)

**⚠️ 약점 (Weaknesses)**
- (개선이 필요한 부분 3~4가지, 수치 근거 포함)

**🚀 기회 (Opportunities)**
- (시장 환경·정책 기반 기회 3~4가지)

**🔴 위협 (Threats)**
- (외부 환경·경쟁 위협 요인 3~4가지)

## 4. SOHO 신용등급 분석
(${client.grade}등급 판정 근거, 현재 점수에 영향을 미친 요소 분석, 등급 상향을 위한 구체적 실행 방법)

## 5. 향후 사업 전망
(단기 6개월, 중기 1~2년 관점의 전망. 업계 트렌드와 고객 상황을 결합하여 구체적으로 서술. 성장 시나리오와 리스크 시나리오 함께 제시)

## 6. 정책자금 활용 전략
(추천 자금별 신청 전략, 우선순위, 주의사항을 실무적으로 제시)

## 7. 컨설팅 액션플랜
(즉시 실행(1개월 이내), 단기 실행(3개월), 중기 실행(6~12개월)으로 구분하여 우선순위별 실행 계획 제시)

## 8. 종합 의견
(전문 컨설턴트 관점의 핵심 권고사항 3가지와 최종 의견)`;

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
        max_tokens: 3500,
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
