import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { CombatEngine } from '../services/combat';

export const DASH_COOLDOWN_MS = 2500;
const COMBO_WINDOW_MS = 3000;

interface UseCombatCountersOptions {
  playerRef: MutableRefObject<{ lastAttackTimestamp: number } | null>;
}

/**
 * Owns the combat shared-state counters that drive the HUD + GameLoop cadences:
 * attack cooldown, dash cooldown, critical impact, and the combo window.
 * Also exposes the per-cadence callbacks registered on the single GameLoop.
 */
export function useCombatCounters({ playerRef }: UseCombatCountersOptions) {
  // Attack / dash / crit
  const [attackCooldownPercent, setAttackCooldownPercent] = useState(0);
  const [lastDashTimestamp, setLastDashTimestamp] = useState<number>(0);
  const [dashCooldownPercent, setDashCooldownPercent] = useState<number>(0);
  const [critEffect, setCritEffect] = useState<{ type: 'deal' | 'receive'; key: number } | null>(null);

  // Combo
  const [comboCount, setComboCount] = useState<number>(0);
  const [comboTargetInstanceId, setComboTargetInstanceId] = useState<string | null>(null);
  const [comboTargetName, setComboTargetName] = useState<string | null>(null);
  const [comboLastHitTime, setComboLastHitTime] = useState<number>(0);
  const [comboTimeLeftPercent, setComboTimeLeftPercent] = useState<number>(100);

  // Fresh-value refs consumed by the single-instance cadence callbacks.
  const comboLastHitTimeRef = useRef<number>(0);
  const comboCountRef = useRef<number>(0);
  const lastDashTimestampRef = useRef<number>(0);
  comboLastHitTimeRef.current = comboLastHitTime;
  comboCountRef.current = comboCount;
  lastDashTimestampRef.current = lastDashTimestamp;

  const getUpdatedComboCount = (targetInstanceId: string, targetName: string) => {
    const now = Date.now();
    const isSameMob = comboTargetInstanceId === targetInstanceId;
    const isWithinTime = now - comboLastHitTime <= COMBO_WINDOW_MS;

    let nextCombo = 1;
    if (isSameMob && isWithinTime) {
      nextCombo = comboCount + 1;
    }

    setComboCount(nextCombo);
    setComboTargetInstanceId(targetInstanceId);
    setComboTargetName(targetName);
    setComboLastHitTime(now);

    return nextCombo;
  };

  const triggerImpactEffect = (type: 'deal' | 'receive') => {
    const key = Date.now();
    setCritEffect({ type, key });
    setTimeout(() => {
      setCritEffect((prev) => (prev?.key === key ? null : prev));
    }, 550);
  };

  // GameLoop cadences
  const tickCombo = useCallback(() => {
    if (comboCountRef.current <= 0) return;
    const elapsed = Date.now() - comboLastHitTimeRef.current;
    const remainingMs = COMBO_WINDOW_MS - elapsed;
    if (remainingMs <= 0) {
      setComboCount(0);
      setComboTargetInstanceId(null);
      setComboTargetName(null);
      setComboTimeLeftPercent(0);
    } else {
      setComboTimeLeftPercent((remainingMs / COMBO_WINDOW_MS) * 100);
    }
  }, []);

  const tickDash = useCallback(() => {
    const elapsed = Date.now() - lastDashTimestampRef.current;
    if (elapsed < DASH_COOLDOWN_MS) {
      setDashCooldownPercent(Math.max(0, 1 - elapsed / DASH_COOLDOWN_MS));
    } else {
      setDashCooldownPercent(0);
    }
  }, []);

  const tickAttackCooldown = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const attackIntervalMs = CombatEngine.calculateAttackInterval(p);
    const elapsed = Date.now() - p.lastAttackTimestamp;
    if (elapsed >= attackIntervalMs) {
      setAttackCooldownPercent(0);
    } else {
      setAttackCooldownPercent(1 - elapsed / attackIntervalMs);
    }
  }, [playerRef]);

  return {
    attackCooldownPercent,
    dashCooldownPercent,
    critEffect,
    setCritEffect,
    comboCount,
    comboTargetName,
    comboTimeLeftPercent,
    comboCountRef,
    setComboCount,
    setComboTargetInstanceId,
    setComboTargetName,
    lastDashTimestamp,
    setLastDashTimestamp,
    lastDashTimestampRef,
    getUpdatedComboCount,
    triggerImpactEffect,
    tickCombo,
    tickDash,
    tickAttackCooldown,
  };
}
