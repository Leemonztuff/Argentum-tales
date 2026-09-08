import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createInitialPlayer } from '../../services/saveGame';

describe('createInitialPlayer', () => {
  it('creates novicio with correct stats', () => {
    const player = createInitialPlayer('TestNovicio', 'novicio');
    expect(player.classType).toBe('novicio');
    expect(player.stats.fuerza).toBe(14);
    expect(player.stats.agilidad).toBe(14);
    expect(player.maxHp).toBe(100);
    expect(player.maxMp).toBe(30);
    expect(player.skills.combate_sin_armas.level).toBe(15);
    expect(player.equipment.armor).not.toBeNull();
  });

  it('creates guerrero with correct stats', () => {
    const player = createInitialPlayer('TestGuerrero', 'guerrero');
    expect(player.classType).toBe('guerrero');
    expect(player.stats.fuerza).toBe(18);
    expect(player.stats.constitucion).toBe(18);
    expect(player.maxHp).toBe(140);
    expect(player.equipment.weapon).not.toBeNull();
    expect(player.equipment.shield).not.toBeNull();
    expect(player.equipment.helmet).not.toBeNull();
  });

  it('creates cazador with correct stats', () => {
    const player = createInitialPlayer('TestCazador', 'cazador');
    expect(player.classType).toBe('cazador');
    expect(player.stats.agilidad).toBe(18);
    expect(player.skills.combate_distancia.level).toBe(20);
    expect(player.equipment.weapon?.weaponType).toBe('bow');
    expect(player.equipment.arrows).not.toBeNull();
  });

  it('creates mago with correct stats', () => {
    const player = createInitialPlayer('TestMago', 'mago');
    expect(player.classType).toBe('mago');
    expect(player.stats.inteligencia).toBe(19);
    expect(player.maxMp).toBe(120);
    expect(player.skills.magia.level).toBe(22);
    expect(player.knownSpells).toContain('curacion_leve');
    expect(player.knownSpells).toContain('misil_fuego');
  });

  it('creates picaro with correct stats', () => {
    const player = createInitialPlayer('TestPicaro', 'picaro');
    expect(player.classType).toBe('picaro');
    expect(player.stats.agilidad).toBe(19);
    expect(player.skills.apunalar.level).toBe(20);
    expect(player.equipment.weapon?.weaponType).toBe('dagger');
  });

  it('all classes start with potions and gold', () => {
    const classes = ['novicio', 'guerrero', 'cazador', 'mago', 'picaro'] as const;
    for (const cls of classes) {
      const player = createInitialPlayer(`Test${cls}`, cls);
      expect(player.gold).toBe(50);
      expect(player.inventory[0]?.id).toBe('pocion_roja');
      expect(player.inventory[0]?.count).toBe(5);
      expect(player.inventory[1]?.id).toBe('pocion_azul');
      expect(player.inventory[1]?.count).toBe(3);
    }
  });

  it('defaults name to Viajero when empty', () => {
    const player = createInitialPlayer('', 'guerrero');
    expect(player.name).toBe('Viajero');
  });
});
