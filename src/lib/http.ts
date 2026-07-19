// fetch 에 타임아웃을 건다 — 백엔드가 죽어 있어도 브라우저 기본 타임아웃(20초+)까지
// 매달리지 않고 정해진 시간 안에 빠르게 실패한다(대시보드 로딩 무한대기 방지).

import { REQUEST_TIMEOUT_MS } from "./config";

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("서버 응답이 없어 연결을 중단했어요. 잠시 후 다시 시도해주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
