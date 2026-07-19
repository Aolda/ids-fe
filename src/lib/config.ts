/**
 * API 설정 (IDS 백엔드 마이그레이션)
 *
 * IDS 백엔드는 **단일 origin**에서 모든 경로를 `/api/v1/*` 로 서빙한다(구 MCP의 8000/8001 포트
 * 이원화 없음). 따라서 세 base URL은 모두 같은 IDS origin을 가리킨다.
 *
 * 로컬 개발: 기본값 http://localhost:8000 (IDS uvicorn 단일 포트)
 * 프로덕션(Vercel): VITE_API_BASE_URL = IDS 백엔드 origin 하나만 설정하면
 *   DEPLOY/BACKEND base URL이 자동으로 이를 따른다.
 */

const PROD_DEFAULT_API = "https://api.launcha.cloud";
const PROD_DEFAULT_DEPLOY = "https://api.launcha.cloud";
const isProdEnv = Boolean(import.meta.env.PROD);
const isDev = !isProdEnv;

// MCP Core API URL (plans, auth 등 - 8000 포트)
// 로컬 개발: http://localhost:8000
// 프로덕션: VITE_API_BASE_URL → 없다면 현재 Origin(또는 api.launcha.cloud) 사용

// 프론트(Vercel)와 백엔드는 서로 다른 origin 이므로, 미설정 시 프론트 자기 origin 이 아니라
// 실제 백엔드 기본 도메인으로 폴백해야 대부분의 API 호출이 엉뚱한 호스트로 가지 않는다.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isDev ? "http://localhost:8000" : PROD_DEFAULT_API);

// MCP 배포 요청 전용 API URL (deploy_main - 8001 포트)
// 로컬 개발: http://localhost:8000
// 프로덕션: VITE_DEPLOY_API_BASE_URL → 없으면 api.launcha.cloud
export const DEPLOY_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isDev ? "http://localhost:8000" : PROD_DEFAULT_DEPLOY);

// 자연어 → MCPContext 변환을 담당하는 backend_api 서버 URL
// 로컬 개발: http://localhost:8000
// 프로덕션: VITE_BACKEND_API_BASE_URL → 없으면 API_BASE_URL과 동일한 Origin 사용
export const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL ||
  (isDev ? "http://localhost:8000" : API_BASE_URL);

// 프로덕션 환경에서 환경 변수 미설정 시 경고
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn('⚠️ VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다. EC2 IP/도메인을 설정해주세요.');
  }
  if (!import.meta.env.VITE_DEPLOY_API_BASE_URL) {
    console.warn('⚠️ VITE_DEPLOY_API_BASE_URL 환경 변수가 설정되지 않았습니다. EC2 IP/도메인을 설정해주세요.');
  }
  if (!import.meta.env.VITE_BACKEND_API_BASE_URL) {
    console.warn('⚠️ VITE_BACKEND_API_BASE_URL 환경 변수가 설정되지 않았습니다. backend_api URL을 설정해주세요.');
  }
}

// SSO(Keycloak) 연동 전까지 실제 로그인을 잠근다. 연동되면 true 로 바꾸면 로그인이 열린다.
// 그동안 사용자는 /demo 로 전체 흐름을 체험한다.
export const SSO_ENABLED: boolean = false;

// fetch 기본 타임아웃(ms). 백엔드가 죽어 있어도 20초씩 매달리지 않고 이 시간 안에 실패한다.
// 배포/예측처럼 오래 걸리는 호출은 호출부에서 더 큰 값을 넘긴다.
export const REQUEST_TIMEOUT_MS = 10000;

// 추가 설정이 필요한 경우 여기에 추가
export const config = {
  apiBaseUrl: API_BASE_URL,
  deployApiBaseUrl: DEPLOY_API_BASE_URL,
  // 다른 설정들...
};
