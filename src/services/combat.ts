import { PlayerCharacter, MobTemplate, AttackType, Item, SkillName } from '../types/game';

export interface CombatResult {
  hit: boolean;
  blocked: boolean;
  isCriticalStab: boolean;
  isCritical?: boolean;
  damage: number;
  message: string;
  skillUps: Array<{ skill: SkillName; amount: number }>;
}

export class CombatEngine {
  /**
   * Calculates player attack interval in milliseconds (§5.6)
   */
  public static calculateAttackInterval(player: PlayerCharacter): number {
    const weapon = player.equipment.weapon;
    const baseInterval = weapon?.baseIntervalMs || 1000; // Unarmed is 1000ms

    // Class agite multipliers
    let classMult = 1.0;
    if (player.classType === 'picaro') classMult = 0.85;
    else if (player.classType === 'guerrero') classMult = 1.0;
    else if (player.classType === 'cazador') classMult = 1.1;
    else if (player.classType === 'mago') classMult = 1.25;

    // Agility bonus (reduces interval)
    const effectiveAgility = player.stats.agilidad + (player.equipment.ring1?.statsBonus?.agilidad || 0) + (player.equipment.boots?.statsBonus?.agilidad || 0);
    const agilityReduction = (effectiveAgility - 10) * 15;

    const finalInterval = Math.max(600, Math.round(baseInterval * classMult - agilityReduction));
    return finalInterval;
  }

  /**
   * Determines if player and target are aligned in X or Y within range (§5.1 & §5.2)
   */
  public static isAligned(
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number,
    maxRange: number
  ): { aligned: boolean; direction: 'up' | 'down' | 'left' | 'right' | null; distance: number } {
    const dx = targetX - playerX;
    const dy = targetY - playerY;

    if (dx === 0 && dy !== 0) {
      const distance = Math.abs(dy);
      if (distance <= maxRange) {
        return {
          aligned: true,
          direction: dy > 0 ? 'down' : 'up',
          distance,
        };
      }
    } else if (dy === 0 && dx !== 0) {
      const distance = Math.abs(dx);
      if (distance <= maxRange) {
        return {
          aligned: true,
          direction: dx > 0 ? 'right' : 'left',
          distance,
        };
      }
    }

    return { aligned: false, direction: null, distance: Math.hypot(dx, dy) };
  }

  /**
   * Calculates attack accuracy chance (§5.4):
   * Probabilidad = (Puntería_Atacante / (Puntería_Atacante + Evasión_Defensor)) * 100
   * Clamped to [5%, 95%]
   */
  public static calculateHitChance(attackerPunteria: number, defenderEvasion: number): number {
    const total = Math.max(1, attackerPunteria + defenderEvasion);
    const rawChance = (attackerPunteria / total) * 100;
    return Math.min(95, Math.max(5, Math.round(rawChance)));
  }

