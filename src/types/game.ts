export type CharacterClass = 'novicio' | 'guerrero' | 'cazador' | 'mago' | 'picaro';

export type AttackType = 'melee' | 'ranged' | 'unarmed' | 'magic' | 'stab';

export type ItemType = 
  | 'weapon' 
  | 'shield' 
  | 'helmet' 
  | 'armor' 
  | 'boots' 
  | 'ring' 
  | 'amulet' 
  | 'potion' 
  | 'arrow' 
  | 'material' 
  | 'quest';

export type SkillName = 
  | 'tacticas_combate'
  | 'combate_armas'
  | 'combate_distancia'
  | 'combate_sin_armas'
  | 'defensa_escudos'
  | 'apunalar'
  | 'evasion'
  | 'magia';

export interface SkillData {
  level: number;
  progress: number; // 0 to 100
  name: string;
  description: string;
}

export interface PlayerStats {
  fuerza: number;
  agilidad: number;
  inteligencia: number;
  constitucion: number;
  carisma: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  price: number;
  sellPrice: number;
  stackable?: boolean;
  count?: number;
  
  // Weapon stats
  minHit?: number;
  maxHit?: number;
  weaponType?: 'dagger' | 'sword' | 'axe' | 'bow' | 'staff';
  baseIntervalMs?: number; // e.g. 1200ms
  range?: number; // 1 for melee, 4-5 for ranged
  punteriaBonus?: number;
  
  // Armor/Shield stats
  minDef?: number;
  maxDef?: number;
  blockChanceBonus?: number;
  evasionBonus?: number;
  magicResistBonus?: number;
  
  // Stat bonuses
  statsBonus?: Partial<PlayerStats>;
  
  // Consumable
  hpRestore?: number;
  mpRestore?: number;
  buffType?: 'speed' | 'strength' | 'invis';
  buffDurationSec?: number;
}

export interface Equipment {
  weapon: Item | null;
  shield: Item | null;
  helmet: Item | null;
  armor: Item | null;
  boots: Item | null;
  ring1: Item | null;
  ring2: Item | null;
  amulet: Item | null;
  arrows: Item | null;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  icon: string;
  minDamage: number;
  maxDamage: number;
  manaCost: number;
  range: number;
  minSkillLevel: number;
  type: 'damage' | 'heal' | 'buff' | 'aoe';
  color: string;
  animation: 'fire' | 'lightning' | 'holy' | 'dark' | 'ice';
  cooldownSec?: number;
}

export interface MobDrop {
  itemId: string;
  chance: number; // 0 to 1
  minCount?: number;
  maxCount?: number;
}

export interface MobTemplate {
  id: string;
  name: string;
  sprite: string;
  color: string;
  maxHp: number;
  minHit: number;
  maxHit: number;
  minHitToPlayer?: number;
  maxHitToPlayer?: number;
  punteria: number;
  evasion: number;
  defensa: number;
  magicResist: number;
  intervalMs: number;
  range: number;
  expReward: number;
  goldMin: number;
  goldMax: number;
  isBoss?: boolean;
  drops: MobDrop[];
  skills?: string[];
  bossAbilities?: Array<{
    name: string;
    cooldownMs: number;
    aoeRadius: number;
    telegraphMs: number;
    damage: number;
  }>;
}

export interface ActiveMob {
  instanceId: string;
  templateId: string;
  name: string;
  sprite: string;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  currentHp: number;
  maxHp: number;
  lastAttackTime: number;
  attackIntervalMs: number;
  isBoss: boolean;
  isRevengeTarget?: boolean;
  facing: 'up' | 'down' | 'left' | 'right';
  spawnX: number;
  spawnY: number;
  state: 'idle' | 'chasing' | 'attacking' | 'returning' | 'telegraphing';
  telegraphEnd?: number;
  telegraphRadius?: number;
  lastAgroTime?: number;
}

export interface NPC {
  id: string;
  name: string;
  title: string;
  sprite: string;
  color: string;
  x: number;
  y: number;
  dialogue: string[];
  shopType?: 'weapons' | 'potions' | 'crafting' | 'general';
  givesQuestId?: string;
  jobPromotionClass?: CharacterClass;
  isSecondJobInstructor?: boolean;
}

export interface MapPortal {
  x: number;
  y: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
  label: string;
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  isOpened: boolean;
  items: Array<{ itemId: string; count: number }>;
  gold: number;
  requiresKey?: string;
}

export interface GatherNode {
  id: string;
  type: 'tree' | 'ore' | 'herb';
  x: number;
  y: number;
  harvested: boolean;
  respawnTime: number;
  yieldItemId: string;
}

export interface GameMap {
  id: string;
  name: string;
  subtitle: string;
  isSafe: boolean;
  isDungeon: boolean;
  width: number;
  height: number;
  ambientLight: string;
  fogColor: string;
  theme: 'town' | 'forest' | 'crypt' | 'coast' | 'lighthouse' | 'ruins' | 'fire_temple';
  tiles: number[][]; // 0: ground, 1: wall/obstacle, 2: water, 3: stone, 4: wood/deck
  portals: MapPortal[];
  chests: Chest[];
  gatherNodes: GatherNode[];
  npcs: NPC[];
  mobSpawns: Array<{
    mobId: string;
    x: number;
    y: number;
    respawnSec: number;
  }>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  giverNpc: string;
  objectiveType: 'kill' | 'gather' | 'clear_dungeon' | 'talk';
  targetId: string;
  requiredAmount: number;
  currentAmount: number;
  goldReward: number;
  expReward: number;
  itemReward?: { itemId: string; count: number };
  completed: boolean;
  claimed: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  created: number;
  durationMs: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  text: string;
  type: 'player_hit' | 'player_miss' | 'mob_hit' | 'block' | 'stab' | 'spell' | 'loot' | 'system';
}

export interface CraftingRecipe {
  id: string;
  station: 'smith' | 'alchemy';
  name: string;
  outputItemId: string;
  outputCount: number;
  goldCost: number;
  difficulty?: number; // GDD §8.3: Básica (5), Intermedia (25), Avanzada (50)
  skillType?: 'herreria' | 'alquimia' | 'cocina';
  tier?: 'basica' | 'intermedia' | 'avanzada';
  requiredBookId?: string; // GDD §8.4: Recetas desbloqueables
  ingredients: Array<{ itemId: string; count: number }>;
}

export type SelectedTarget =
  | { type: 'mob'; mob: ActiveMob }
  | { type: 'npc'; npc: NPC }
  | null;

export interface PlayerCharacter {
  name: string;
  classType: CharacterClass;
  level: number;
  exp: number;
  expToNextLevel: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  currentStamina: number;
  maxStamina: number;
  gold: number;
  x: number;
  y: number;
  currentMapId: string;
  facing: 'up' | 'down' | 'left' | 'right';
  stats: PlayerStats;
  skills: Record<SkillName, SkillData>;
  inventory: (Item | null)[];
  equipment: Equipment;
  knownSpells: string[];
  equippedSpells?: (string | null)[];
  activeQuests: Quest[];
  isStealthed: boolean;
  stealthDurationMs: number;
  lastAttackTimestamp: number;
  lastSpellTimestamp: number;
  lastPotionTimestamp: number;
  lastDashTimestamp?: number;
  revengeTargetTemplateId?: string;
  defeatedBosses: string[];
  openedChests: string[];
  jobStage?: 'novicio' | 'primer_job' | 'segundo_job';
  jobTitle?: string;
}
