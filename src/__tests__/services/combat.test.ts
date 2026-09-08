import { describe, it, expect, vi } from 'vitest';
import { CombatEngine } from '../../services/combat';
import { PlayerCharacter, MobTemplate } from '../../types/game';

const makePlayer = (overrides: Partial<PlayerCharacter> = {}): PlayerCharacter => ({
  name: 'Test',
  classType: 'guerrero',
  jobStage: 'primer_job',
  jobTitle: 'GUERRERO',
  level: 5,
  exp: 0,
  expToNextLevel: 100,
  currentHp: 100,
  maxHp: 100,
  currentMp: 50,
  maxMp: 50,
  currentStamina: 100,
  maxStamina: 100,
  gold: 100,
  x: 0,
  y: 0,
  currentMapId: 'pueblo_inicial',
  facing: 'down',
  stats: { fuerza: 15, agilidad: 12, inteligencia: 10, constitucion: 15, carisma: 10 },
  skills: {
    tacticas_combate: { level: 10, progress: 0, name: 'Tácticas', description: '' },
    combate_armas: { level: 15, progress: 0, name: 'Combate con Armas', description: '' },
    combate_distancia: { level: 5, progress: 0, name: 'Distancia', description: '' },
    combate_sin_armas: { level: 5, progress: 0, name: 'Sin Armas', description: '' },
    defensa_escudos: { level: 8, progress: 0, name: 'Escudos', description: '' },
    apunalar: { level: 5, progress: 0, name: 'Apuñalar', description: '' },
    evasion: { level: 8, progress: 0, name: 'Evasión', description: '' },
    magia: { level: 5, progress: 0, name: 'Magia', description: '' },
  },
  inventory: [],
  equipment: {
    weapon: { id: 'espada', name: 'Espada', description: '', type: 'weapon', icon: '⚔️', price: 100, sellPrice: 50, minHit: 5, maxHit: 12, punteriaBonus: 5, baseIntervalMs: 900, weaponType: 'sword' },
    shield: null,
    helmet: null,
    armor: null,
    boots: null,
    ring1: null,
    ring2: null,
    amulet: null,
    arrows: null,
  },
  knownSpells: ['dardo_magico'],
  equippedSpells: [null, null, null, null],
  activeQuests: [],
  isStealthed: false,
  stealthDurationMs: 0,
  lastAttackTimestamp: 0,
  lastSpellTimestamp: 0,
  lastPotionTimestamp: 0,
  defeatedBosses: [],
  openedChests: [],
  ...overrides,
});

const makeMob = (overrides: Partial<MobTemplate> = {}): MobTemplate => ({
  id: 'test_mob',
  name: 'Goblin',
  sprite: '👺',
  color: '#ff0000',
  maxHp: 50,
  minHit: 3,
  maxHit: 8,
  punteria: 30,
  evasion: 10,
  defensa: 2,
  magicResist: 5,
  intervalMs: 1200,
  range: 1,
  expReward: 20,
  goldMin: 5,
  goldMax: 15,
  drops: [],
  ...overrides,
});

describe('CombatEngine.calculateAttackInterval', () => {
  it('returns base interval for unarmed guerrero', () => {
    const player = makePlayer({ equipment: { ...makePlayer().equipment, weapon: null } });
    expect(CombatEngine.calculateAttackInterval(player)).toBeGreaterThanOrEqual(600);
  });

  it('applies picaro speed multiplier', () => {
    const picaro = makePlayer({ classType: 'picaro' });
    const guerrero = makePlayer({ classType: 'guerrero' });
    expect(CombatEngine.calculateAttackInterval(picaro)).toBeLessThan(CombatEngine.calculateAttackInterval(guerrero));
  });

  it('never goes below 600ms', () => {
    const fastPlayer = makePlayer({
      classType: 'picaro',
      stats: { fuerza: 15, agilidad: 50, inteligencia: 10, constitucion: 15, carisma: 10 },
    });
    expect(CombatEngine.calculateAttackInterval(fastPlayer)).toBeGreaterThanOrEqual(600);
  });
});

describe('CombatEngine.isAligned', () => {
  it('detects same-column alignment', () => {
    const result = CombatEngine.isAligned(5, 5, 5, 8, 3);
    expect(result.aligned).toBe(true);
    expect(result.direction).toBe('down');
    expect(result.distance).toBe(3);
  });

  it('detects same-row alignment', () => {
    const result = CombatEngine.isAligned(5, 5, 8, 5, 3);
    expect(result.aligned).toBe(true);
    expect(result.direction).toBe('right');
    expect(result.distance).toBe(3);
  });

  it('rejects diagonal positions', () => {
    const result = CombatEngine.isAligned(5, 5, 7, 7, 3);
    expect(result.aligned).toBe(false);
  });

  it('rejects out-of-range targets', () => {
    const result = CombatEngine.isAligned(5, 5, 5, 10, 3);
    expect(result.aligned).toBe(false);
  });
});

describe('CombatEngine.calculateHitChance', () => {
  it('returns 50% when punteria equals evasion', () => {
    expect(CombatEngine.calculateHitChance(50, 50)).toBe(50);
  });

  it('clamps to minimum 5%', () => {
    expect(CombatEngine.calculateHitChance(1, 1000)).toBe(5);
  });

  it('clamps to maximum 95%', () => {
    expect(CombatEngine.calculateHitChance(1000, 1)).toBe(95);
  });

  it('higher punteria gives higher hit chance', () => {
    const low = CombatEngine.calculateHitChance(20, 50);
    const high = CombatEngine.calculateHitChance(80, 50);
    expect(high).toBeGreaterThan(low);
  });
});

describe('CombatEngine.executePlayerAttack', () => {
  it('returns a combat result with required fields', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const player = makePlayer();
    const mob = makeMob();
    const result = CombatEngine.executePlayerAttack(player, mob);
    expect(result).toHaveProperty('hit');
    expect(result).toHaveProperty('damage');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('skillUps');
    vi.restoreAllMocks();
  });

  it('always hits when Math.random is low', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const result = CombatEngine.executePlayerAttack(makePlayer(), makeMob());
    expect(result.hit).toBe(true);
    expect(result.damage).toBeGreaterThanOrEqual(1);
    vi.restoreAllMocks();
  });
});

describe('CombatEngine.applySkillGains', () => {
  it('increases skill progress', () => {
    const player = makePlayer();
    const gains = [{ skill: 'combate_armas' as const, amount: 20 }];
    const { updatedPlayer } = CombatEngine.applySkillGains(player, gains);
    expect(updatedPlayer.skills.combate_armas.progress).toBe(20);
  });

  it('levels up skill when progress >= 100', () => {
    const player = makePlayer();
    player.skills.combate_armas.progress = 90;
    const gains = [{ skill: 'combate_armas' as const, amount: 15 }];
    const { updatedPlayer, leveledSkills } = CombatEngine.applySkillGains(player, gains);
    expect(updatedPlayer.skills.combate_armas.level).toBe(16);
    expect(updatedPlayer.skills.combate_armas.progress).toBe(5);
    expect(leveledSkills).toContain('Combate con Armas');
  });

  it('does not mutate original player', () => {
    const player = makePlayer();
    CombatEngine.applySkillGains(player, [{ skill: 'combate_armas', amount: 50 }]);
    expect(player.skills.combate_armas.progress).toBe(0);
  });
});
