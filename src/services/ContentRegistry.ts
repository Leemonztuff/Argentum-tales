import { Item, MobTemplate, Spell, Quest, CraftingRecipe, GameMap } from '../types/game';
import { ITEMS } from '../data/items';
import { MOBS } from '../data/mobs';
import { SPELLS } from '../data/spells';
import { INITIAL_QUESTS } from '../data/quests';
import { CRAFTING_RECIPES } from '../data/crafting';
import { MAPS } from '../data/maps';

export interface DataIntegrityReport {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  counts: {
    items: number;
    mobs: number;
    spells: number;
    quests: number;
    recipes: number;
    maps: number;
  };
}

export interface ContentPackage {
  version?: string;
  items?: Item[];
  mobs?: MobTemplate[];
  spells?: Spell[];
  quests?: Quest[];
  recipes?: CraftingRecipe[];
  maps?: GameMap[];
}

export class ContentRegistry {
  private static instance: ContentRegistry;

  private items: Map<string, Item> = new Map();
  private mobs: Map<string, MobTemplate> = new Map();
  private spells: Map<string, Spell> = new Map();
  private quests: Map<string, Quest> = new Map();
  private recipes: Map<string, CraftingRecipe> = new Map();
  private maps: Map<string, GameMap> = new Map();

  private constructor() {
    this.initDefaultData();
  }

  public static getInstance(): ContentRegistry {
    if (!ContentRegistry.instance) {
      ContentRegistry.instance = new ContentRegistry();
    }
    return ContentRegistry.instance;
  }

  /**
   * Initializes the registry with default game files
   */
  private initDefaultData(): void {
    // Register items
    Object.values(ITEMS).forEach((item) => this.registerItem(item));

    // Register mobs
    Object.values(MOBS).forEach((mob) => this.registerMob(mob));

    // Register spells
    Object.values(SPELLS).forEach((spell) => this.registerSpell(spell));

    // Register quests
    INITIAL_QUESTS.forEach((quest) => this.registerQuest(quest));

    // Register recipes
    CRAFTING_RECIPES.forEach((recipe) => this.registerRecipe(recipe));

    // Register maps
    Object.values(MAPS).forEach((map) => this.registerMap(map));
  }

  // --- ITEM METHODS ---
  public registerItem(item: Item): void {
    this.items.set(item.id, { ...item });
  }

  public getItem(id: string): Item | undefined {
    return this.items.get(id);
  }

  public getAllItems(): Item[] {
    return Array.from(this.items.values());
  }

  public getItemsByType(type: Item['type']): Item[] {
    return this.getAllItems().filter((item) => item.type === type);
  }

  // --- MOB METHODS ---
  public registerMob(mob: MobTemplate): void {
    this.mobs.set(mob.id, { ...mob });
  }

  public getMob(id: string): MobTemplate | undefined {
    return this.mobs.get(id);
  }

  public getAllMobs(): MobTemplate[] {
    return Array.from(this.mobs.values());
  }

  // --- SPELL METHODS ---
  public registerSpell(spell: Spell): void {
    this.spells.set(spell.id, { ...spell });
  }

  public getSpell(id: string): Spell | undefined {
    return this.spells.get(id);
  }

  public getAllSpells(): Spell[] {
    return Array.from(this.spells.values());
  }

  // --- QUEST METHODS ---
  public registerQuest(quest: Quest): void {
    this.quests.set(quest.id, { ...quest });
  }

  public getQuest(id: string): Quest | undefined {
    return this.quests.get(id);
  }

  public getAllQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  // --- RECIPE METHODS ---
  public registerRecipe(recipe: CraftingRecipe): void {
    this.recipes.set(recipe.id, { ...recipe });
  }

  public getRecipe(id: string): CraftingRecipe | undefined {
    return this.recipes.get(id);
  }

  public getAllRecipes(): CraftingRecipe[] {
    return Array.from(this.recipes.values());
  }

  // --- MAP METHODS ---
  public registerMap(map: GameMap): void {
    this.maps.set(map.id, { ...map });
  }

  public getMap(id: string): GameMap | undefined {
    return this.maps.get(id);
  }

  public getAllMaps(): GameMap[] {
    return Array.from(this.maps.values());
  }

