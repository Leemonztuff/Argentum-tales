import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { ActiveMob, CombatLogEntry, FloatingText, GameMap, PlayerCharacter, SelectedTarget } from '../types/game';
import type { ToastMessage } from '../components/ToastNotification';
import { MAPS } from '../data/maps';
import { MOBS } from '../data/mobs';
import { sound } from '../services/sound';

interface UseMapEntitiesOptions {
  activeMobs: ActiveMob[];
  playerRef: MutableRefObject<PlayerCharacter | null>;
  lastTeleportTime: MutableRefObject<number>;
  changeMapRef: MutableRefObject<((targetMapId: string, targetX: number, targetY: number) => void) | null>;
  setActiveMobs: Dispatch<SetStateAction<ActiveMob[]>>;
  setCurrentMap: Dispatch<SetStateAction<GameMap>>;
  setPlayer: Dispatch<SetStateAction<PlayerCharacter | null>>;
  setSelectedTarget: Dispatch<SetStateAction<SelectedTarget>>;
  setCombatLogs: Dispatch<SetStateAction<CombatLogEntry[]>>;
  setToasts: Dispatch<SetStateAction<ToastMessage[]>>;
  setFloatingTexts: Dispatch<SetStateAction<FloatingText[]>>;
}

/** Combat log / toast / floating text helpers, mob spawning and map changes. */
export function useMapEntities({
  activeMobs,
  playerRef,
  lastTeleportTime,
  changeMapRef,
  setActiveMobs,
  setCurrentMap,
  setPlayer,
  setSelectedTarget,
  setCombatLogs,
  setToasts,
  setFloatingTexts,
}: UseMapEntitiesOptions) {
  const addLog = useCallback((text: string, type: CombatLogEntry['type']) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newEntry: CombatLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      text,
      type,
    };
    setCombatLogs((prev) => [...prev.slice(-40), newEntry]);
  }, [setCombatLogs]);

  const addToast = useCallback((title: string, subtitle?: string, icon?: string, type?: ToastMessage['type']) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, title, subtitle, icon, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [setToasts]);

  const addFloatingText = useCallback((text: string, color: string, x: number, y: number, durationMs = 800) => {
    const newText: FloatingText = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      color,
      x,
      y,
      created: Date.now(),
      durationMs,
    };
    setFloatingTexts((prev) => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((t) => t.id !== newText.id));
    }, durationMs);
  }, [setFloatingTexts]);

  const handleCycleTarget = useCallback(() => {
    if (!activeMobs.length) {
      setSelectedTarget(null);
      return;
    }
    setSelectedTarget((prev) => {
      const currentMob = prev?.type === 'mob' ? prev.mob : null;
      if (!currentMob) return { type: 'mob', mob: activeMobs[0] };
      const currentIndex = activeMobs.findIndex((m) => m.instanceId === currentMob.instanceId);
      const nextIndex = (currentIndex + 1) % activeMobs.length;
      return { type: 'mob', mob: activeMobs[nextIndex] };
    });
  }, [activeMobs, setSelectedTarget]);

  const spawnMobsForMap = useCallback((map: GameMap, revengeTemplateId?: string) => {
    const spawned: ActiveMob[] = [];
    map.mobSpawns.forEach((spawn, idx) => {
      const template = MOBS[spawn.mobId];
      if (!template) return;

      const isRevenge = revengeTemplateId === template.id;

      spawned.push({
        instanceId: `mob_${map.id}_${idx}_${Date.now()}`,
        templateId: template.id,
        name: template.name,
        sprite: template.sprite,
        color: template.color,
        x: spawn.x,
        y: spawn.y,
        targetX: spawn.x,
        targetY: spawn.y,
        currentHp: template.maxHp,
        maxHp: template.maxHp,
        lastAttackTime: 0,
        attackIntervalMs: template.intervalMs,
        isBoss: !!template.isBoss,
        isRevengeTarget: isRevenge,
        facing: 'down',
        spawnX: spawn.x,
        spawnY: spawn.y,
        state: 'idle',
      });
    });
    setActiveMobs(spawned);
  }, [setActiveMobs]);

  const changeMap = useCallback(
    (targetMapId: string, targetX: number, targetY: number) => {
      const targetMap = MAPS[targetMapId];
      const player = playerRef.current;
      if (!targetMap || !player) return;

      lastTeleportTime.current = Date.now();
      sound.playPotion();
      setCurrentMap(targetMap);
      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentMapId: targetMapId,
          x: targetX,
          y: targetY,
        };
      });

      setSelectedTarget(null);
      spawnMobsForMap(targetMap, player.revengeTargetTemplateId);
      addLog(`Ingresaste a: ${targetMap.name}`, 'system');
    },
    [playerRef, lastTeleportTime, setCurrentMap, setPlayer, setSelectedTarget, spawnMobsForMap, addLog]
  );

  // Keep the latest-ref up to date so non-React callers (GameLoop, movement) use it.
  changeMapRef.current = changeMap;

  return { addLog, addToast, addFloatingText, handleCycleTarget, spawnMobsForMap, changeMap };
}
