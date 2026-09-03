import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { Dispatch, SetStateAction } from 'react';
import type { Item, PlayerCharacter, CraftingRecipe, CombatLogEntry } from '../types/game';
import { sound } from '../services/sound';
import { addItemToInventory, consolidateInventory } from '../utils/inventoryUtils';

interface UseModalActionsOptions {
  player: PlayerCharacter | null;
  setPlayer: Dispatch<SetStateAction<PlayerCharacter | null>>;
  addLog: (text: string, type: CombatLogEntry['type']) => void;
  addToast: (title: string, subtitle?: string, icon?: string, type?: string) => void;
  addFloatingText: (text: string, color: string, x: number, y: number, durationMs?: number) => void;
  handleUsePotion: (type: 'hp' | 'mp') => void;
  getItem: (id: string) => Item | undefined;
}

/** Handlers for the inventory, quest, shop and crafting modals (extracted from App.tsx). */
export function useModalActions({
  player,
  setPlayer,
  addLog,
  addToast,
  addFloatingText,
  handleUsePotion,
  getItem,
}: UseModalActionsOptions) {
  const handleConsolidateInventory = useCallback(() => {
    setPlayer((prev) => {
      if (!prev) return null;
      const consolidated = consolidateInventory(prev.inventory);
      addLog('Inventario organizado y apilado con éxito.', 'system');
      addToast('Inventario Apilado', 'Se agruparon todos los elementos duplicados.', '📦', 'system');
      return { ...prev, inventory: consolidated };
    });
  }, [setPlayer, addLog, addToast]);

  const handleEquipItem = useCallback(
    (item: Item, index: number) => {
      setPlayer((prev) => {
        if (!prev) return null;
        const newInv = [...prev.inventory];
        const newEq = { ...prev.equipment };

        let slotKey: keyof PlayerCharacter['equipment'] = 'weapon';
        if (item.type === 'weapon') slotKey = 'weapon';
        else if (item.type === 'shield') slotKey = 'shield';
        else if (item.type === 'helmet') slotKey = 'helmet';
        else if (item.type === 'armor') slotKey = 'armor';
        else if (item.type === 'boots') slotKey = 'boots';
        else if (item.type === 'ring') slotKey = newEq.ring1 ? 'ring2' : 'ring1';
        else if (item.type === 'amulet') slotKey = 'amulet';
        else if (item.type === 'arrow') slotKey = 'arrows';

        const previousEquipped = newEq[slotKey];
        newEq[slotKey] = item;
        newInv[index] = previousEquipped;

        sound.playLoot();
        addLog(`Te equipaste: ${item.name}`, 'system');

        return { ...prev, inventory: newInv, equipment: newEq };
      });
    },
    [setPlayer, addLog]
  );

  const handleUnequipItem = useCallback(
    (slot: keyof PlayerCharacter['equipment']) => {
      setPlayer((prev) => {
        if (!prev) return null;
        const currentItem = prev.equipment[slot];
        if (!currentItem) return prev;

        const emptyIdx = prev.inventory.findIndex((i) => i === null);
        if (emptyIdx === -1) {
          addLog('¡Tu mochila está llena!', 'system');
          return prev;
        }

        const newInv = [...prev.inventory];
        newInv[emptyIdx] = currentItem;
        const newEq = { ...prev.equipment, [slot]: null };

        sound.playLoot();
        addLog(`Te desequipaste: ${currentItem.name}`, 'system');

        return { ...prev, inventory: newInv, equipment: newEq };
      });
    },
    [setPlayer, addLog]
  );

  const handleUseItem = useCallback(
    (item: Item, index: number) => {
      if (item.type === 'potion') {
        if (item.hpRestore) handleUsePotion('hp');
        if (item.mpRestore) handleUsePotion('mp');
      } else if (item.id === 'libro_hechizo_apocalipsis') {
        setPlayer((prev) => {
          if (!prev) return null;
          if (prev.knownSpells.includes('apocalipsis')) {
            addToast('Ya Aprendido', 'Ya conoces el conjuro Apocalipsis.', '📜', 'system');
            return prev;
          }
          const newInv = [...prev.inventory];
          newInv[index] = null;
          const newSpells = [...prev.knownSpells, 'apocalipsis'];
          sound.playLevelUp();
          confetti({ particleCount: 50, spread: 70 });
          addToast('¡Hechizo Aprendido!', 'Has dominado el hechizo definitivo: ¡Apocalipsis!', '🔥', 'level');
          addLog('Has estudiado el Grimorio de Apocalipsis. El conjuro definitivo ahora está disponible en tu libro de hechizos.', 'system');
          return { ...prev, inventory: newInv, knownSpells: newSpells };
        });
      } else if (item.id === 'libro_herreria_intermedia') {
        setPlayer((prev) => {
          if (!prev) return null;
          const newInv = [...prev.inventory];
          newInv[index] = null;
          const newSkills = { ...prev.skills };
          newSkills.herreria = { ...newSkills.herreria, level: Math.min(100, newSkills.herreria.level + 10) };
          sound.playLevelUp();
          addToast('¡Conocimiento de Forja!', 'Tu herrería aumentó en +10 niveles.', '🔨', 'level');
          addLog('Leíste el Tomo de Herrería Intermedia. Tu habilidad de forja aumentó notablemente.', 'system');
          return { ...prev, inventory: newInv, skills: newSkills };
        });
      }
    },
    [setPlayer, addToast, addLog, handleUsePotion]
  );

  const handleDropItem = useCallback(
    (index: number) => {
      setPlayer((prev) => {
        if (!prev) return null;
        const newInv = [...prev.inventory];
        const dropped = newInv[index];
        newInv[index] = null;
        if (dropped) addLog(`Tiraste: ${dropped.name}`, 'system');
        return { ...prev, inventory: newInv };
      });
    },
    [setPlayer, addLog]
  );

  const handleClaimQuestReward = useCallback(
    (questId: string) => {
      setPlayer((prev) => {
        if (!prev) return null;
        const quest = prev.activeQuests.find((q) => q.id === questId);
        if (!quest) return prev;

        sound.playLevelUp();
        confetti({ particleCount: 40, spread: 60 });
        addLog(`¡Completaste [${quest.title}]! Recompensa: 🪙 ${quest.goldReward} Oro, ⭐ ${quest.expReward} EXP.`, 'loot');
        addToast('¡Misión Completada!', quest.title, '📜', 'quest');

        const newQuests = prev.activeQuests.map((q) => (q.id === questId ? { ...q, claimed: true } : q));
        let newInv = [...prev.inventory];

        if (quest.itemReward) {
          const rewardItem = getItem(quest.itemReward.itemId);
          if (rewardItem) {
            const updatedInv = addItemToInventory(newInv, rewardItem, quest.itemReward.count);
            if (updatedInv.success) {
              newInv = updatedInv.inventory;
              addLog(`Recibiste objeto de recompensa: ${rewardItem.name} (x${quest.itemReward.count})`, 'loot');
            } else {
              addLog(`¡Inventario lleno! No se pudo guardar la recompensa de ítem.`, 'system');
            }
          }
        }

        let newJobStage = prev.jobStage;
        let newJobTitle = prev.jobTitle;
        let newMaxHp = prev.maxHp;
        let newMaxMp = prev.maxMp;

        if (questId === 'quest_segundo_job_maestria' && prev.jobStage === 'primer_job') {
          newJobStage = 'segundo_job';
          const classTitles: Record<string, string> = {
            guerrero: 'PALADÍN / CABALLERO DE ÉLITE',
            cazador: 'FRANCOTIRADOR / MAESTRO DE CAZA',
            mago: 'ARCHIMAGO / SEÑOR ELEMENTAL',
            picaro: 'ASESINO SOMBRÍO / MAESTRO DEL SIGILO',
          };
          newJobTitle = classTitles[prev.classType] || 'MAESTRO DE 2º JOB';
          newMaxHp += 40;
          newMaxMp += 30;
          addToast('¡2º JOB DESBLOQUEADO!', `Has ascendido a ${newJobTitle}`, '👑', 'level');
          addLog(`¡Has alcanzado la cúspide de tu clase! Título de Segundo Job: ${newJobTitle}.`, 'system');
        }

        return {
          ...prev,
          gold: prev.gold + quest.goldReward,
          exp: prev.exp + quest.expReward,
          inventory: newInv,
          jobStage: newJobStage,
          jobTitle: newJobTitle,
          maxHp: newMaxHp,
          currentHp: Math.min(newMaxHp, prev.currentHp + 40),
          maxMp: newMaxMp,
          currentMp: Math.min(newMaxMp, prev.currentMp + 30),
          activeQuests: newQuests,
        };
      });
    },
    [setPlayer, addLog, addToast, getItem]
  );

  const handleBuyItem = useCallback(
    (item: Item) => {
      if (!player || player.gold < item.price) return;

      let isSuccess = false;
      let wasStacked = false;

      setPlayer((prev) => {
        if (!prev) return null;
        const { inventory: updatedInv, success, stacked } = addItemToInventory(prev.inventory, item, 1);
        if (!success) {
          addLog('¡Mochila llena!', 'system');
          return prev;
        }
        isSuccess = true;
        wasStacked = stacked;
        return {
          ...prev,
          gold: prev.gold - item.price,
          inventory: updatedInv,
        };
      });

      if (isSuccess) {
        sound.playLoot();
        addLog(`Compraste ${item.name} por 🪙 ${item.price} oro.${wasStacked ? ' (Apilado en mochila)' : ''}`, 'loot');
      }
    },
    [player, setPlayer, addLog]
  );

  const handleSellItem = useCallback(
    (index: number) => {
      if (!player) return;
      const item = player.inventory[index];
      if (!item) return;
      const price = item.sellPrice || Math.floor(item.price * 0.4);

      setPlayer((prev) => {
        if (!prev) return null;
        const newInv = [...prev.inventory];
        const currentCount = item.count || 1;
        if (currentCount > 1) {
          newInv[index] = { ...item, count: currentCount - 1 };
        } else {
          newInv[index] = null;
        }
        return {
          ...prev,
          gold: prev.gold + price,
          inventory: newInv,
        };
      });

      sound.playLoot();
      addLog(`Vendiste 1x ${item.name} por 🪙 ${price} oro.`, 'loot');
    },
    [player, setPlayer, addLog]
  );

  const handleCraft = useCallback(
    (recipe: CraftingRecipe) => {
      if (!player) return;
      const outputItem = getItem(recipe.outputItemId);
      if (!outputItem) return;

      const skillLevel = recipe.skillType ? (player.skills[recipe.skillType]?.level || 10) : 10;
      const diff = recipe.difficulty || 10;
      const successChance = Math.min(95, Math.max(10, Math.round(50 + (skillLevel - diff) * 2)));
      const isSuccess = Math.random() * 100 <= successChance;

      setPlayer((prev) => {
        if (!prev) return null;
        const newInv = [...prev.inventory];
        const newSkills = { ...prev.skills };

        recipe.ingredients.forEach((ing) => {
          let needed = isSuccess ? ing.count : Math.max(1, Math.ceil(ing.count * 0.5));
          for (let i = 0; i < newInv.length && needed > 0; i++) {
            if (newInv[i]?.id === ing.itemId) {
              const available = newInv[i]!.count || 1;
              if (available <= needed) {
                needed -= available;
                newInv[i] = null;
              } else {
                newInv[i] = { ...newInv[i]!, count: available - needed };
                needed = 0;
              }
            }
          }
        });

        if (isSuccess) {
          const craftedInv = addItemToInventory(newInv, outputItem, recipe.outputCount);
          if (craftedInv.success) {
            for (let k = 0; k < 20; k++) {
              newInv[k] = craftedInv.inventory[k];
            }
          }
        }

        if (recipe.skillType && newSkills[recipe.skillType]) {
          const currentSk = newSkills[recipe.skillType]!;
          if (currentSk.level < currentSk.maxLevel && Math.random() < 0.35) {
            newSkills[recipe.skillType] = { ...currentSk, level: currentSk.level + 1 };
            addToast('¡Habilidad Aumentada!', `${currentSk.name} subió a Nivel ${currentSk.level + 1}`, '📈', 'level');
          }
        }

        return {
          ...prev,
          gold: prev.gold - recipe.goldCost,
          inventory: newInv,
          skills: newSkills,
        };
      });

      if (isSuccess) {
        sound.playGather();
        confetti({ particleCount: 30, spread: 50 });
        addLog(`¡Fabricaste ${outputItem.name} con éxito! (${successChance}% de probabilidad)`, 'loot');
      } else {
        sound.playShieldBlock();
        addToast('Fallo de Elaboración', `La forja falló (${successChance}% prob). Se recuperaron parte de los materiales.`, '💥', 'system');
        addLog(`Fallo al elaborar ${outputItem.name}. Algunos materiales se dañaron en el proceso.`, 'system');
      }
    },
    [player, getItem, setPlayer, addLog, addToast]
  );

  return {
    handleConsolidateInventory,
    handleEquipItem,
    handleUnequipItem,
    handleUseItem,
    handleDropItem,
    handleClaimQuestReward,
    handleBuyItem,
    handleSellItem,
    handleCraft,
  };
}
