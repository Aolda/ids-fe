// src/lib/backendAPI.ts
// IDS 백엔드(POST /api/v1/plans)와 통신하는 예측 클라이언트.
// 구 MCP backend_api(/api/predict)에서 IDS로 마이그레이션됨 — IDS 응답을 기존 PredictResponse
// shape 로 어댑팅해 UI(Predict.tsx / DeploymentSummaryDialog) 변경을 최소화한다.

import { BACKEND_API_BASE_URL } from "./config";
import { fetchWithTimeout } from "./http";

export interface PredictGithubInfo {
  full_name?: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
}

export interface PredictExtractedContext {
  service_type: string;
  expected_users: number;
  time_slot: string;
  runtime_env?: string;
  curr_cpu: number;
  curr_mem: number;
  reasoning?: string;
}

export interface PredictRecommendations {
  flavor?: string | null;
  cost_per_day?: number | null;
  notes?: string | null;
}

export interface PredictResponse {
  success: boolean;
  github_info: PredictGithubInfo;
  extracted_context: PredictExtractedContext;
  predictions: { values_24h?: number[]; [key: string]: unknown };
  recommendations: PredictRecommendations;
  // --- IDS 신규 필드(선택) — 자동배포 게이트/되묻기 UX 에 사용 가능 ---
  automation_mode?: string; // auto | manual | block
  extraction_status?: string; // complete | partial | needs_user_input | insufficient
  context_confidence?: number;
  missing_fields?: string[];
  question?: string | null;
  predictions_24h?: number[];
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMessage = "요청에 실패했습니다.";
    try {
      const errorData = await res.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = res.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

// IDS /api/v1/plans 응답 → 기존 PredictResponse shape 로 어댑팅.
// IDS 는 cold-start 시 expected_users/curr_* 를 null 로 줄 수 있어 방어값(0)으로 매핑한다
// (DeploymentSummaryDialog 가 expected_users.toLocaleString() 을 호출 → null 이면 크래시).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 백엔드 원시 JSON 어댑터 경계
const adaptPlanToPredict = (plan: any): PredictResponse => {
  const ctx = plan?.mcp_context ?? {};
  const meta = plan?.repository_metadata ?? {};
  const reasons: string[] = Array.isArray(plan?.flavor_reasons) ? plan.flavor_reasons : [];
  const reasonText = reasons.length ? reasons.join(" · ") : undefined;

  return {
    success: true,
    github_info: {
      full_name: meta.full_name,
      description: meta.description,
      language: meta.language,
      stars: meta.stars,
      forks: meta.forks,
    },
    extracted_context: {
      service_type: ctx.service_type ?? "web",
      expected_users: ctx.expected_users ?? 0,
      time_slot: ctx.time_slot ?? "normal",
      runtime_env: ctx.runtime_env,
      curr_cpu: ctx.curr_cpu ?? 0,
      curr_mem: ctx.curr_mem ?? 0,
      reasoning: plan?.question ?? plan?.notes ?? reasonText,
    },
    predictions: { values_24h: plan?.predictions_24h ?? [] },
    recommendations: {
      flavor: plan?.recommended_flavor ?? null,
      cost_per_day: plan?.expected_cost_per_day ?? null,
      notes: reasonText ?? null,
    },
    automation_mode: plan?.automation_mode,
    extraction_status: plan?.extraction_status,
    context_confidence: plan?.context_confidence,
    missing_fields: plan?.missing_fields,
    question: plan?.question ?? null,
    predictions_24h: plan?.predictions_24h,
  };
};

export const backendApi = {
  // 자연어 + GitHub URL → IDS POST /api/v1/plans (예측 + flavor 추천).
  // 호출 시그니처는 유지(user_input) — 내부에서 IDS 필드명(natural_language)으로 매핑한다.
  predictWithNaturalLanguage: async (params: {
    github_url: string;
    user_input: string;
  }): Promise<PredictResponse> => {
    // 예측은 LLM(intent 파싱)을 거치므로 조금 넉넉히(25s).
    const res = await fetchWithTimeout(`${BACKEND_API_BASE_URL}/api/v1/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        github_url: params.github_url,
        natural_language: params.user_input,
      }),
    }, 25000);
    const plan = await handleResponse(res);
    return adaptPlanToPredict(plan);
  },
};
