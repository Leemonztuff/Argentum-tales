import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  PlayerCharacter,
  CharacterClass,
  GameMap,
  ActiveMob,
  NPC,
  Item,
  Spell,
  FloatingText,
  CombatLogEntry,
  CraftingRecipe,
  SelectedTarget,
} from './types/game';
import { MAPS } from './data/maps';
import { MOBS } from './data/mobs';
import { ITEMS } from './data/items';
import { SPELLS } from './data/spells';
import { INITIAL_QUESTS } from './data/quests';
import { CombatEngine } from './services/combat';
import { sound } from './services/sound';
import { contentRegistry } from './services/ContentRegistry';
import {
  addItemToInventory,
  shouldAutoPickupItem,
} from './utils/inventoryUtils';
import {
  createInitialPlayer,
  loadGameState,
  saveGameState,
  clearGameState,
  saveCharacterToSlot,
} from './services/saveGame';
import { Game3DRenderer } from './engine/Game3DRenderer';
import { GameLoop } from './engine/GameLoop';
import { useDayNightCycle } from './hooks/useDayNightCycle';
import { useGameSettings } from './hooks/useGameSettings';
import { useCharacterSlots } from './hooks/useCharacterSlots';
import { usePlayerMovement } from './hooks/usePlayerMovement';
import { useMapEntities } from './hooks/useMapEntities';
import { useCombatCounters, DASH_COOLDOWN_MS } from './hooks/useCombatCounters';
import { useModalActions } from './hooks/useModalActions';

// Components
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { InventoryModal } from './components/InventoryModal';
import { SkillsModal } from './components/SkillsModal';
import { QuestModal } from './components/QuestModal';
import { ShopModal } from './components/ShopModal';
import { CraftingModal } from './components/CraftingModal';
import { DialogueModal } from './components/DialogueModal';
import { ClassSelectModal } from './components/ClassSelectModal';
import { DeathModal } from './components/DeathModal';
import { CombatLog } from './components/CombatLog';
import { Minimap } from './components/Minimap';
import { OrientationPrompt } from './components/OrientationPrompt';
import { HelpModal } from './components/HelpModal';
import { DataStudioModal } from './components/DataStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { ToastNotification, ToastMessage } from './components/ToastNotification';
import { useUIStore, ModalId } from './ui';

