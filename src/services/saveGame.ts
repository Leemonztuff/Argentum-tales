import { PlayerCharacter, CharacterClass, SkillData, SkillName } from '../types/game';
import { ITEMS } from '../data/items';
import { INITIAL_QUESTS } from '../data/quests';

const SAVE_KEY = 'argentum_agite_save_v1';
const SLOTS_KEY = 'argentum_character_slots_v2';
const ACTIVE_SLOT_KEY = 'argentum_active_slot_v2';

export const loadCharacterSlots = (): (PlayerCharacter | null)[] => {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return [parsed[0] || null, parsed[1] || null, parsed[2] || null];
      }
    }
    // Migration from old single save
    const old = loadGameState();
    if (old) {
      const slots: (PlayerCharacter | null)[] = [old, null, null];
      saveCharacterSlots(slots);
      return slots;
    }
  } catch {
    // ignore
  }
  return [null, null, null];
};

export const saveCharacterSlots = (slots: (PlayerCharacter | null)[]) => {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots.slice(0, 3)));
  } catch {
    // ignore
  }
};

export const getActiveSlotIndex = (): number => {
  try {
    const idx = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (idx !== null) {
      const parsed = parseInt(idx, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < 3) return parsed;
    }
  } catch {}
  return 0;
};

export const setActiveSlotIndex = (index: number) => {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, index.toString());
  } catch {}
};

export const saveCharacterToSlot = (slotIndex: number, character: PlayerCharacter) => {
  const slots = loadCharacterSlots();
  if (slotIndex >= 0 && slotIndex < 3) {
    slots[slotIndex] = character;
    saveCharacterSlots(slots);
  }
  return slots;
};

export const deleteCharacterSlot = (slotIndex: number) => {
  const slots = loadCharacterSlots();
  if (slotIndex >= 0 && slotIndex < 3) {
    slots[slotIndex] = null;
    saveCharacterSlots(slots);
  }
  return slots;
};

const defaultSkills: Record<SkillName, SkillData> = {
  tacticas_combate: { level: 10, progress: 0, name: 'Tácticas de Combate', description: 'Mejora la evasión y defensa física global.' },
  combate_armas: { level: 10, progress: 0, name: 'Combate con Armas', description: 'Puntería y maestría con espadas, hachas y dagas.' },
  combate_distancia: { level: 5, progress: 0, name: 'Combate a Distancia', description: 'Puntería con arcos y proyectiles.' },
  combate_sin_armas: { level: 5, progress: 0, name: 'Combate sin Armas', description: 'Destreza en lucha cuerpo a cuerpo desarmado.' },
  defensa_escudos: { level: 8, progress: 0, name: 'Defensa con Escudos', description: 'Probabilidad de bloquear por completo un golpe físico.' },
  apunalar: { level: 5, progress: 0, name: 'Apuñalar', description: 'Multiplicador crítico y perforación de armadura con dagas.' },
  evasion: { level: 8, progress: 0, name: 'Evasión en Combate', description: 'Capacidad de esquivar ataques enemigos directos.' },
  magia: { level: 5, progress: 0, name: 'Magia Arcana', description: 'Poder de lanzamiento y efectividad de los conjuros.' },
};