  /**
   * Player attacks a mob
   */
  public static executePlayerAttack(
    player: PlayerCharacter,
    mob: MobTemplate
  ): CombatResult {
    const weapon = player.equipment.weapon;
    const skillUps: Array<{ skill: SkillName; amount: number }> = [];

    let attackType: AttackType = 'unarmed';
    if (weapon) {
      if (weapon.weaponType === 'dagger' && player.classType === 'picaro') {
        attackType = 'stab';
      } else if (weapon.weaponType === 'bow') {
        attackType = 'ranged';
      } else {
        attackType = 'melee';
      }
    }

    // 1. Calculate Punteria
    let weaponSkill = 0;
    if (attackType === 'melee') {
      weaponSkill = player.skills.combate_armas.level;
      skillUps.push({ skill: 'combate_armas', amount: 8 });
      skillUps.push({ skill: 'tacticas_combate', amount: 4 });
    } else if (attackType === 'ranged') {
      weaponSkill = player.skills.combate_distancia.level;
      skillUps.push({ skill: 'combate_distancia', amount: 8 });
      skillUps.push({ skill: 'tacticas_combate', amount: 4 });
    } else if (attackType === 'stab') {
      weaponSkill = player.skills.combate_armas.level + player.skills.apunalar.level;
      skillUps.push({ skill: 'apunalar', amount: 10 });
      skillUps.push({ skill: 'combate_armas', amount: 5 });
    } else {
      weaponSkill = player.skills.combate_sin_armas.level;
      skillUps.push({ skill: 'combate_sin_armas', amount: 8 });
    }

    const classPunteriaMod = player.classType === 'guerrero' ? 10 : player.classType === 'cazador' ? 12 : player.classType === 'picaro' ? 8 : 4;
    const weaponBonus = weapon?.punteriaBonus || 0;
    const playerPunteria = weaponSkill + classPunteriaMod + weaponBonus + Math.floor(player.stats.agilidad / 2);

    // 2. Mob Evasion
    const mobEvasion = mob.evasion;

    // 3. Roll Hit Chance (§5.4)
    const hitChance = this.calculateHitChance(playerPunteria, mobEvasion);
    const roll = Math.random() * 100;

    if (roll > hitChance) {
      return {
        hit: false,
        blocked: false,
        isCriticalStab: false,
        damage: 0,
        message: `¡Fallaste el ataque contra ${mob.name}! (${Math.round(roll)} vs ${hitChance}%)`,
        skillUps,
      };
    }

    // 4. Calculate Damage (§5.5)
    const minHit = weapon?.minHit || 1;
    const maxHit = weapon?.maxHit || 3;
    const baseDamage = Math.floor(Math.random() * (maxHit - minHit + 1)) + minHit;

    let statBonus = 0;
    if (attackType === 'ranged') {
      statBonus = Math.floor(player.stats.agilidad / 4);
    } else {
      statBonus = Math.floor(player.stats.fuerza / 4);
    }

    let classBonus = 0;
    if (player.classType === 'guerrero') classBonus = 3;
    if (player.classType === 'cazador' && attackType === 'ranged') classBonus = 4;

    let totalRawDamage = baseDamage + statBonus + classBonus;

    // Stabbing & General critical calculation
    let isCriticalStab = false;
    let isCritical = false;
    let defenseIgnored = 0;

    const baseCritChance = 0.08 + (player.stats.agilidad * 0.005);
    const isGeneralCrit = Math.random() < baseCritChance;

    if (attackType === 'stab' || (player.classType === 'picaro' && Math.random() < (player.skills.apunalar.level / 120 + 0.15))) {
      isCriticalStab = true;
      isCritical = true;
      const stabMultiplier = 1.6 + (player.skills.apunalar.level * 0.01);
      totalRawDamage = Math.round(totalRawDamage * stabMultiplier);
      defenseIgnored = Math.floor(mob.defensa * 0.5);
    } else if (isGeneralCrit) {
      isCritical = true;
      totalRawDamage = Math.round(totalRawDamage * 1.5);
    }

    // Apply mob physical defense
    const effectiveDefense = Math.max(0, mob.defensa - defenseIgnored);
    const finalDamage = Math.max(1, totalRawDamage - effectiveDefense);

    let msg = `Golpeaste a ${mob.name} por ${finalDamage} de daño.`;
    if (isCriticalStab) {
      msg = `¡APUÑALADA CRÍTICA! Impactaste a ${mob.name} por ${finalDamage} de daño físico.`;
    } else if (isCritical) {
      msg = `¡GOLPE CRÍTICO! Impactaste a ${mob.name} por ${finalDamage} de daño físico.`;
    }

    return {
      hit: true,
      blocked: false,
      isCriticalStab,
      isCritical,
      damage: finalDamage,
      message: msg,
      skillUps,
    };
  }

