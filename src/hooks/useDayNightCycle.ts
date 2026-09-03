import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Game3DRenderer } from '../engine/Game3DRenderer';

interface UseDayNightCycleOptions {
  rendererRef: MutableRefObject<Game3DRenderer | null>;
}

/**
 * Owns the day/night cycle state and keeps the 3D renderer's lighting in sync.
 * Exposes `advanceDayNight` so App can register it as a cadence in the single
 * central GameLoop (Fase 2), avoiding a second requestAnimationFrame.
 */
export function useDayNightCycle({ rendererRef }: UseDayNightCycleOptions) {
  // 0.35 = ~08:24 AM on a 0.0–1.0 clock
  const [timeProgress, setTimeProgress] = useState<number>(0.35);
  const isNight = timeProgress < 0.25 || timeProgress > 0.79;

  const isNightRef = useRef<boolean>(isNight);
  isNightRef.current = isNight;

  // Keep the 3D renderer's lighting in sync with the time of day.
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateLightingByTime(timeProgress, isNight);
    }
  }, [timeProgress, isNight, rendererRef]);

  // Single advancing step used by the central GameLoop (~1s cadence).
  const advanceDayNight = useCallback(() => {
    setTimeProgress((prev) => (prev + 0.002) % 1.0);
  }, []);

  return { timeProgress, isNight, isNightRef, advanceDayNight, setTimeProgress };
}
