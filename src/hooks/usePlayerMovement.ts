import { useCallback } from 'react';
import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import type { PlayerCharacter, ActiveMob, GameMap, SelectedTarget } from '../types/game';
import { CombatEngine } from '../services/combat';
import { useUIStore } from '../ui';

interface UsePlayerMovementOptions {
  playerRef: MutableRefObject<PlayerCharacter | null>;
  currentMapRef: MutableRefObject<GameMap>;
  mobsRef: MutableRefObject<ActiveMob[]>;
  lastTeleportTime: MutableRefObject<number>;
  changeMapRef: MutableRefObject<((targetMapId: string, targetX: number, targetY: number) => void) | null>;
  setPlayer: Dispatch<SetStateAction<PlayerCharacter | null>>;
  setSelectedTarget: Dispatch<SetStateAction<SelectedTarget>>;
  addLog: (text: string, type?: string) => void;
  cancelAutoAlign: () => void;
}

function autoTarget(
  x: number,
  y: number,
  weaponRange: number,
  mobs: ActiveMob[],
  setSelectedTarget: Dispatch<SetStateAction<SelectedTarget>>
) {
  const alignedMob = mobs.find((m) => {
    const res = CombatEngine.isAligned(x, y, m.x, m.y, weaponRange);
    return res.aligned;
  });
  if (alignedMob) {
    setSelectedTarget({ type: 'mob', mob: alignedMob });
  }
}

/** Player movement: collision, facing, auto-target and portal transitions. */
export function usePlayerMovement({
  playerRef,
  currentMapRef,
  mobsRef,
  lastTeleportTime,
  changeMapRef,
  setPlayer,
  setSelectedTarget,
  addLog,
  cancelAutoAlign,
}: UsePlayerMovementOptions) {
  const handlePlayerMove = useCallback(
    (dx: number, dy: number, isAuto?: boolean) => {
      const p = playerRef.current;
      const map = currentMapRef.current;
      if (!p || useUIStore.getState().deathInfo) return;

      if (!isAuto) {
        cancelAutoAlign();
      }

      const newX = p.x + dx;
      const newY = p.y + dy;

      // Check map boundary
      if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
        return;
      }

      // Check tile collision
      const tile = map.tiles[newY]?.[newX] ?? 1;
      const isBlocking = (t: number) => [1, 2, 5, 6, 7].includes(t);
      if (isBlocking(tile)) {
        return;
      }

      // Check NPC collision
      const npcCollision = map.npcs.find((n) => n.x === newX && n.y === newY);
      if (npcCollision) return;

      // Check Mob collision
      const mobCollision = mobsRef.current.find((m) => m.x === newX && m.y === newY);
      if (mobCollision) return;

      // Determine facing direction
      let facing: PlayerCharacter['facing'] = p.facing;
      if (dx > 0) facing = 'right';
      else if (dx < 0) facing = 'left';
      else if (dy > 0) facing = 'down';
      else if (dy < 0) facing = 'up';

      setPlayer((prev) => {
        if (!prev) return null;

        const prevTile = map.tiles[Math.floor(prev.y)]?.[Math.floor(prev.x)] ?? 0;
        const nextTile = map.tiles[Math.floor(newY)]?.[Math.floor(newX)] ?? 0;

        if (prevTile !== 8 && nextTile === 8) {
          addLog('🛡️ Estás en un camino seguro. La agresión de los monstruos se ha reducido.', 'system');
        } else if (prevTile === 8 && nextTile !== 8) {
          addLog('⚠️ Has salido del camino seguro. Los monstruos recuperan su agresividad natural.', 'player_miss');
        }

        return {
          ...prev,
          x: newX,
          y: newY,
          facing,
        };
      });

      // Auto-target nearest mob in straight line
      autoTarget(newX, newY, p.equipment.weapon?.range || 1, mobsRef.current, setSelectedTarget);

      // Check Portal (only if we didn't just teleport)
      if (Date.now() - lastTeleportTime.current > 1000) {
        const portal = map.portals.find((pp) => pp.x === newX && pp.y === newY);
        if (portal) {
          changeMapRef.current?.(portal.targetMapId, portal.targetX, portal.targetY);
        }
      }
    },
    [playerRef, currentMapRef, mobsRef, lastTeleportTime, changeMapRef, setPlayer, setSelectedTarget, addLog, cancelAutoAlign]
  );

  const handlePlayerPositionChange = useCallback(
    (x: number, y: number, facing: 'up' | 'down' | 'left' | 'right') => {
      const p = playerRef.current;
      const map = currentMapRef.current;
      if (!p || useUIStore.getState().deathInfo) return;

      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          x,
          y,
          facing,
        };
      });

      // Auto-target nearest mob in straight line
      autoTarget(x, y, p.equipment.weapon?.range || 1, mobsRef.current, setSelectedTarget);

      // Check Portal (only if we didn't just teleport)
      if (Date.now() - lastTeleportTime.current > 1000) {
        const portal = map.portals.find((pp) => pp.x === x && pp.y === y);
        if (portal) {
          changeMapRef.current?.(portal.targetMapId, portal.targetX, portal.targetY);
        }
      }
    },
    [playerRef, currentMapRef, mobsRef, lastTeleportTime, changeMapRef, setPlayer, setSelectedTarget]
  );

  return { handlePlayerMove, handlePlayerPositionChange };
}