export const createInitialPlayer = (name: string, classType: CharacterClass): PlayerCharacter => {
  const skills = JSON.parse(JSON.stringify(defaultSkills));

  let stats = { fuerza: 15, agilidad: 14, inteligencia: 12, constitucion: 15, carisma: 12 };
  let hp = 100;
  let mp = 40;

  const inventory = new Array(20).fill(null);
  inventory[0] = { ...ITEMS.pocion_roja, count: 5 };
  inventory[1] = { ...ITEMS.pocion_azul, count: 3 };

  const equipment = {
    weapon: null,
    shield: null,
    helmet: null,
    armor: null,
    boots: { ...ITEMS.botas_cuero },
    ring1: null,
    ring2: null,
    amulet: null,
    arrows: null,
  };

  const knownSpells = ['dardo_magico'];

  if (classType === 'novicio') {
    stats = { fuerza: 14, agilidad: 14, inteligencia: 12, constitucion: 14, carisma: 12 };
    skills.combate_sin_armas.level = 15;
    skills.tacticas_combate.level = 10;
    hp = 100;
    mp = 30;
    equipment.armor = { ...ITEMS.armadura_cuero };
  } else if (classType === 'guerrero') {
    stats = { fuerza: 18, agilidad: 12, inteligencia: 8, constitucion: 18, carisma: 10 };
    skills.combate_armas.level = 18;
    skills.defensa_escudos.level = 16;
    skills.tacticas_combate.level = 14;
    hp = 140;
    mp = 20;
    equipment.weapon = { ...ITEMS.espada_corta };
    equipment.shield = { ...ITEMS.escudo_madera };
    equipment.armor = { ...ITEMS.armadura_cuero };
    equipment.helmet = { ...ITEMS.casco_cuero };
  } else if (classType === 'cazador') {
    stats = { fuerza: 12, agilidad: 18, inteligencia: 10, constitucion: 14, carisma: 12 };
    skills.combate_distancia.level = 20;
    skills.evasion.level = 16;
    skills.tacticas_combate.level = 12;
    hp = 115;
    mp = 35;
    equipment.weapon = { ...ITEMS.arco_simple };
    equipment.arrows = { ...ITEMS.flechas, count: 50 };
    equipment.armor = { ...ITEMS.armadura_cuero };
  } else if (classType === 'mago') {
    stats = { fuerza: 8, agilidad: 12, inteligencia: 19, constitucion: 12, carisma: 14 };
    skills.magia.level = 22;
    skills.evasion.level = 12;
    hp = 85;
    mp = 120;
    equipment.weapon = { ...ITEMS.baculo_aprendiz };
    equipment.armor = { ...ITEMS.tunica_lino };
    knownSpells.push('curacion_leve', 'misil_fuego');
  } else if (classType === 'picaro') {
    stats = { fuerza: 14, agilidad: 19, inteligencia: 10, constitucion: 13, carisma: 12 };
    skills.apunalar.level = 20;
    skills.combate_armas.level = 16;
    skills.evasion.level = 18;
    hp = 105;
    mp = 30;
    equipment.weapon = { ...ITEMS.daga_simple };
    equipment.armor = { ...ITEMS.armadura_cuero };
  }

  const startMap = classType === 'novicio' ? 'mapa_novicio' : 'pueblo_inicial';
  const startX = classType === 'novicio' ? 10 : 12;
  const startY = classType === 'novicio' ? 4 : 15;

  return {
    name: name || 'Viajero',
    classType,
    jobStage: classType === 'novicio' ? 'novicio' : 'primer_job',
    jobTitle: classType === 'novicio' ? 'Novicio' : classType.toUpperCase(),
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    currentHp: hp,
    maxHp: hp,
    currentMp: mp,
    maxMp: mp,
    currentStamina: 100,
    maxStamina: 100,
    gold: 50,
    x: startX,
    y: startY,
    currentMapId: startMap,
    facing: 'down',
    stats,
    skills,
    inventory,
    equipment,
    knownSpells,
    equippedSpells: [
      knownSpells[0] || null,
      knownSpells[1] || null,
      knownSpells[2] || null,
      knownSpells[3] || null,
    ],
    activeQuests: JSON.parse(JSON.stringify(INITIAL_QUESTS)),
    isStealthed: false,
    stealthDurationMs: 0,
    lastAttackTimestamp: 0,
    lastSpellTimestamp: 0,
    lastPotionTimestamp: 0,
    defeatedBosses: [],
    openedChests: [],
  };
};

export const saveGameState = (player: PlayerCharacter) => {
  try {
    const slots = loadCharacterSlots();
    const activeIdx = getActiveSlotIndex();
    slots[activeIdx] = player;
    saveCharacterSlots(slots);
    localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  } catch {
    // ignore
  }
};

export const loadGameState = (): PlayerCharacter | null => {
  try {
    const slots = loadCharacterSlots();
    const activeIdx = getActiveSlotIndex();
    if (slots[activeIdx]) return slots[activeIdx];
    const firstPopulated = slots.find((s) => s !== null);
    if (firstPopulated) return firstPopulated;

    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    const player = JSON.parse(data) as PlayerCharacter;
    if (!player.equippedSpells || !Array.isArray(player.equippedSpells) || player.equippedSpells.length < 4) {
      const known = player.knownSpells || ['dardo_magico'];
      player.equippedSpells = [
        known[0] || null,
        known[1] || null,
        known[2] || null,
        known[3] || null,
      ];
    }
    return player;
  } catch {
    return null;
  }
};

export const clearGameState = () => {
  try {
    const slots = loadCharacterSlots();
    const activeIdx = getActiveSlotIndex();
    slots[activeIdx] = null;
    saveCharacterSlots(slots);
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
};