  /**
   * Mob attacks player
   */
  public static executeMobAttack(
    mob: MobTemplate,
    player: PlayerCharacter
  ): CombatResult {
    const skillUps: Array<{ skill: SkillName; amount: number }> = [];

    // 1. Calculate Player Evasion
    const tacticsSkill = player.skills.tacticas_combate.level;
    const evasionSkill = player.skills.evasion.level;
    const classEvasionMod = player.classType === 'cazador' ? 12 : player.classType === 'picaro' ? 10 : 4;
    const armorEvasion = (player.equipment.armor?.evasionBonus || 0) + (player.equipment.boots?.evasionBonus || 0);

    const playerEvasion = tacticsSkill + evasionSkill + classEvasionMod + armorEvasion + Math.floor(player.stats.agilidad / 3);

    // 2. Hit Roll (§5.4)
    const hitChance = this.calculateHitChance(mob.punteria, playerEvasion);
    const roll = Math.random() * 100;

    if (roll > hitChance) {
      skillUps.push({ skill: 'evasion', amount: 8 });
      skillUps.push({ skill: 'tacticas_combate', amount: 4 });
      return {
        hit: false,
        blocked: false,
        isCriticalStab: false,
        damage: 0,
        message: `¡Esquivaste el ataque de ${mob.name}!`,
        skillUps,
      };
    }

    // 3. Shield Block Check (§5.5)
    if (player.equipment.shield) {
      const shieldSkill = player.skills.defensa_escudos.level;
      const shieldBonus = player.equipment.shield.blockChanceBonus || 15;
      const classShieldMod = player.classType === 'guerrero' ? 15 : 0;
      const totalBlockChance = Math.min(65, Math.round(shieldBonus + (shieldSkill * 0.3) + classShieldMod));

      if (Math.random() * 100 < totalBlockChance) {
        skillUps.push({ skill: 'defensa_escudos', amount: 10 });
        return {
          hit: false,
          blocked: true,
          isCriticalStab: false,
          damage: 0,
          message: `¡Bloqueaste con tu escudo el ataque de ${mob.name}!`,
          skillUps,
        };
      }
    }

    // 4. Calculate Mob Damage & Mob Critical Chance
    const minHit = mob.minHitToPlayer || mob.minHit;
    const maxHit = mob.maxHitToPlayer || mob.maxHit;
    let rawDamage = Math.floor(Math.random() * (maxHit - minHit + 1)) + minHit;

    const mobCritChance = mob.isBoss ? 0.20 : 0.12;
    const isMobCrit = Math.random() < mobCritChance;
    if (isMobCrit) {
      rawDamage = Math.round(rawDamage * 1.5);
    }

    // Player physical defense from armor/helmet/shield
    let totalDefense = 0;
    const eq = player.equipment;
    if (eq.armor) totalDefense += Math.floor(Math.random() * ((eq.armor.maxDef || 0) - (eq.armor.minDef || 0) + 1)) + (eq.armor.minDef || 0);
    if (eq.helmet) totalDefense += Math.floor(Math.random() * ((eq.helmet.maxDef || 0) - (eq.helmet.minDef || 0) + 1)) + (eq.helmet.minDef || 0);
    if (eq.shield) totalDefense += Math.floor(Math.random() * ((eq.shield.maxDef || 0) - (eq.shield.minDef || 0) + 1)) + (eq.shield.minDef || 0);
    if (eq.boots) totalDefense += Math.floor(Math.random() * ((eq.boots.maxDef || 0) - (eq.boots.minDef || 0) + 1)) + (eq.boots.minDef || 0);

    const finalDamage = Math.max(1, rawDamage - totalDefense);

    skillUps.push({ skill: 'tacticas_combate', amount: 4 });

    const msg = isMobCrit
      ? `¡GOLPE CRÍTICO! ${mob.name} te asestó un golpe devastador por ${finalDamage} de daño.`
      : `${mob.name} te infligió ${finalDamage} de daño físico.`;

    return {
      hit: true,
      blocked: false,
      isCriticalStab: false,
      isCritical: isMobCrit,
      damage: finalDamage,
      message: msg,
      skillUps,
    };
  }

  /**
   * Applies skill progress and levels up skill if progress >= 100 (§6)
   */
  public static applySkillGains(
    player: PlayerCharacter,
    gains: Array<{ skill: SkillName; amount: number }>
  ): { updatedPlayer: PlayerCharacter; leveledSkills: string[] } {
    const updated = { ...player, skills: { ...player.skills } };
    const leveledSkills: string[] = [];

    gains.forEach(({ skill, amount }) => {
      const current = { ...updated.skills[skill] };
      current.progress += amount;
      if (current.progress >= 100) {
        current.level += 1;
        current.progress = current.progress - 100;
        leveledSkills.push(current.name);
      }
      updated.skills[skill] = current;
    });

    return { updatedPlayer: updated, leveledSkills };
  }
}
