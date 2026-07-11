import { useEffect, useRef, useState } from "react"

/* 숫자를 0 → target 으로 부드럽게 카운트업. 모션 민감 사용자는 즉시 최종값. */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setValue(target * eased)
      if (t < 1) {
        frame.current = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [target, durationMs])

  return value
}
