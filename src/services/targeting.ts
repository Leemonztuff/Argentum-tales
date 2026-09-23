/**
 * Targeting y auto-alineamiento de combate.
 *
 * Encapsula la logica de:
 *  - Elegir objetivo (hysteresis del target seleccionado, preferencia por lo
 *    alineado y por la direccion a la que mira el jugador).
 *  - Encontrar el mejor casillero para alinearse a un mob (ejes X/Y en rango),
 *    con puntaje por "tiempo hasta pegar" (caminata + cooldown restante).
 *  - A* simple 8-dir con prevencion de corte de esquinas por paredes.
 *
 * Funciones puras: faciles de testear y sin estado global.
 */
import type { ActiveMob, GameMap, PlayerCharacter } from '../types/game';
import { CombatEngine } from './combat';

export interface TilePos { x: number; y: number }
export type Facing = 'up' | 'down' | 'left' | 'right';

/** Tiles que bloquean movimiento (pared, agua, arboles densos, roca, vacio). */
export const BLOCKING_TILES: ReadonlySet<number> = new Set([1, 2, 5, 6, 7]);

/** ¿Es caminable un tile? Considera mapa, NPCs y mobs (excepto el ignorado). */
export function isTileWalkable(
  map: GameMap,
  x: number,
  y: number,
  mobs: ActiveMob[],
  ignoreMobInstanceId?: string
): boolean {
  if (x < 0 || x >= map.width || y < 0 || y >= map.height) return false;
  const tile = map.tiles[y]?.[x] ?? 1;
  if (BLOCKING_TILES.has(tile)) return false;
  if (map.npcs.some((n) => n.x === x && n.y === y)) return false;
  if (mobs.some((m) => m.x === x && m.y === y && m.instanceId !== ignoreMobInstanceId)) return false;
  return true;
}

interface PathNode {
  x: number;
  y: number;
  g: number;
  h: number;
  path: TilePos[];
}

/**
 * A* 8-direcciones. Diagonal permitida solo si ninguna de las dos casillas
 * cardinales es una pared (evita "atravesar esquinas").
 * Devuelve la lista de tiles A RECORRER (sin incluir el tile de inicio).
 */
export function findTilePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  map: GameMap,
  mobs: ActiveMob[],
  ignoreMobInstanceId?: string
): TilePos[] | null {
  if (startX === endX && startY === endY) return [];
  if (!isTileWalkable(map, endX, endY, mobs, ignoreMobInstanceId)) return null;

  const walk = (tx: number, ty: number) => isTileWalkable(map, tx, ty, mobs, ignoreMobInstanceId);

  const openList: PathNode[] = [{ x: startX, y: startY, g: 0, h: Math.hypot(endX - startX, endY - startY), path: [] }];
  const closed = new Set<string>();
  const directions = [
    { dx: 1, dy: 0, cost: 1 },
    { dx: -1, dy: 0, cost: 1 },
    { dx: 0, dy: 1, cost: 1 },
    { dx: 0, dy: -1, cost: 1 },
    { dx: -1, dy: -1, cost: 1.414 },
    { dx: 1, dy: -1, cost: 1.414 },
    { dx: -1, dy: 1, cost: 1.414 },
    { dx: 1, dy: 1, cost: 1.414 },
  ];

  // Seguro contra mapas gigantes: corta si explora demasiadas celdas.
  const maxExplored = Math.max(400, map.width * map.height);
  let explored = 0;

  while (openList.length > 0) {
    if (++explored > maxExplored) return null;
    openList.sort((a, b) => a.g + a.h - (b.g + b.h));
    const current = openList.shift()!;

    if (current.x === endX && current.y === endY) return current.path;

    const key = current.x + ',' + current.y;
    if (closed.has(key)) continue;
    closed.add(key);

    for (const { dx, dy, cost } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!walk(nx, ny)) continue;
      if (dx !== 0 && dy !== 0) {
        if (!walk(current.x + dx, current.y) || !walk(current.x, current.y + dy)) continue;
      }
      if (closed.has(nx + ',' + ny)) continue;
      const g = current.g + cost;
      const h = Math.hypot(endX - nx, endY - ny);
      const existing = openList.find((n) => n.x === nx && n.y === ny);
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.path = [...current.path, { x: nx, y: ny }];
        }
      } else {
        openList.push({ x: nx, y: ny, g, h, path: [...current.path, { x: nx, y: ny }] });
      }
    }
  }

  return null;
}

/** Casilleros de alineacion validos alrededor del objetivo (4 ejes x rango). */
export function engagementTiles(target: TilePos, weaponRange: number): TilePos[] {
  const tiles: TilePos[] = [];
  for (let d = 1; d <= weaponRange; d++) {
    tiles.push({ x: target.x - d, y: target.y });
    tiles.push({ x: target.x + d, y: target.y });
    tiles.push({ x: target.x, y: target.y - d });
    tiles.push({ x: target.x, y: target.y + d });
  }
  return tiles;
}

export interface EngagementPlan {
  /** Tiles a caminar desde la posicion actual (sin incluir origen). */
  path: TilePos[];
  /** Casillero de destino (donde se queda alineado). */
  dest: TilePos;
  /** "Tiempo hasta pegar" estimado en ms (caminata vs cooldown restante). */
  timeToAttackMs: number;
}

