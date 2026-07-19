# launcha — Frontend (ids-fe)

GitHub 주소와 한 문장이면 리소스 수요를 예측하고 알맞은 VM 등급을 골라 배포·관측까지 이어가는
지능형 배포 서비스의 웹 프론트엔드. 아주대학교 **아올다(Aolda) OpenStack** 기반이고, 백엔드는
별도 레포 **ids-be**(FastAPI)다.

## 기술 스택

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + shadcn/ui (Radix)
- **Routing**: React Router v6
- **State/Data**: Context API + TanStack Query
- **Charts**: Recharts
- **Deploy**: Vercel

## 인증 — 아주대 SSO 단일

이메일/비밀번호 로그인과 자체 회원가입은 없다. 신원은 **아주대학교 SSO(Keycloak)** 가 확인한다.
현재는 연동 전이라 데모 세션으로 동작하며, 로그인 화면의 SSO 버튼이 데모 진입점이다.
(Keycloak redirect/callback 연동은 진행 예정.)

## 핵심 흐름

```
GitHub URL + 자연어
   → 예측(POST /api/v1/plans)             추천 flavor·24h 부하·예상 비용·자동화 게이트
   → 검토 단계에서 게이트에 따라 분기
       · block  → 배포 불가(근거 표시)
       · manual → "승인하고 배포"
       · auto   → "배포하기"
   → 배포(POST /api/v1/deploy)
   → 삭제 시 VM(OpenStack)을 먼저 정리한 뒤 기록 삭제(고아 VM 방지)
```

flavor 결정과 최종 검증은 백엔드(결정론)가 소유한다. 프론트는 예측을 **보여주고 게이트를 소비**할 뿐,
스스로 flavor 를 정하거나 block 을 우회하지 않는다.

## 프로젝트 구조

```
mcp_web/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx        # 로그인 전 랜딩
│   │   ├── Login.tsx          # SSO 단일 로그인
│   │   ├── Predict.tsx        # 대시보드(빈 상태 중심)
│   │   ├── Projects.tsx       # 배포한 서비스 목록/삭제
│   │   └── Settings.tsx       # 계정(SSO)·테마
│   ├── components/
│   │   ├── CreateProjectDialog.tsx     # 예측→검토→배포 2단계 위저드
│   │   ├── DeploymentSummaryDialog.tsx
│   │   ├── navigation.tsx              # 데스크톱/모바일(시트) 내비
│   │   └── ...
│   ├── contexts/AuthContext.tsx
│   ├── lib/
│   │   ├── backendAPI.ts      # 예측 클라이언트(/api/v1/plans)
│   │   ├── mcpAPI.ts          # 배포/프로젝트 클라이언트
│   │   └── config.ts          # base URL(환경변수)
│   └── App.tsx
├── vercel.json
└── package.json
```

## 환경 변수

세 base URL 모두 **IDS 백엔드 origin 하나**를 가리킨다(구 MCP의 포트 이원화 없음).

| 변수 | 개발 기본 | 프로덕션 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | `https://api.launcha.cloud` |
| `VITE_DEPLOY_API_BASE_URL` | 〃 | 〃 |
| `VITE_BACKEND_API_BASE_URL` | 〃 | 〃 |

> ⚠️ 프로덕션 환경 변수는 **Vercel이 병언님 개인 fork 계정에 연동**돼 있어, 값 변경이 필요하면
> 병언님께 알려야 한다. 코드에서 임의로 바꾸지 말 것.

## 개발 · 빌드

```bash
npm install
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드(tsc + vite)
npm run preview   # 빌드 미리보기
npm run lint      # eslint
```

## 배포 파이프라인

```
Aolda/ids-fe main 머지
   → sync-fork GitHub Action 이 병언님 fork 로 동기화 (FORK_SYNC_PAT 필요)
   → Vercel 이 fork push 감지 → 자동 빌드·배포 → https://launcha.cloud
```

Vercel은 조직 레포가 아니라 **병언님 fork**에 연결돼 있다. 그래서 main 에 머지해도 fork 동기화가
돌아야 배포가 갱신된다.

## 백엔드 (ids-be)

FastAPI, 별도 레포. 프론트가 쓰는 주요 엔드포인트:

- `POST /api/v1/plans` — 예측 `{ github_url, natural_language }` → 추천 flavor·`automation_mode`·`predictions_24h`·비용 등
- `POST /api/v1/deploy` / `DELETE /api/v1/deploy/{instance_id}` — 배포/삭제 (Bearer, `IDS_API_TOKEN` 설정 시)
- `GET|POST|DELETE /api/v1/projects` — 프로젝트 CRUD
- `POST /api/v1/recommendations/re-evaluate` — 관측→재추천

## 라이선스

MIT