  // --- DYNAMIC DATA-DRIVEN IMPORT / EXPORT ---
  public loadContentPackage(pkg: ContentPackage): {
    success: boolean;
    added: Record<string, number>;
    errors: string[];
  } {
    const errors: string[] = [];
    const added = { items: 0, mobs: 0, spells: 0, quests: 0, recipes: 0, maps: 0 };

    try {
      if (pkg.items && Array.isArray(pkg.items)) {
        pkg.items.forEach((item) => {
          if (!item.id || !item.name) {
            errors.push(`Item invalido omitido: falta id o nombre.`);
          } else {
            this.registerItem(item);
            added.items++;
          }
        });
      }

      if (pkg.mobs && Array.isArray(pkg.mobs)) {
        pkg.mobs.forEach((mob) => {
          if (!mob.id || !mob.name) {
            errors.push(`Mob invalido omitido: falta id o nombre.`);
          } else {
            this.registerMob(mob);
            added.mobs++;
          }
        });
      }

      if (pkg.spells && Array.isArray(pkg.spells)) {
        pkg.spells.forEach((spell) => {
          if (!spell.id || !spell.name) {
            errors.push(`Hechizo invalido omitido: falta id o nombre.`);
          } else {
            this.registerSpell(spell);
            added.spells++;
          }
        });
      }

      if (pkg.quests && Array.isArray(pkg.quests)) {
        pkg.quests.forEach((quest) => {
          if (!quest.id || !quest.title) {
            errors.push(`Misión invalida omitida: falta id o titulo.`);
          } else {
            this.registerQuest(quest);
            added.quests++;
          }
        });
      }

      if (pkg.recipes && Array.isArray(pkg.recipes)) {
        pkg.recipes.forEach((recipe) => {
          if (!recipe.id || !recipe.name) {
            errors.push(`Receta invalida omitida: falta id o nombre.`);
          } else {
            this.registerRecipe(recipe);
            added.recipes++;
          }
        });
      }

      if (pkg.maps && Array.isArray(pkg.maps)) {
        pkg.maps.forEach((map) => {
          if (!map.id || !map.name) {
            errors.push(`Mapa invalido omitido: falta id o nombre.`);
          } else {
            this.registerMap(map);
            added.maps++;
          }
        });
      }

      return {
        success: errors.length === 0,
        added,
        errors,
      };
    } catch (e) {
      return {
        success: false,
        added,
        errors: [`Error procesando paquete de contenido: ${(e as Error).message}`],
      };
    }
  }

  public loadFromJSON(jsonString: string): {
    success: boolean;
    added: Record<string, number>;
    errors: string[];
  } {
    try {
      const parsed = JSON.parse(jsonString) as ContentPackage;
      return this.loadContentPackage(parsed);
    } catch (e) {
      return {
        success: false,
        added: { items: 0, mobs: 0, spells: 0, quests: 0, recipes: 0, maps: 0 },
        errors: [`JSON invalido: ${(e as Error).message}`],
      };
    }
  }

  public exportToJSON(): string {
    const contentPkg: ContentPackage = {
      version: '1.0.0',
      items: this.getAllItems(),
      mobs: this.getAllMobs(),
      spells: this.getAllSpells(),
      quests: this.getAllQuests(),
      recipes: this.getAllRecipes(),
      maps: this.getAllMaps(),
    };
    return JSON.stringify(contentPkg, null, 2);
  }

  // --- DATA INTEGRITY DIAGNOSTIC ---
  public validateDataIntegrity(): DataIntegrityReport {
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Validate Mob Drops
    this.mobs.forEach((mob) => {
      mob.drops.forEach((drop) => {
        if (!this.items.has(drop.itemId)) {
          errors.push(`Mob '${mob.name}' (${mob.id}) referencia item inexistent de drop: '${drop.itemId}'`);
        }
      });
    });

    // 2. Validate Quests
    this.quests.forEach((quest) => {
      if (quest.objectiveType === 'kill' && !this.mobs.has(quest.targetId)) {
        warnings.push(`Misión '${quest.title}' (${quest.id}) pide matar mob no registrado: '${quest.targetId}'`);
      }
      if (quest.objectiveType === 'gather' && !this.items.has(quest.targetId)) {
        warnings.push(`Misión '${quest.title}' (${quest.id}) pide recolectar item no registrado: '${quest.targetId}'`);
      }
      if (quest.itemReward && !this.items.has(quest.itemReward.itemId)) {
        errors.push(`Misión '${quest.title}' (${quest.id}) otorga item de recompensa no registrado: '${quest.itemReward.itemId}'`);
      }
    });

    // 3. Validate Crafting Recipes
    this.recipes.forEach((recipe) => {
      if (!this.items.has(recipe.outputItemId)) {
        errors.push(`Receta '${recipe.name}' (${recipe.id}) produce item no registrado: '${recipe.outputItemId}'`);
      }
      recipe.ingredients.forEach((ing) => {
        if (!this.items.has(ing.itemId)) {
          errors.push(`Receta '${recipe.name}' (${recipe.id}) requiere ingrediente no registrado: '${ing.itemId}'`);
        }
      });
    });

    // 4. Validate Maps
    this.maps.forEach((map) => {
      map.mobSpawns.forEach((spawn) => {
        if (!this.mobs.has(spawn.mobId)) {
          errors.push(`Mapa '${map.name}' (${map.id}) spawnea mob no registrado: '${spawn.mobId}'`);
        }
      });
      map.npcs.forEach((npc) => {
        if (npc.givesQuestId && !this.quests.has(npc.givesQuestId)) {
          warnings.push(`NPC '${npc.name}' en mapa '${map.name}' ofrece misión no registrada: '${npc.givesQuestId}'`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      counts: {
        items: this.items.size,
        mobs: this.mobs.size,
        spells: this.spells.size,
        quests: this.quests.size,
        recipes: this.recipes.size,
        maps: this.maps.size,
      },
    };
  }
}

export const contentRegistry = ContentRegistry.getInstance();
