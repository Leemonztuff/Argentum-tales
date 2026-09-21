import type { GameMap, PlayerCharacter } from '../types/game';

/**
 * MAPS entries are module-level singletons that get mutated at runtime
 * (chest.isOpened, gatherNode.harvested). The persisted flags live on the
 * player (openedChests / harvestedNodes). This helper syncs the singleton
 * state from the player data — in BOTH directions — every time a map is
 * entered or a character is loaded, so:
 *  - reloading a save restores which chests/nodes were already consumed, and
 *  - starting a new character in the same session doesn't inherit another
 *    character's leftover mutations.
 */
export function rehydrateMapState(map: GameMap, player: PlayerCharacter | null): void {
  const openedChests = new Set(player?.openedChests ?? []);
  const harvestedNodes = new Set(player?.harvestedNodes ?? []);

  map.chests.forEach((chest) => {
    chest.isOpened = openedChests.has(chest.id);
  });

  map.gatherNodes.forEach((node) => {
    node.harvested = harvestedNodes.has(`${map.id}:${node.id}`) || harvestedNodes.has(node.id);
  });
}

/** Namespaced id used to persist a harvested node per map. */
export function harvestedNodeKey(mapId: string, nodeId: string): string {
  return `${mapId}:${nodeId}`;
}