export default function App() {
  // Game Setup / Character State
  const [player, setPlayer] = useState<PlayerCharacter | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Day/Night cycle, lighting sync and isNight are owned by useDayNightCycle.

  // Map & Entity State
  const [currentMap, setCurrentMap] = useState<GameMap>(MAPS.pueblo_inicial);
  const [activeMobs, setActiveMobs] = useState<ActiveMob[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget>(null);
  const targetMob = selectedTarget?.type === 'mob' ? selectedTarget.mob : null;
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals State (visibility routed through UIStore)
  const toggleModal = (id: ModalId) => useUIStore.getState().toggleModal(id);
  const closeModal = (id: ModalId) => useUIStore.getState().closeModal(id);
  const toggleHelp = () => toggleModal('help');
  const closeHelp = () => closeModal('help');
  const toggleInventory = () => toggleModal('inventory');
  const toggleSkills = () => toggleModal('skills');
  const toggleQuests = () => toggleModal('quests');
  const toggleDataStudio = () => toggleModal('dataStudio');
  const toggleSettings = () => toggleModal('settings');
  const closeAllModals = () => useUIStore.getState().closeAllModals();
  const { gameSettings, updateGameSettings } = useGameSettings();
  const activeShop = useUIStore((s) => s.activeShop);
  const activeCrafting = useUIStore((s) => s.activeCrafting);
  const activeDialogueNpc = useUIStore((s) => s.activeDialogueNpc);
  const deathInfo = useUIStore((s) => s.deathInfo);

  // Combat timing, crit impact and combo counters are owned by useCombatCounters.

  // Auto-Alignment State & Refs
  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const autoAlignTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAlignPathRef = useRef<{ x: number; y: number }[]>([]);

  const cancelAutoAlign = useCallback(() => {
    if (autoAlignTimeoutRef.current) {
      clearTimeout(autoAlignTimeoutRef.current);
      autoAlignTimeoutRef.current = null;
    }
    autoAlignPathRef.current = [];
    setIsAutoAligning(false);
  }, []);

  // Cleanup auto-alignment on unmount
  useEffect(() => {
    return () => {
      if (autoAlignTimeoutRef.current) {
        clearTimeout(autoAlignTimeoutRef.current);
      }
    };
  }, []);

  const findPath = useCallback((startX: number, startY: number, endX: number, endY: number): { x: number; y: number }[] | null => {
    if (startX === endX && startY === endY) return [];

    interface PathNode {
      x: number;
      y: number;
      g: number;
      h: number;
      path: { x: number; y: number }[];
    }

    const startNode: PathNode = {
      x: startX,
      y: startY,
      g: 0,
      h: Math.hypot(endX - startX, endY - startY),
      path: []
    };

    const openList: PathNode[] = [startNode];
    const closedList = new Set<string>();

    const directions = [
      // Orthogonal directions (cost = 1)
      { dx: 0, dy: -1, cost: 1 },
      { dx: 0, dy: 1, cost: 1 },
      { dx: -1, dy: 0, cost: 1 },
      { dx: 1, dy: 0, cost: 1 },
      // Diagonal directions (cost = 1.414)
      { dx: -1, dy: -1, cost: 1.414 },
      { dx: 1, dy: -1, cost: 1.414 },
      { dx: -1, dy: 1, cost: 1.414 },
      { dx: 1, dy: 1, cost: 1.414 },
    ];

    const isWalkable = (tx: number, ty: number): boolean => {
      if (tx < 0 || tx >= currentMap.width || ty < 0 || ty >= currentMap.height) return false;
      const tile = currentMap.tiles[ty]?.[tx] ?? 1;
      const isBlocking = (t: number) => [1, 2, 5, 6, 7].includes(t);
      if (isBlocking(tile)) return false;
      const hasNpc = currentMap.npcs.some((n) => n.x === tx && n.y === ty);
      if (hasNpc) return false;
      const hasMob = activeMobs.some((m) => m.x === tx && m.y === ty && m.instanceId !== targetMob?.instanceId);
      if (hasMob) return false;
      return true;
    };

    while (openList.length > 0) {
      // Find lowest total cost (f = g + h) node
      openList.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openList.shift()!;

      if (current.x === endX && current.y === endY) {
        return current.path;
      }

      const currentKey = `${current.x},${current.y}`;
      closedList.add(currentKey);

      for (const { dx, dy, cost } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const neighborKey = `${nx},${ny}`;

        if (closedList.has(neighborKey)) continue;

        if (isWalkable(nx, ny)) {
          // Prevent cutting corners through hard walls diagonally
          if (dx !== 0 && dy !== 0) {
            if (!isWalkable(current.x + dx, current.y) || !isWalkable(current.x, current.y + dy)) {
              continue;
            }
          }

          const gScore = current.g + cost;
          const hScore = Math.hypot(endX - nx, endY - ny);

          const existingOpen = openList.find(n => n.x === nx && n.y === ny);
          if (existingOpen) {
            if (gScore < existingOpen.g) {
              existingOpen.g = gScore;
              existingOpen.path = [...current.path, { x: nx, y: ny }];
            }
          } else {
            openList.push({
              x: nx,
              y: ny,
              g: gScore,
              h: hScore,
              path: [...current.path, { x: nx, y: ny }]
            });
          }
        }
      }
    }

    return null;
  }, [currentMap, activeMobs, targetMob]);

  // References
  const rendererRef = useRef<Game3DRenderer | null>(null);
  const playerRef = useRef<PlayerCharacter | null>(null);
  playerRef.current = player;
  const lastTeleportTime = useRef<number>(0);
  const mobsRef = useRef<ActiveMob[]>([]);
  mobsRef.current = activeMobs;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const mobAICallbackRef = useRef<(() => void) | null>(null);
  const changeMapRef = useRef<((targetMapId: string, targetX: number, targetY: number) => void) | null>(null);

  // Fresh-value ref: currentMap for single-instance game-loop callbacks
  const currentMapRef = useRef<GameMap>(currentMap);
  currentMapRef.current = currentMap;

  // Combat counters (cooldowns, crit, combo) + their GameLoop cadences
  const {
    attackCooldownPercent,
    dashCooldownPercent,
    critEffect,
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
  } = useCombatCounters({ playerRef });

  // Spell cast cooldown tracking (kept in App; consumed by handleCastSpell)
  const [lastSpellTimestamps, setLastSpellTimestamps] = useState<Record<string, number>>({});

  // Day/Night cycle (owns timeProgress, isNight, isNightRef, lighting sync)
  const { timeProgress, isNight, isNightRef, advanceDayNight } = useDayNightCycle({ rendererRef });

  // --- INITIAL LOAD ---
  useEffect(() => {
    // Title screen is shown when player is null.
  }, []);

  // --- AUTO SAVE (debounced 2s to avoid localStorage write per player change during combat) ---
  useEffect(() => {
    if (!player) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      try {
        saveGameState(playerRef.current ?? player);
      } catch {
        /* localStorage unavailable or quota exceeded — non-fatal */
      }
    }, 2000);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [player]);

  // --- LOGGING, MAP ENTITIES & MAP CHANGE HELPERS ---
  const { addLog, addToast, addFloatingText, handleCycleTarget, spawnMobsForMap, changeMap } = useMapEntities({
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
  });

  // Character select/creation flow (title screen slots)
  const {
    characterSlots,
    activeSlotIndex,
    creatingSlotIndex,
    isCharacterCreating,
    handleSelectSlot,
    handleDeleteSlot,
    handleStartCreateCharacter,
    setIsCharacterCreating,
    setCharacterSlots,
    setActiveSlotIndexState,
    setCreatingSlotIndex,
    saveActiveSlot,
    refreshSlots,
  } = useCharacterSlots({ setPlayer, setCurrentMap, spawnMobsForMap });

  // --- PLAYER MOVEMENT ---
  const { handlePlayerMove, handlePlayerPositionChange } = usePlayerMovement({
    playerRef,
    currentMapRef,
    mobsRef,
    lastTeleportTime,
    changeMapRef,
    setPlayer,
    setSelectedTarget,
    addLog,
    cancelAutoAlign,
  });

  // --- RECOGIDO AUTOMÁTICO (Auto-Pickup) DE RECURSOS DEL MAPA ---
  useEffect(() => {
    if (!player || !gameSettings.autoPickup || deathInfo) return;

    currentMap.gatherNodes.forEach((node) => {
      if (!node.harvested && Math.hypot(node.x - player.x, node.y - player.y) <= 1.5) {
        const yieldItem = contentRegistry.getItem(node.yieldItemId) || ITEMS[node.yieldItemId];
        if (!yieldItem) return;

        // Apply Auto Pickup Filter
        if (!shouldAutoPickupItem(yieldItem, gameSettings.autoPickupFilters)) return;

        node.harvested = true;
        sound.playGather();

        setPlayer((prev) => {
          if (!prev) return null;
          const { inventory: newInv, success } = addItemToInventory(prev.inventory, yieldItem, 1);
          if (!success) {
            addLog(`¡Inventario lleno! No pudiste recolectar: ${yieldItem.name}`, 'system');
            return prev;
          }

          // Check gather quest progress
          const updatedQuests = prev.activeQuests.map((q) => {
            if (q.objectiveType === 'gather' && q.targetId === node.yieldItemId) {
              return { ...q, currentAmount: q.currentAmount + 1 };
            }
            return q;
          });

          return {
            ...prev,
            inventory: newInv,
            activeQuests: updatedQuests,
          };
        });

        addLog(`[Recogida Automática] Recolectaste: ${yieldItem.name}`, 'loot');
        addFloatingText(`+1 ${yieldItem.name}`, '#4ade80', node.x, node.y);
        if (gameSettings.showLootToasts) {
          addToast('RECOGIDA AUTOMÁTICA', `Recolectaste +1 ${yieldItem.name}`, yieldItem.icon || '🌿', 'loot');
        }
      }
    });
  }, [player?.x, player?.y, gameSettings.autoPickup, gameSettings.autoPickupFilters, gameSettings.showLootToasts, currentMap, deathInfo, addToast]);

  const handleDash = useCallback(() => {
    if (!player || deathInfo) return;
    const now = Date.now();
    const elapsed = now - lastDashTimestamp;
    if (elapsed < DASH_COOLDOWN_MS) {
      const remainingSec = ((DASH_COOLDOWN_MS - elapsed) / 1000).toFixed(1);
      addFloatingText(`¡Dash en recarga (${remainingSec}s)!`, '#fbbf24', player.x, player.y, 600);
      return;
    }

    cancelAutoAlign();

    let dx = 0;
    let dy = 0;
    if (player.facing === 'up') dy = -1;
    else if (player.facing === 'down') dy = 1;
    else if (player.facing === 'left') dx = -1;
    else if (player.facing === 'right') dx = 1;

    let targetX = player.x;
    let targetY = player.y;
    let tilesMoved = 0;

    for (let step = 1; step <= 2; step++) {
      const nx = player.x + dx * step;
      const ny = player.y + dy * step;

      // Check boundary
      if (nx < 0 || nx >= currentMap.width || ny < 0 || ny >= currentMap.height) {
        break;
      }

      // Check tile collision
      const tile = currentMap.tiles[ny]?.[nx] ?? 1;
      const isBlocking = (t: number) => [1, 2, 5, 6, 7].includes(t);
      if (isBlocking(tile)) {
        break;
      }

      // Check NPC collision
      const npcCollision = currentMap.npcs.find((n) => n.x === nx && n.y === ny);
      if (npcCollision) {
        break;
      }

      // Check Mob collision
      const mobCollision = activeMobs.find((m) => m.x === nx && m.y === ny);
      if (mobCollision) {
        break;
      }

      targetX = nx;
      targetY = ny;
      tilesMoved++;
    }

    if (tilesMoved === 0) {
      addFloatingText('¡Camino bloqueado!', '#ef4444', player.x, player.y, 600);
      return;
    }

    setLastDashTimestamp(now);
    sound.playDash();
    addFloatingText(`¡Dash (${tilesMoved}x)!`, '#38bdf8', targetX, targetY, 700);

    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        x: targetX,
        y: targetY,
      };
    });

    // Check Portal at final position
    const portal = currentMap.portals.find((p) => p.x === targetX && p.y === targetY);
    if (portal) {
      changeMap(portal.targetMapId, portal.targetX, portal.targetY);
    }
  }, [player, deathInfo, lastDashTimestamp, cancelAutoAlign, currentMap, activeMobs, addFloatingText]);

  // --- CONTEXTUAL INTERACTION ---
  const getContextualInteract = (): { label: string | null; action: () => void } => {
    if (!player) return { label: null, action: () => {} };

    // 1. NPC nearby
    const npc = currentMap.npcs.find(
      (n) => Math.hypot(n.x - player.x, n.y - player.y) <= 1.5
    );
    if (npc) {
      return {
        label: `Hablar con ${npc.name}`,
        action: () => {
          useUIStore.getState().setActiveDialogueNpc(npc);
          sound.playPotion();
        },
      };
    }

    // 2. Chest nearby
    const chest = currentMap.chests.find(
      (c) => Math.hypot(c.x - player.x, c.y - player.y) <= 1.5 && !c.isOpened
    );
    if (chest) {
      return {
        label: 'Abrir Cofre del Tesoro',
        action: () => {
          chest.isOpened = true;
          sound.playLoot();
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });

          let gainedGold = chest.gold;
          let itemNames: string[] = [];

          setPlayer((prev) => {
            if (!prev) return null;
            const newInv = [...prev.inventory];

            chest.items.forEach(({ itemId, count }) => {
              const itemData = ITEMS[itemId];
              if (!itemData) return;
              itemNames.push(`${itemData.name} x${count}`);

              // Find empty slot or stack
              const emptyIdx = newInv.findIndex((i) => i === null);
              if (emptyIdx !== -1) {
                newInv[emptyIdx] = { ...itemData, count };
              }
            });

            return {
              ...prev,
              gold: prev.gold + gainedGold,
              inventory: newInv,
              openedChests: [...prev.openedChests, chest.id],
            };
          });

          addLog(`¡Abriste un cofre! Obtuviste 🪙 ${gainedGold} oro y [${itemNames.join(', ')}].`, 'loot');
          addFloatingText(`+${gainedGold} Oro`, '#fbbf24', chest.x, chest.y);
        },
      };
    }

    // 3. Gather Node nearby
    const node = currentMap.gatherNodes.find(
      (gn) => Math.hypot(gn.x - player.x, gn.y - player.y) <= 1.5 && !gn.harvested
    );
    if (node) {
      const yieldItem = ITEMS[node.yieldItemId];
      return {
        label: `Recolectar ${yieldItem?.name || 'Recurso'}`,
        action: () => {
          node.harvested = true;
          sound.playGather();

          setPlayer((prev) => {
            if (!prev) return null;
            const newInv = [...prev.inventory];
            const emptyIdx = newInv.findIndex((i) => i === null);
            if (emptyIdx !== -1 && yieldItem) {
              newInv[emptyIdx] = { ...yieldItem, count: 1 };
            }

            // Check gather quest progress
            const updatedQuests = prev.activeQuests.map((q) => {
              if (q.objectiveType === 'gather' && q.targetId === node.yieldItemId) {
                return { ...q, currentAmount: q.currentAmount + 1 };
              }
              return q;
            });

            return {
              ...prev,
              inventory: newInv,
              activeQuests: updatedQuests,
            };
          });

          addLog(`Recolectaste: ${yieldItem?.name}`, 'loot');
          addFloatingText(`+1 ${yieldItem?.name}`, '#4ade80', node.x, node.y);
        },
      };
    }

    return { label: null, action: () => {} };
  };

  // --- ATTACK COOLDOWN TICKER (handled by central GameLoop) ---

  // --- COMBAT: PLAYER EXECUTES ATTACK ---
  const handlePlayerAttack = () => {
    if (!player || deathInfo) return;

    const now = Date.now();
    const attackIntervalMs = CombatEngine.calculateAttackInterval(player);
    const elapsed = now - player.lastAttackTimestamp;
    const remaining = attackIntervalMs - elapsed;
    const isPerfectAgite = remaining > 0 && remaining <= (attackIntervalMs * 0.20);

    if (now - player.lastAttackTimestamp < attackIntervalMs && !isPerfectAgite) {
      addFloatingText('¡Cooldown!', '#fbbf24', player.x, player.y, 500);
      return; // Anti-spam cooldown active
    }

    if (isPerfectAgite) {
      addFloatingText('¡PERFECTO!', '#22d3ee', player.x, player.y, 650);
      addLog('¡Agite Perfecto! Encadenaste tu golpe con precisión milimétrica.', 'stab');
    }

    const weaponRange = player.equipment.weapon?.range || 1;

    // Find target in straight line alignment (X or Y)
    let target = targetMob;

    // Auto-alignment check if target selected
    if (target) {
      const alignCheck = CombatEngine.isAligned(player.x, player.y, target.x, target.y, weaponRange);
      if (!alignCheck.aligned) {
        addLog(`Caminando automáticamente para atacar a ${target.name}...`, 'system');

        // Calculate possible candidates in straight lines from target within weaponRange
        const candidates: { x: number; y: number }[] = [];
        for (let d = 1; d <= weaponRange; d++) {
          candidates.push({ x: target.x - d, y: target.y });
          candidates.push({ x: target.x + d, y: target.y });
          candidates.push({ x: target.x, y: target.y - d });
          candidates.push({ x: target.x, y: target.y + d });
        }

        // Filter valid candidates on map bounds, non-walkable tiles, NPCs, other mobs
        const validCandidates = candidates.filter((c) => {
          if (c.x < 0 || c.x >= currentMap.width || c.y < 0 || c.y >= currentMap.height) return false;
          const tile = currentMap.tiles[c.y]?.[c.x] ?? 1;
          const isBlocking = (t: number) => [1, 2, 5, 6, 7].includes(t);
          if (isBlocking(tile)) return false;
          const hasNpc = currentMap.npcs.some((n) => n.x === c.x && n.y === c.y);
          if (hasNpc) return false;
          const hasMob = activeMobs.some((m) => m.x === c.x && m.y === c.y && m.instanceId !== target!.instanceId);
          if (hasMob) return false;
          return true;
        });

        if (validCandidates.length === 0) {
          addLog('No hay casillas libres para alinearse con el objetivo.', 'player_miss');
          return;
        }

        // Find candidate with shortest path
        let bestPath: { x: number; y: number }[] | null = null;

        validCandidates.forEach((cand) => {
          const path = findPath(player.x, player.y, cand.x, cand.y);
          if (path) {
            if (!bestPath || path.length < bestPath.length) {
              bestPath = path;
            }
          }
        });

        if (!bestPath || bestPath.length === 0) {
          addLog('No se encontró un camino libre hacia el objetivo.', 'player_miss');
          return;
        }

        // We found a path! Let's walk it!
        cancelAutoAlign();
        setIsAutoAligning(true);
        autoAlignPathRef.current = bestPath;

        // Spawn a temporary visual indicator at the destination coordinate on the game map
        const destTile = bestPath[bestPath.length - 1];
        if (rendererRef.current && destTile) {
          rendererRef.current.spawnAutoAlignIndicator(destTile.x, destTile.y);
        }

        const tickWalk = (stepIdx: number) => {
          const path = autoAlignPathRef.current;
          if (stepIdx >= path.length) {
            setIsAutoAligning(false);
            autoAlignTimeoutRef.current = null;
            // Execute physical attack once arrived
            setTimeout(() => {
              handlePlayerAttack();
            }, 80);
            return;
          }

          const currentPlayer = playerRef.current;
          if (!currentPlayer) return;

          const nextTile = path[stepIdx];
          const dx = nextTile.x - currentPlayer.x;
          const dy = nextTile.y - currentPlayer.y;

          // Pass `true` as third argument (isAuto)
          handlePlayerMove(dx, dy, true);

          autoAlignTimeoutRef.current = setTimeout(() => {
            tickWalk(stepIdx + 1);
          }, 180);
        };

        const nextTile = bestPath[0];
        const dx = nextTile.x - player.x;
        const dy = nextTile.y - player.y;
        handlePlayerMove(dx, dy, true);

        autoAlignTimeoutRef.current = setTimeout(() => {
          tickWalk(1);
        }, 180);

        return;
      }
    }

    if (!target) {
      target = activeMobs.find((m) => {
        const align = CombatEngine.isAligned(player.x, player.y, m.x, m.y, weaponRange);
        return align.aligned;
      }) || null;
    }

    // Check weapon arrows consumption
    if (player.equipment.weapon?.weaponType === 'bow') {
      const arrows = player.equipment.arrows;
      if (!arrows || (arrows.count || 0) <= 0) {
        addLog('¡No tienes flechas equipadas para disparar con el arco!', 'system');
        addFloatingText('¡Sin Flechas!', '#ef4444', player.x, player.y);
        return;
      }
      // Consume 1 arrow
      setPlayer((prev) => {
        if (!prev) return null;
        const remaining = (prev.equipment.arrows?.count || 1) - 1;
        return {
          ...prev,
          equipment: {
            ...prev.equipment,
            arrows: remaining > 0 ? { ...prev.equipment.arrows!, count: remaining } : null,
          },
        };
      });
      sound.playBowShot();
    } else {
      sound.playAttackSwing();
    }

    setPlayer((prev) => (prev ? { ...prev, lastAttackTimestamp: now } : null));

    if (!target) {
      addLog('Atacaste al aire (sin enemigo alineado en rango).', 'player_miss');
      let missX = player.x;
      let missY = player.y;
      if (player.facing === 'up') missY -= 1;
      else if (player.facing === 'down') missY += 1;
      else if (player.facing === 'left') missX -= 1;
      else if (player.facing === 'right') missX += 1;

      if (rendererRef.current) {
        rendererRef.current.triggerMissEffects(missX, missY);
      }
      return;
    }

    // Verify alignment in X or Y
    const alignCheck = CombatEngine.isAligned(player.x, player.y, target.x, target.y, weaponRange);
    if (!alignCheck.aligned) {
      addLog(`¡${target.name} no está en tu línea de ataque directa!`, 'player_miss');
      if (rendererRef.current) {
        rendererRef.current.triggerMissEffects(target.x, target.y);
      }
      return;
    }

    const mobTemplate = MOBS[target.templateId];
    if (!mobTemplate) return;

    // Execute attack formula
    const result = CombatEngine.executePlayerAttack(player, mobTemplate);

    if (result.hit) {
      // Track and update combo count synchronously
      const currentCombo = getUpdatedComboCount(target.instanceId, target.name);

      if (result.isCriticalStab || result.isCritical) {
        sound.playStab();
        rendererRef.current?.triggerCriticalHitShake(true, 0.7, 420, target.x, target.y);
        triggerImpactEffect('deal');
        const critLabel = result.isCriticalStab
          ? `¡APUÑALADA CRÍTICA ${result.damage}! ⚡`
          : `¡GOLPE CRÍTICO ${result.damage}! ⚡`;
        addFloatingText(critLabel, '#c084fc', target.x, target.y);
        addLog(result.message, 'stab');
      } else {
        sound.playHitImpact();
        addFloatingText(`-${result.damage}`, '#ef4444', target.x, target.y);
        addLog(result.message, 'player_hit');
      }

      // Update Mob HP
      const newHp = target.currentHp - result.damage;
      if (newHp <= 0) {
        handleMobDefeated(target, mobTemplate, currentCombo);
      } else {
        setActiveMobs((prev) =>
          prev.map((m) => (m.instanceId === target?.instanceId ? { ...m, currentHp: newHp, state: 'chasing' } : m))
        );
      }
    } else {
      addFloatingText('¡FALLO!', '#94a3b8', target.x, target.y);
      addLog(result.message, 'player_miss');
      if (rendererRef.current) {
        rendererRef.current.triggerMissEffects(target.x, target.y);
      }
    }

    // Apply skill progression by use (§6)
    if (result.skillUps.length > 0) {
      setPlayer((prev) => {
        if (!prev) return null;
        const { updatedPlayer, leveledSkills } = CombatEngine.applySkillGains(prev, result.skillUps);
        leveledSkills.forEach((skillName) => {
          addLog(`¡Tu habilidad [${skillName}] ha subido de nivel!`, 'system');
          addToast('¡Habilidad Mejorada!', skillName, '⭐', 'skill');
          sound.playLevelUp();
        });
        return updatedPlayer;
      });
    }
  };

  // --- COMBAT: PLAYER CASTS SPELL ---
  const handleCastSpell = (spell: Spell) => {
    if (!player || deathInfo) return;

    const now = Date.now();
    const lastCast = lastSpellTimestamps[spell.id] || 0;
    const cooldownMs = (spell.cooldownSec || 1.0) * 1000;
    if (now - lastCast < cooldownMs) {
      addLog(`¡${spell.name} está recargándose!`, 'system');
      addFloatingText(' Recargando', '#f59e0b', player.x, player.y);
      return;
    }

    if (player.currentMp < spell.manaCost) {
      addLog('¡No tienes suficiente maná!', 'system');
      addFloatingText('¡Sin Maná!', '#38bdf8', player.x, player.y);
      return;
    }

    setLastSpellTimestamps((prev) => ({ ...prev, [spell.id]: now }));
    // Consume MP
    setPlayer((prev) => (prev ? { ...prev, currentMp: prev.currentMp - spell.manaCost } : null));
    sound.playMagicSpell(spell.animation);

    if (spell.type === 'heal') {
      const healAmount = Math.floor(Math.random() * (spell.maxDamage - spell.minDamage + 1)) + spell.minDamage;
      setPlayer((prev) => {
        if (!prev) return null;
        return { ...prev, currentHp: Math.min(prev.maxHp, prev.currentHp + healAmount) };
      });
      addLog(`Canalizaste ${spell.name} y recuperaste ${healAmount} HP.`, 'spell');
      addFloatingText(`+${healAmount} HP`, '#4ade80', player.x, player.y);
      return;
    }

    // Target damage spell
    let target = targetMob;
    if (!target) {
      target = activeMobs.find((m) => {
        const align = CombatEngine.isAligned(player.x, player.y, m.x, m.y, spell.range);
        return align.aligned;
      }) || null;
    }

    if (!target) {
      addLog(`Lanzaste ${spell.name} pero no había ningún objetivo alineado.`, 'player_miss');
      let missX = player.x;
      let missY = player.y;
      if (player.facing === 'up') missY -= spell.range || 1;
      else if (player.facing === 'down') missY += spell.range || 1;
      else if (player.facing === 'left') missX -= spell.range || 1;
      else if (player.facing === 'right') missX += spell.range || 1;

      if (rendererRef.current) {
        rendererRef.current.triggerMissEffects(missX, missY);
      }
      return;
    }

    // Spawn projectile visual
    if (rendererRef.current) {
      rendererRef.current.spawnSpellEffect(player.x, player.y, target.x, target.y, spell.color);
    }

    const mobTemplate = MOBS[target.templateId];
    if (!mobTemplate) return;

    const rawSpellDamage =
      Math.floor(Math.random() * (spell.maxDamage - spell.minDamage + 1)) +
      spell.minDamage +
      Math.floor(player.stats.inteligencia / 4) +
      Math.floor(player.skills.magia.level * 0.2);

    const effectiveSpellDamage = Math.max(1, rawSpellDamage - Math.floor(mobTemplate.magicResist * 0.4));

    const isHeavySpell = ['apocalipsis', 'golpe_sismico', 'lluvia_flechas', 'grito_guerra'].includes(spell.id);
    const isSpellCrit = isHeavySpell || Math.random() < 0.20;

    let finalSpellDamage = effectiveSpellDamage;
    if (isSpellCrit) {
      finalSpellDamage = Math.round(effectiveSpellDamage * 1.45);
      rendererRef.current?.triggerCriticalHitShake(true, 0.72, 450, target.x, target.y);
      triggerImpactEffect('deal');
      addFloatingText(`✨ ¡CRÍTICO -${finalSpellDamage}! ✨`, spell.color, target.x, target.y);
      addLog(`¡IMPACTO CRÍTICO MÁGICO! Tu ${spell.name} devastó a ${target.name} por ${finalSpellDamage} de daño mágico.`, 'spell');
    } else {
      addFloatingText(`✨ -${effectiveSpellDamage}`, spell.color, target.x, target.y);
      addLog(`Tu ${spell.name} impactó a ${target.name} por ${effectiveSpellDamage} de daño mágico.`, 'spell');
    }

    const currentCombo = getUpdatedComboCount(target.instanceId, target.name);

    const newHp = target.currentHp - finalSpellDamage;
    if (newHp <= 0) {
      handleMobDefeated(target, mobTemplate, currentCombo);
    } else {
      setActiveMobs((prev) =>
        prev.map((m) => (m.instanceId === target?.instanceId ? { ...m, currentHp: newHp, state: 'chasing' } : m))
      );
    }

    // Magic skill gain
    setPlayer((prev) => {
      if (!prev) return null;
      const { updatedPlayer, leveledSkills } = CombatEngine.applySkillGains(prev, [{ skill: 'magia', amount: 12 }]);
      leveledSkills.forEach((sn) => addLog(`¡Tu maestría de [${sn}] ha subido de nivel!`, 'system'));
      return updatedPlayer;
    });
  };

  // --- MOB DEFEATED & LOOT REWARD ---
  const handleMobDefeated = (mob: ActiveMob, template: typeof MOBS[string], finalComboCount: number = 0) => {
    sound.playHitImpact(true);
    addLog(`¡Derrotaste a ${mob.name}!`, 'system');

    // Experience & Gold gains
    let expGain = template.expReward;
    let goldGain = Math.floor(Math.random() * (template.goldMax - template.goldMin + 1)) + template.goldMin;

    // Revenge bonus (§5.8)
    if (mob.isRevengeTarget) {
      expGain = Math.round(expGain * 1.8);
      goldGain = Math.round(goldGain * 2.0);
      addLog(`¡VENGANZA CUMPLIDA! Bonificación de oro y EXP obtenida.`, 'system');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    }

    // Combo EXP Bonus
    if (finalComboCount >= 2) {
      const bonusMultiplier = Math.min(0.50, (finalComboCount - 1) * 0.05);
      const comboBonusExp = Math.round(template.expReward * bonusMultiplier);
      if (comboBonusExp > 0) {
        expGain += comboBonusExp;
        addLog(`¡Combo x${finalComboCount}! ⭐ +${comboBonusExp} EXP adicionales por la cadena de golpes.`, 'loot');
        addFloatingText(`+${comboBonusExp} EXP Combo x${finalComboCount}!`, '#e9d5ff', mob.x, mob.y - 1.0);
      }
    }

    // Clear combo state on mob defeat
    setComboCount(0);
    setComboTargetInstanceId(null);
    setComboTargetName(null);

    addFloatingText(`+${expGain} EXP`, '#38bdf8', mob.x, mob.y);
    addFloatingText(`+${goldGain} Oro`, '#fbbf24', mob.x, mob.y - 0.5);

    // Roll item drops
    const droppedItems: Item[] = [];
    template.drops.forEach((drop) => {
      const roll = Math.random();
      if (roll <= drop.chance) {
        const itemData = ITEMS[drop.itemId];
        if (itemData) {
          const count = drop.minCount ? Math.floor(Math.random() * (drop.maxCount! - drop.minCount + 1)) + drop.minCount : 1;
          droppedItems.push({ ...itemData, count });
        }
      }
    });

    // Helper to apply EXP and handle Level Up
    const applyExpReward = (amount: number) => {
      setPlayer((prev) => {
        if (!prev) return null;
        let newExp = prev.exp + amount;
        let newLevel = prev.level;
        let newExpToNext = prev.expToNextLevel;
        let maxHp = prev.maxHp;
        let maxMp = prev.maxMp;
        let currentHp = prev.currentHp;
        let currentMp = prev.currentMp;

        // Level up check
        if (newExp >= newExpToNext) {
          newLevel += 1;
          newExp = newExp - newExpToNext;
          newExpToNext = Math.round(newExpToNext * 1.5);
          maxHp += 15;
          maxMp += 10;
          currentHp = maxHp;
          currentMp = maxMp;
          sound.playLevelUp();
          addLog(`¡SUBISTE AL NIVEL ${newLevel}! Salud y maná restaurados.`, 'system');
          addToast('¡SUBISTE DE NIVEL!', `Alcanzaste el Nivel ${newLevel}`, '🏆', 'level');
          confetti({ particleCount: 70, spread: 90, origin: { y: 0.4 } });
        }

        return {
          ...prev,
          level: newLevel,
          exp: newExp,
          expToNextLevel: newExpToNext,
          maxHp,
          maxMp,
          currentHp,
          currentMp,
        };
      });
    };

    // Helper to add gold
    const applyGoldReward = (amount: number) => {
      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gold: prev.gold + amount,
        };
      });
    };

    // Helper to add an item
    const applyItemReward = (item: Item) => {
      if (gameSettings.autoPickup && !shouldAutoPickupItem(item, gameSettings.autoPickupFilters)) {
        addLog(`[Filtro Auto-Pickup] Ignorado por preferencia: ${item.name}`, 'system');
        return;
      }

      setPlayer((prev) => {
        if (!prev) return null;
        const { inventory: newInventory, success, stacked } = addItemToInventory(prev.inventory, item, item.count || 1);
        if (success) {
          addLog(`¡Encontraste botín: ${item.name} (x${item.count || 1})${stacked ? ' [Apilado en mochila]' : ''}!`, 'loot');
        } else {
          addLog(`¡Inventario lleno! No pudiste recoger: ${item.name}`, 'system');
        }
        return {
          ...prev,
          inventory: newInventory,
        };
      });
    };

    // Update quest objectives and boss states immediately (non-delayed stats)
    setPlayer((prev) => {
      if (!prev) return null;
      const updatedQuests = prev.activeQuests.map((q) => {
        if (q.objectiveType === 'kill' && q.targetId === mob.templateId) {
          return { ...q, currentAmount: q.currentAmount + 1 };
        }
        return q;
      });

      const defeatedBosses = template.isBoss && !prev.defeatedBosses.includes(template.id)
        ? [...prev.defeatedBosses, template.id]
        : prev.defeatedBosses;

      return {
        ...prev,
        activeQuests: updatedQuests,
        defeatedBosses,
        revengeTargetTemplateId: mob.isRevengeTarget ? undefined : prev.revengeTargetTemplateId,
      };
    });

    // Spawn 3D Animated Loot with customized delay loops
    if (rendererRef.current) {
      // 1. Spawn EXP Star
      rendererRef.current.spawnLootAnimation(mob.x, mob.y, '⭐', () => {
        applyExpReward(expGain);
      });

      // 2. Spawn Gold coin
      if (goldGain > 0) {
        if (!gameSettings.autoPickup || shouldAutoPickupItem('gold', gameSettings.autoPickupFilters)) {
          setTimeout(() => {
            if (rendererRef.current) {
              rendererRef.current.spawnLootAnimation(mob.x, mob.y, '🪙', () => {
                applyGoldReward(goldGain);
                sound.playLoot();
              });
            }
          }, 120);
        } else {
          addLog(`[Filtro Auto-Pickup] Monedas de oro ignoradas (🪙 ${goldGain})`, 'system');
        }
      }

      // 3. Spawn Items
      droppedItems.forEach((dropItem, idx) => {
        if (gameSettings.autoPickup && !shouldAutoPickupItem(dropItem, gameSettings.autoPickupFilters)) {
          addLog(`[Filtro Auto-Pickup] Ignorado por preferencia: ${dropItem.name}`, 'system');
          return;
        }

        setTimeout(() => {
          if (rendererRef.current) {
            rendererRef.current.spawnLootAnimation(mob.x, mob.y, dropItem.icon, () => {
              applyItemReward(dropItem);
              sound.playLoot();
            });
          }
        }, 240 + idx * 150);
      });
    } else {
      // Fallback
      applyExpReward(expGain);
      if (goldGain > 0 && (!gameSettings.autoPickup || shouldAutoPickupItem('gold', gameSettings.autoPickupFilters))) {
        applyGoldReward(goldGain);
      }
      droppedItems.forEach((dropItem) => {
        applyItemReward(dropItem);
      });
    }

    // Remove mob from active list
    setActiveMobs((prev) => prev.filter((m) => m.instanceId !== mob.instanceId));
    if (targetMob?.instanceId === mob.instanceId) {
      setSelectedTarget(null);
    }
  };

  // --- MOB AI & ATTACK LOOP (callback wired into central GameLoop via ref) ---
  mobAICallbackRef.current = () => {
    const now = Date.now();
    const p = playerRef.current;
    if (!p) return;
    if (useUIStore.getState().deathInfo) return;
    const map = currentMapRef.current;
    const night = isNightRef.current;

    setActiveMobs((currentMobs) =>
      currentMobs.map((mob) => {
        const template = MOBS[mob.templateId];
        if (!template) return mob;

        const distToPlayer = Math.hypot(mob.x - p.x, mob.y - p.y);
        const playerTile = map.tiles[Math.floor(p.y)]?.[Math.floor(p.x)] ?? 0;
        const playerOnPath = playerTile === 8;
        const baseAgroRange = mob.isBoss ? (playerOnPath ? 2 : 7) : (playerOnPath ? 1 : 5);
        const agroRange = night ? baseAgroRange + 2 : baseAgroRange;

        // If stealthed, mobs lose agro (§5.7)
        if (p.isStealthed) {
          return { ...mob, state: 'idle', lastAgroTime: undefined };
        }

        // Short-term aggro memory (3 seconds)
        const hasAgroMemory = mob.lastAgroTime !== undefined && (now - mob.lastAgroTime < 3000);
        const hasAgroRange = distToPlayer <= agroRange;
        const hasAgro = hasAgroRange || hasAgroMemory;

        const updatedLastAgroTime = hasAgroRange ? now : mob.lastAgroTime;

        // Check if aligned and in range to attack player
        const alignCheck = CombatEngine.isAligned(mob.x, mob.y, p.x, p.y, template.range);

        if (hasAgro && alignCheck.aligned && now - mob.lastAttackTime >= mob.attackIntervalMs) {
          // Mob executes attack against player (nocturnal bonus at night)
          const effectiveTemplate = night
            ? {
                ...template,
                minHit: Math.round(template.minHit * 1.15),
                maxHit: Math.round(template.maxHit * 1.15),
                minHitToPlayer: template.minHitToPlayer ? Math.round(template.minHitToPlayer * 1.15) : undefined,
                maxHitToPlayer: template.maxHitToPlayer ? Math.round(template.maxHitToPlayer * 1.15) : undefined,
              }
            : template;
          const result = CombatEngine.executeMobAttack(effectiveTemplate, p);

          if (result.blocked) {
            sound.playShieldBlock();
            addFloatingText('¡BLOQUEO!', '#38bdf8', p.x, p.y);
            addLog(result.message, 'block');
          } else if (result.hit) {
            sound.playHitImpact();
            if (result.isCritical) {
              rendererRef.current?.triggerCriticalHitShake(false, 0.78, 480, p.x, p.y);
              triggerImpactEffect('receive');
              addFloatingText(`¡CRÍTICO -${result.damage}! 💀`, '#f43f5e', p.x, p.y);
              addLog(result.message, 'mob_hit');
            } else {
              rendererRef.current?.triggerScreenShake(0.35, 250);
              addFloatingText(`-${result.damage}`, '#ef4444', p.x, p.y);
              addLog(result.message, 'mob_hit');
            }

            const newPlayerHp = p.currentHp - result.damage;
            if (newPlayerHp <= 0) {
              // Player Defeat (§5.8)
              sound.playPlayerDeath();
              const goldPenalty = Math.round(p.gold * 0.1);
              useUIStore.getState().setDeathInfo({ killerName: mob.name, goldLost: goldPenalty });
              setPlayer((prev) => (prev ? { ...prev, currentHp: 0, revengeTargetTemplateId: mob.templateId } : null));
            } else {
              setPlayer((prev) => (prev ? { ...prev, currentHp: newPlayerHp } : null));
            }
          } else {
            addFloatingText('¡ESQUIVASTE!', '#4ade80', p.x, p.y);
            addLog(result.message, 'player_miss');
          }

          return {
            ...mob,
            lastAttackTime: now,
            state: 'attacking',
            lastAgroTime: updatedLastAgroTime,
          };
        }

        // Chase player if in agro range or retains short-term aggro memory
        if (hasAgro && distToPlayer > 1) {
          let nextX = mob.x;
          let nextY = mob.y;

          const dx = p.x - mob.x;
          const dy = p.y - mob.y;

          // Simple pathing towards alignment with player
          if (Math.abs(dx) > Math.abs(dy)) {
            nextX += dx > 0 ? 1 : -1;
          } else if (dy !== 0) {
            nextY += dy > 0 ? 1 : -1;
          }

          // Check tile collision for mob
          const tile = map.tiles[nextY]?.[nextX] ?? 1;
          if (tile !== 1) {
            return {
              ...mob,
              x: nextX,
              y: nextY,
              state: 'chasing',
              lastAgroTime: updatedLastAgroTime,
            };
          }
        }

        const nextState = hasAgro ? mob.state : 'idle';
        return {
          ...mob,
          lastAgroTime: updatedLastAgroTime,
          state: nextState,
        };
      })
    );
  };

  // --- CENTRAL GAME LOOP SETUP ---
  // One requestAnimationFrame drives all timed systems (day/night, combo,
  // dash, attack cooldown, mob AI) via accumulator cadences — replacing the
  // scattered React setInterval timers.
  useEffect(() => {
    const loop = new GameLoop();

    // Day/Night cycle (~1s cadence)
    loop.register('dayNight', 1000, advanceDayNight);

    // Combo timer window (50ms cadence)
    loop.register('combo', 50, tickCombo);

    // Dash cooldown (50ms cadence)
    loop.register('dash', 50, tickDash);

    // Attack cooldown (40ms cadence)
    loop.register('attackCooldown', 40, tickAttackCooldown);

    // Mob AI (700ms cadence)
    loop.register('mobAI', 700, () => {
      mobAICallbackRef.current?.();
    });

    gameLoopRef.current = loop;
    loop.start();

    return () => {
      loop.dispose();
      gameLoopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- QUICK POTION DRINK ---
  const handleUsePotion = (type: 'hp' | 'mp') => {
    if (!player || deathInfo) return;

    const potionId = type === 'hp' ? 'pocion_roja' : 'pocion_azul';
    const invIndex = player.inventory.findIndex((i) => i?.id === potionId);

    if (invIndex === -1) {
      addLog(`¡No tienes ${type === 'hp' ? 'Pociones de Vida' : 'Pociones de Maná'}!`, 'system');
      return;
    }

    const item = player.inventory[invIndex]!;
    sound.playPotion();

    setPlayer((prev) => {
      if (!prev) return null;
      const newInv = [...prev.inventory];
      const count = (item.count || 1) - 1;

      if (count > 0) {
        newInv[invIndex] = { ...item, count };
      } else {
        newInv[invIndex] = null;
      }

      const newHp = type === 'hp' ? Math.min(prev.maxHp, prev.currentHp + (item.hpRestore || 45)) : prev.currentHp;
      const newMp = type === 'mp' ? Math.min(prev.maxMp, prev.currentMp + (item.mpRestore || 40)) : prev.currentMp;

      return {
        ...prev,
        currentHp: newHp,
        currentMp: newMp,
        inventory: newInv,
      };
    });

    if (type === 'hp') {
      addFloatingText(`+${item.hpRestore || 45} HP`, '#22c55e', player.x, player.y);
      addLog('Bebiste una Poción Roja de Vida.', 'loot');
    } else {
      addFloatingText(`+${item.mpRestore || 40} MP`, '#38bdf8', player.x, player.y);
      addLog('Bebiste una Poción Azul de Maná.', 'loot');
    }
  };

  // --- STEALTH TOGGLE ---
  const handleToggleStealth = () => {
    if (!player || deathInfo) return;
    const isNowStealthed = !player.isStealthed;
    setPlayer((prev) => (prev ? { ...prev, isStealthed: isNowStealthed } : null));
    sound.playPotion();
    addLog(isNowStealthed ? 'Entraste en modo sigilo (los enemigos no te detectan).' : 'Saliste del modo sigilo.', 'system');
  };

  // --- RESPAWN AFTER DEATH ---
  const handleRespawn = () => {
    if (!player) return;
    const goldPenalty = deathInfo?.goldLost || 0;

    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentHp: prev.maxHp,
        currentMp: prev.maxMp,
        gold: Math.max(0, prev.gold - goldPenalty),
        currentMapId: 'pueblo_inicial',
        x: 12,
        y: 12,
      };
    });

    useUIStore.getState().setDeathInfo(null);
    setCurrentMap(MAPS.pueblo_inicial);
    spawnMobsForMap(MAPS.pueblo_inicial, player.revengeTargetTemplateId);
    addLog('Reapareciste en la Villa de Ullathorpe.', 'system');
  };

  // --- JOB PROMOTION SYSTEM (§7.1) ---
  const handlePromoteJob = (targetClass: CharacterClass) => {
    if (!player) return;

    const jobQuestMap: Record<string, string> = {
      guerrero: 'quest_job_guerrero',
      cazador: 'quest_job_cazador',
      mago: 'quest_job_mago',
      picaro: 'quest_job_asesino',
    };
    const questId = jobQuestMap[targetClass];
    const quest = player.activeQuests.find((q) => q.id === questId);

    if (quest && !quest.completed && quest.currentAmount < quest.requiredAmount) {
      addToast('Prueba Requerida', `Completa [${quest.title}] (${quest.currentAmount}/${quest.requiredAmount}) antes de promocionar.`, '📜', 'quest');
      addLog(`Debes completar la misión de clase "${quest.title}" para convertirte en ${targetClass.toUpperCase()}.`, 'system');
      return;
    }

    sound.playLevelUp();
    confetti({ particleCount: 90, spread: 90, origin: { y: 0.4 } });

    setPlayer((prev) => {
      if (!prev) return null;
      const newEq = { ...prev.equipment };
      const newSpells = [...prev.knownSpells];

      let autoSpellsToEquip: string[] = [];

      if (targetClass === 'guerrero') {
        newEq.weapon = { ...ITEMS.espada_corta };
        newEq.shield = { ...ITEMS.escudo_madera };
        newEq.armor = { ...ITEMS.armadura_cuero };
        autoSpellsToEquip = ['grito_guerra', 'golpe_sismico'];
      } else if (targetClass === 'cazador') {
        newEq.weapon = { ...ITEMS.arco_simple };
        newEq.arrows = { ...ITEMS.flechas, count: 50 };
        newEq.armor = { ...ITEMS.armadura_cuero };
        autoSpellsToEquip = ['lluvia_flechas', 'trampa_cazador'];
      } else if (targetClass === 'mago') {
        newEq.weapon = { ...ITEMS.baculo_aprendiz };
        newEq.armor = { ...ITEMS.tunica_lino };
        autoSpellsToEquip = ['dardo_magico', 'escudo_magico', 'apocalipsis'];
      } else if (targetClass === 'picaro') {
        newEq.weapon = { ...ITEMS.daga_simple };
        newEq.armor = { ...ITEMS.armadura_cuero };
        autoSpellsToEquip = ['golpe_fantasma', 'humo_cegador'];
      }

      autoSpellsToEquip.forEach((spId) => {
        if (!newSpells.includes(spId)) newSpells.push(spId);
      });

      const equippedSpells = [
        autoSpellsToEquip[0] || prev.equippedSpells[0] || null,
        autoSpellsToEquip[1] || prev.equippedSpells[1] || null,
        autoSpellsToEquip[2] || prev.equippedSpells[2] || null,
        autoSpellsToEquip[3] || prev.equippedSpells[3] || null,
      ];

      return {
        ...prev,
        classType: targetClass,
        jobStage: 'primer_job',
        jobTitle: targetClass.toUpperCase(),
        equipment: newEq,
        knownSpells: newSpells,
        equippedSpells,
        maxMp: prev.maxMp < 80 ? 80 : prev.maxMp,
        currentMp: prev.maxMp < 80 ? 80 : prev.currentMp,
      };
    });

    useUIStore.getState().setActiveDialogueNpc(null);
    addToast('¡PROMOCIÓN DE JOB!', `¡Te has graduado como ${targetClass.toUpperCase()}!`, '⚔️', 'level');
    addLog(`¡Felicidades! Has sido promocionado exitosamente a la clase ${targetClass.toUpperCase()}.`, 'system');
  };

  // Modal actions (inventory, quest, shop and crafting handlers)
  const getItem = useCallback(
    (id: string) => contentRegistry.getItem(id) || ITEMS[id],
    []
  );
  const {
    handleConsolidateInventory,
    handleEquipItem,
    handleUnequipItem,
    handleUseItem,
    handleDropItem,
    handleClaimQuestReward,
    handleBuyItem,
    handleSellItem,
    handleCraft,
  } = useModalActions({
    player,
    setPlayer,
    addLog,
    addToast,
    addFloatingText,
    handleUsePotion,
    getItem,
  });

  // Helper counts for potions
  const hpPotionCount =
    player?.inventory.reduce((acc, i) => (i?.id === 'pocion_roja' ? acc + (i.count || 1) : acc), 0) || 0;
  const mpPotionCount =
    player?.inventory.reduce((acc, i) => (i?.id === 'pocion_azul' ? acc + (i.count || 1) : acc), 0) || 0;

  // Contextual interact
  const contextual = getContextualInteract();

  const isAlignedWithTarget = !!(
    targetMob &&
    player &&
    CombatEngine.isAligned(player.x, player.y, targetMob.x, targetMob.y, player.equipment.weapon?.range || 1).aligned
  );

  return (
    <main className="relative w-full h-full bg-slate-950 overflow-hidden font-sans select-none">
      {/* 3D Game Canvas */}
      {player && (
        <GameCanvas
          currentMap={currentMap}
          player={player}
          activeMobs={activeMobs}
          selectedTarget={selectedTarget}
          floatingTexts={floatingTexts}
          onSelectTarget={setSelectedTarget}
          onPlayerMove={handlePlayerPositionChange}
          rendererRef={rendererRef}
        />
      )}

      {/* Critical Hit Impact Fullscreen Vignette Overlay */}
      {critEffect && (
        <div
          key={`vignette-${critEffect.key}`}
          className={`fixed inset-0 pointer-events-none z-20 ${
            critEffect.type === 'deal' ? 'crit-vignette-deal' : 'crit-vignette-receive'
          }`}
        />
      )}

      {/* Top HUD */}
      {player && (
        <HUD
          player={player}
          currentMap={currentMap}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = sound.toggleMute();
            setIsMuted(muted);
          }}
          onOpenInventory={toggleInventory}
          onOpenSkills={toggleSkills}
          onOpenQuests={toggleQuests}
          onOpenHelp={toggleHelp}
          onOpenDataStudio={toggleDataStudio}
          onOpenSettings={toggleSettings}
          autoPickupEnabled={gameSettings.autoPickup}
          onUsePotion={handleUsePotion}
          hpPotionCount={hpPotionCount}
          mpPotionCount={mpPotionCount}
          isAutoAligning={isAutoAligning}
          critEffect={critEffect}
          timeProgress={timeProgress}
          isNight={isNight}
          comboCount={comboCount}
          comboTargetName={comboTargetName}
          comboTimeLeftPercent={comboTimeLeftPercent}
        />
      )}

      {/* Toast Notifications */}
      <ToastNotification
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Orientation Suggestion for Mobile */}
      <OrientationPrompt />

      {/* Minimap Radar */}
      {player && <Minimap currentMap={currentMap} player={player} activeMobs={activeMobs} />}

      {/* Mobile & Keyboard Controls / Joystick & Action Buttons */}
      {player && !deathInfo && (
        <MobileControls
          rendererRef={rendererRef}
          onMove={handlePlayerMove}
          onAttack={handlePlayerAttack}
          onDash={handleDash}
          onCastSpell={handleCastSpell}
          onUsePotion={handleUsePotion}
          onToggleStealth={handleToggleStealth}
          onInteract={contextual.action}
          interactLabel={contextual.label}
          attackCooldownPercent={attackCooldownPercent}
          dashCooldownPercent={dashCooldownPercent}
          isStealthed={player.isStealthed}
          canStealth={player.classType === 'picaro' || player.skills.apunalar.level >= 10}
          knownSpells={player.knownSpells}
          equippedSpells={player.equippedSpells}
          lastSpellTimestamps={lastSpellTimestamps}
          onUpdateEquippedSpells={(newEquipped) => setPlayer((prev) => (prev ? { ...prev, equippedSpells: newEquipped } : null))}
          playerMp={player.currentMp}
          hpPotionCount={hpPotionCount}
          mpPotionCount={mpPotionCount}
          isAlignedWithTarget={isAlignedWithTarget}
          onCycleTarget={handleCycleTarget}
          onToggleInventory={toggleInventory}
          onToggleSkills={toggleSkills}
          onToggleQuests={toggleQuests}
          onToggleHelp={toggleHelp}
          onToggleSettings={toggleSettings}
          onCloseModals={() => {
            closeAllModals();
            const st = useUIStore.getState();
            st.setActiveShop(null);
            st.setActiveCrafting(null);
            st.setActiveDialogueNpc(null);
          }}
          isAutoAligning={isAutoAligning}
        />
      )}

      {/* Combat Log Console */}
      <CombatLog logs={combatLogs} />

      {/* Title Screen / Character Creation */}
      {!player && (
        isCharacterCreating ? (
          <ClassSelectModal
            onStartGame={(name, classType) => {
              const newPlayer = createInitialPlayer(name, classType);
              const targetSlot = creatingSlotIndex ?? 0;
              saveActiveSlot(targetSlot);
              const updated = saveCharacterToSlot(targetSlot, newPlayer);
              setCharacterSlots([...updated]);
              setPlayer(newPlayer);
              setIsCharacterCreating(false);
              setCreatingSlotIndex(null);
              const startMap = MAPS[newPlayer.currentMapId] || MAPS.pueblo_inicial;
              setCurrentMap(startMap);
              spawnMobsForMap(startMap);
              const startMsg = `¡Bienvenido a Arandor, ${newPlayer.name}! Tu aventura comienza en la ciudad segura de Villa Ullathorpe.`;
              addLog(startMsg, 'system');
            }}
          />
        ) : (
          <TitleScreen
            slots={characterSlots}
            onSelectSlot={handleSelectSlot}
            onCreateCharacter={handleStartCreateCharacter}
            onDeleteSlot={handleDeleteSlot}
          />
        )
      )}

      {/* Inventory & Equipment Modal */}
      {player && (
        <InventoryModal
          player={player}
          onConsolidateInventory={handleConsolidateInventory}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onUseItem={handleUseItem}
          onDropItem={handleDropItem}
        />
      )}

      {/* Skills Mastery & Spellbook Modal */}
      {player && (
        <SkillsModal
          player={player}
          onCastSpell={handleCastSpell}
          onUpdateEquippedSpells={(newEquipped) => setPlayer((prev) => (prev ? { ...prev, equippedSpells: newEquipped } : null))}
        />
      )}

      {/* Quests Modal */}
      {player && (
        <QuestModal
          quests={player.activeQuests}
          onClaimReward={handleClaimQuestReward}
        />
      )}

      {/* Shop Modal */}
      {activeShop && player && (
        <ShopModal
          shopType={activeShop}
          player={player}
          onClose={() => useUIStore.getState().setActiveShop(null)}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
        />
      )}

      {/* Crafting Modal */}
      {activeCrafting && player && (
        <CraftingModal
          station={activeCrafting}
          player={player}
          onClose={() => useUIStore.getState().setActiveCrafting(null)}
          onCraft={handleCraft}
        />
      )}

      {/* Dialogue Modal */}
      {activeDialogueNpc && (
        <DialogueModal
          npc={activeDialogueNpc}
          onClose={() => useUIStore.getState().setActiveDialogueNpc(null)}
          onOpenShop={(type) => useUIStore.getState().setActiveShop(type)}
          onOpenCrafting={(station) => useUIStore.getState().setActiveCrafting(station)}
          onOpenQuests={() => useUIStore.getState().openModal('quests')}
          onPromoteJob={handlePromoteJob}
          playerClass={player?.classType}
        />
      )}

      {/* Help & Guide Modal */}
      <HelpModal onClose={closeHelp} />

      {/* Data Studio & Content Registry Modal */}
      <DataStudioModal />

      {/* Settings & Game Options Modal */}
      <SettingsModal
        settings={gameSettings}
        onUpdateSettings={updateGameSettings}
        onToggleMute={() => {
          const muted = sound.toggleMute();
          setIsMuted(muted);
          updateGameSettings({ soundMuted: muted });
        }}
        onReturnToTitle={() => {
          if (player) {
            saveGameState(player);
          }
          setPlayer(null);
          refreshSlots();
        }}
      />

      {/* Death Modal (§5.8) */}
      {deathInfo && (
        <DeathModal
          killerMobName={deathInfo.killerName}
          goldLost={deathInfo.goldLost}
          onRespawn={handleRespawn}
        />
      )}
    </main>
  );
}