/**
 * Mejor plan de engagement: para cada candidato alineable calcula el camino.
 * Puntaje = max(tiempo de caminata, cooldown restante) empate → camino mas corto.
 */
export function findBestEngagement(
  from: TilePos,
  target: TilePos,
  weaponRange: number,
  map: GameMap,
  mobs: ActiveMob[],
  opts?: { stepMs?: number; cooldownRemainingMs?: number; ignoreMobInstanceId?: string }
): EngagementPlan | null {
  const stepMs = opts?.stepMs ?? 180;
  const cooldownRemainingMs = Math.max(0, opts?.cooldownRemainingMs ?? 0);

  let best: EngagementPlan | null = null;
  for (const tile of engagementTiles(target, weaponRange)) {
    const path = findTilePath(from.x, from.y, tile.x, tile.y, map, mobs, opts?.ignoreMobInstanceId);
    if (!path) continue;
    const walkMs = path.length * stepMs;
    const time = Math.max(walkMs, cooldownRemainingMs);
    if (!best || time < best.timeToAttackMs || (time === best.timeToAttackMs && path.length < best.path.length)) {
      best = { path, dest: tile, timeToAttackMs: time };
    }
  }
  return best;
}

/**
 * Eleccion de objetivo (choosable para todos los flujos):
 *  1. Hysteresis del seleccionado: si sigue vivo/en lista, se respeta.
 *  2. Sin seleccion: mobs ALINEADOS en rango; el mas cercano; desempate a favor
 *     de la direccion que mira el jugador.
 *  3. Ninguno alineado: el mas cercano dentro de maxAutoDist (empate → facing).
 *  4. Nada → null (el atacante golpea al aire).
 */
export function chooseAttackTarget(
  playerPos: TilePos,
  facing: Facing,
  mobs: ActiveMob[],
  selectedMob: ActiveMob | null,
  weaponRange: number,
  maxAutoDist = 8
): ActiveMob | null {
  if (selectedMob) {
    const alive = mobs.find((m) => m.instanceId === selectedMob.instanceId);
    if (alive && alive.currentHp > 0) return alive;
  }

  const living = mobs.filter((m) => m.currentHp > 0);

  const inFacingRow = (m: ActiveMob): boolean => {
    switch (facing) {
      case 'up': return m.y < playerPos.y && m.x === playerPos.x;
      case 'down': return m.y > playerPos.y && m.x === playerPos.x;
      case 'left': return m.x < playerPos.x && m.y === playerPos.y;
      case 'right': return m.x > playerPos.x && m.y === playerPos.y;
    }
  };

  const aligned = living.filter((m) =>
    CombatEngine.isAligned(playerPos.x, playerPos.y, m.x, m.y, weaponRange).aligned
  );
  if (aligned.length > 0) {
    aligned.sort((a, b) => {
      const da = CombatEngine.isAligned(playerPos.x, playerPos.y, a.x, a.y, weaponRange).distance;
      const db = CombatEngine.isAligned(playerPos.x, playerPos.y, b.x, b.y, weaponRange).distance;
      if (da !== db) return da - db;
      if (inFacingRow(a)) return -1;
      if (inFacingRow(b)) return 1;
      return 0;
    });
    return aligned[0];
  }

  const near = living.filter((m) => {
    const d = Math.hypot(m.x - playerPos.x, m.y - playerPos.y);
    return d <= maxAutoDist;
  });
  if (near.length === 0) return null;
  near.sort((a, b) => {
    const da = Math.hypot(a.x - playerPos.x, a.y - playerPos.y);
    const db = Math.hypot(b.x - playerPos.x, b.y - playerPos.y);
    if (da !== db) return da - db;
    // Empate: prefiere el menos desalineado respecto al facing actual.
    const skew = (m: ActiveMob) =>
      facing === 'left' || facing === 'right' ? Math.abs(m.y - playerPos.y) : Math.abs(m.x - playerPos.x);
    return skew(a) - skew(b);
  });
  return near[0];
}

/** Sincroniza el objeto de seleccion con su instancia viva actual. */
export function refreshSelectedMob(selectedMob: ActiveMob | null, mobs: ActiveMob[]): ActiveMob | null {
  if (!selectedMob) return null;
  const alive = mobs.find((m) => m.instanceId === selectedMob.instanceId);
  return alive && alive.currentHp > 0 ? alive : null;
}

/**
 * Informacion para HUD: cuantos tiles faltan para alinear (0 = alineado).
 * dx/dy crudos + eje sugerido para cancelar la desalineacion.
 */
export function alignmentGap(
  playerPos: TilePos,
  target: TilePos
): { dx: number; dy: number; suggested: 'moveX' | 'moveY' | null } {
  const dx = target.x - playerPos.x;
  const dy = target.y - playerPos.y;
  if (dx === 0 || dy === 0) return { dx, dy, suggested: null };
  return { dx, dy, suggested: Math.abs(dx) <= Math.abs(dy) ? 'moveX' : 'moveY' };
}
