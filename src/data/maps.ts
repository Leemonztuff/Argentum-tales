import { GameMap } from '../types/game';

// Map Dimensions: custom per map
const parseMapStr = (str: string): number[][] => {
  const charMap: Record<string, number> = {
    '.': 0, // Grass/Dirt
    '#': 1, // Wall
    '~': 2, // Water
    ',': 3, // Stone/Cobble floor
    '=': 4, // Wood floor
    'T': 5, // Dense Tree Block
    'R': 6, // Big Rock Block
    ' ': 7, // Void (empty, blocked)
  };
  const lines = str.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(line => line.split('').map(c => charMap[c] ?? 0));
};

const mapNovicioStr = `
######################
#,,,,,#,,,,,,,,#,,,,,#
#,,,,,#,,,,,,,,#,,,,,#
#,,,,,#,,,,,,,,#,,,,,#
#,,,,,#,,,,,,,,#,,,,,#
#,,,,,##########,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
#,,,,,,,#,,,#,,,,,,,,#
##########,###########
`;
const novicioGrid = parseMapStr(mapNovicioStr);

const mapPuebloStr = `
RRRRRRRRRRRR,RRRRRRRRRRRR
R.......................R
R...T.T.T.......T.T.T...R
R..T#####T.....T#####T..R
R..T#===#T.....T#===#T..R
R..T#===#T.....T#===#T..R
R..T#===#T.....T#===#T..R
R..T#####T.....T#####T..R
R...T.T.T.......T.T.T...R
R.......................R
R.......................R
R..........~~~..........R
,..........~~~..........,
,..........~~~..........,
R.......................R
R.......................R
R...T#####T...T#####T...R
R...T#===#T...T#===#T...R
R...T#===#T...T#===#T...R
R...T#===#T...T#===#T...R
R...T#####T...T#####T...R
R...T.T.T.......T.T.T...R
R.......................R
RRRRRRRRRRRR,RRRRRRRRRRRR
`;
const puebloGrid = parseMapStr(mapPuebloStr);

const mapBosque1Str = `
TTTTTTTTTTTT,TTTTTTTTTTTT
T.......................T
T....T............T.....T
T...TTT..........TTT....T
T..TTTTT........TTTT....T
T....T..................T
T..........~~~..........T
T.........~~~~~.........T
T........~~~~~~~........T
T........~~~~~~~........T
T.........~~~~~.........T
T..........~~~..........T
T................T......T
T...............TTT.....T
T..............TTTTT....T
T................T......T
T.......................T
T.......T...............T
T......TTT..............T
T.....TTTTT.............T
T.......T...............T
T.......................T
T.......................T
TTTTTTTTTTTT,TTTTTTTTTTTT
`;
const bosque1Grid = parseMapStr(mapBosque1Str);

const mapBosque2Str = `
TTTTTTTTTTTT,TTTTTTTTTTTT
T.......................T
T...RRR...........RRR...T
T..RRRRR.........RRRRR..T
T...RRR...........RRR...T
T.......................T
T.......................T
T.......TTTTTTT.........T
T.......T.....T.........T
T.......T.....T.........T
T.......T.....T.........T
T.......TTTTTTT.........T
T.......................T
T.......................T
T...RRR...........RRR...T
T..RRRRR.........RRRRR..T
T...RRR...........RRR...T
T.......................T
T.......................T
T.......................T
T.......................T
T.......................T
T.......................T
TTTTTTTTTTTT,TTTTTTTTTTTT
`;
const bosque2Grid = parseMapStr(mapBosque2Str);

const mapCriptaStr = `
#############,#############
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#########,,,,,#############
#,,,,,,,,,,,,#,,,,,,,,,,,,#
#,,,,,,,,,,,,#,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,#,,,,,,,,,,,,#
#,,,,,,,,,,,,#,,,,,,,,,,,,#
#########,,,,,#############
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#########,,,,,#############
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#########,,,,,#############
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
#,,,,,,,,,,,,,,,,,,,,,,,,,#
###########################
`;
const criptaGrid = parseMapStr(mapCriptaStr);

const mapCostaStr = `
TTTTTTTTTTTT,TTTTT~~~~~~~
T..................~~~~~~
T...................~~~~~
T....................~~~~
T....................~~~~
T.....................~~~
T.....................~~~
T.....................~~~
T......................~~
T......................~~
T......................~~
T......................~~
,......................~~
,......................~~
T......................~~
T......................~~
T......................~~
T......................~~
T......................~~
T......................~~
T.....................~~~
T.....................~~~
T....................~~~~
TTTTTTTTTTTT,TTTTT~~~~~~~
`;
const costaGrid = parseMapStr(mapCostaStr);

const mapFaroStr = `
########################
#======================#
#======================#
#======================#
#======================#
#======================#
#======#========#======#
#======#========#======#
#======================#
#======================#
#======================#
#======================#
#======================#
#======================#
#======================#
#======================#
#======#========#======#
#======#========#======#
#======================#
#======================#
#======================#
#======================#
#======================#
###########==###########
`;
const faroGrid = parseMapStr(mapFaroStr);

const mapRuinasStr = `
RRRRRRRRRRRR,RRRRRRRRRRRR
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,#,,,,,,,,,,,,,#,,,,R
R,,,,#,,,,,,,,,,,,,#,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,#,,,,,,,,,,,,,#,,,,R
R,,,,#,,,,,,,,,,,,,#,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
R,,,,,,,,,,,,,,,,,,,,,,,R
RRRRRRRRRRRR,RRRRRRRRRRRR
`;
const ruinasGrid = parseMapStr(mapRuinasStr);

const mapFinalStr = `
#########################
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#~~~~~~~~~~~.~~~~~~~~~~~#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#~~~~~~~~~~~.~~~~~~~~~~~#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#,,,,,,,,,,,.,,,,,,,,,,,#
#########################
`;
const finalGrid = parseMapStr(mapFinalStr);

export const MAPS: Record<string, GameMap> = {
  mapa_novicio: {
    id: 'mapa_novicio',
    name: 'Campo de Novicios',
    subtitle: 'Tutorial Cerrado — Academia de Combate',
    isSafe: false,
    isDungeon: false,
    width: novicioGrid[0].length,
    height: novicioGrid.length,
    ambientLight: '#fef3c7',
    fogColor: '#1e1b4b',
    theme: 'town',
    tiles: novicioGrid,
    portals: [
      {
        x: 10,
        y: 20,
        targetMapId: 'pueblo_inicial',
        targetX: 12,
        targetY: 12,
        label: 'Portal a Villa Ullathorpe (Pueblo)',
      },
    ],
    chests: [
      {
        id: 'chest_novicio_cofre',
        x: 18,
        y: 4,
        isOpened: false,
        gold: 15,
        items: [{ itemId: 'pocion_roja', count: 3 }],
      },
    ],
    gatherNodes: [],
    npcs: [
      {
        id: 'npc_instructor_novicio',
        name: 'Instructor General',
        title: 'Maestro de Novicios',
        sprite: '🛡️👨‍🏫',
        color: '#fbbf24',
        x: 10,
        y: 3,
        dialogue: [
          '¡Bienvenido al Campo de Entrenamiento, Novicio!',
          'Aprende los tres pilares del combate antes de aventurarte en Arandor:',
          '1. ZONA 1 (Norte): Muévete con el joystick para alinear tu objetivo en línea recta (X o Y). Verás una línea punteada dorada.',
          '2. ZONA 2 (Centro): Practica el agite en el maniquí. Respeta el tiempo de cooldown circular del botón de ataque.',
          '3. ZONA 3 (Sur): Enfréntate a las criaturas en el corralito para probar el acierto, evasión y loot real.',
          '¡Cuando estés listo, cruza el portal sur hacia Villa Ullathorpe para elegir tu Job definitivo!',
        ],
        givesQuestId: 'quest_novicio_entrenamiento',
      },
    ],
    mobSpawns: [
      { mobId: 'maniqui_alineacion', x: 10, y: 7, respawnSec: 3 },
      { mobId: 'maniqui_cooldown', x: 10, y: 12, respawnSec: 3 },
      { mobId: 'rata_novicio', x: 9, y: 17, respawnSec: 8 },
      { mobId: 'slime_novicio', x: 11, y: 17, respawnSec: 10 },
    ],
  },

  pueblo_inicial: {
    id: 'pueblo_inicial',
    name: 'Villa de Ullathorpe',
    subtitle: 'Zona Segura — Santuario de Aventureros',
    isSafe: true,
    isDungeon: false,
    width: puebloGrid[0].length,
    height: puebloGrid.length,
    ambientLight: '#fef08a',
    fogColor: '#0f172a',
    theme: 'town',
    tiles: puebloGrid,
    portals: [
      {
        x: 12,
        y: 23,
        targetMapId: 'bosque_01',
        targetX: 12,
        targetY: 1,
        label: 'Hacia Bosque de los Lobos (Sur)',
      },
      {
        x: 24,
        y: 12,
        targetMapId: 'costa_01',
        targetX: 1,
        targetY: 12,
        label: 'Hacia Costa de las Sirenas (Este)',
      },
      {
        x: 0,
        y: 12,
        targetMapId: 'mapa_novicio',
        targetX: 10,
        targetY: 19,
        label: 'Regresar al Campo de Novicios (Oeste)',
      },
    ],
    chests: [
      {
        id: 'chest_pueblo_starter',
        x: 4,
        y: 17,
        isOpened: false,
        gold: 25,
        items: [{ itemId: 'pocion_roja', count: 2 }],
      },
    ],
    gatherNodes: [],
    npcs: [
      {
        id: 'npc_anciano',
        name: 'Maestro Eldrin',
        title: 'Guardián del Valle',
        sprite: '🧙‍♂️',
        color: '#60a5fa',
        x: 12,
        y: 8,
        dialogue: [
          '¡Saludos, viajero! Las sombras del Caos amenazan las tierras de Arandor.',
          'Nuestros caminos están infestados de bestias. Habla conmigo para obtener misiones.',
          'Recuerda: en combate, mantén la alineación en línea recta (X o Y) y sincroniza tu agite.',
        ],
        givesQuestId: 'quest_1_lobos',
      },
      {
        id: 'npc_herrero',
        name: 'Thorin Martilloférreo',
        title: 'Maestro Forjador',
        sprite: '🔨🧔',
        color: '#f97316',
        x: 5,
        y: 6,
        dialogue: [
          '¿Buscas buen acero? Vendo armas, armaduras y escudos de calidad.',
          'Si me traes mineral de hierro y madera, puedo forjarte equipamiento superior.',
        ],
        shopType: 'weapons',
      },
      {
        id: 'npc_alquimista',
        name: 'Eliana la Botánica',
        title: 'Maestra de Pociones',
        sprite: '🧪🧝‍♀️',
        color: '#ec4899',
        x: 18,
        y: 6,
        dialogue: [
          'Pociones rojas de vida y azules de maná frescas para la batalla.',
          'Tráeme hierbas lunarias y perlas para destilar elixires potenciadores.',
        ],
        shopType: 'potions',
      },
      {
        id: 'npc_capitan',
        name: 'Capitán Roger',
        title: 'Comandante de la Guardia',
        sprite: '🛡️⚔️',
        color: '#fbbf24',
        x: 12,
        y: 16,
        dialogue: [
          'Los piratas en la costa y los horrores del faro no nos dan tregua.',
          'Si limpias los peligros de ultramar, el reino te recompensará con creces.',
        ],
        givesQuestId: 'quest_3_costa',
      },
      {
        id: 'npc_instructor_guerrero',
        name: 'Instructor Thorin',
        title: 'Maestro de la Vía del Acero (Job Guerrero)',
        sprite: '⚔️🛡️',
        color: '#ef4444',
        x: 4,
        y: 8,
        dialogue: [
          '¿Sientes la vocación del acero? Los Guerreros somos el baluarte inquebrantable.',
          'Completa la prueba eliminando 3 Orcos Exploradores para convertirte en Guerrero.',
        ],
        givesQuestId: 'quest_job_guerrero',
        jobPromotionClass: 'guerrero',
      },
      {
        id: 'npc_instructor_cazador',
        name: 'Guardabosques Silva',
        title: 'Maestra de la Sombra y el Arco (Job Cazador)',
        sprite: '🏹🧝‍♂️',
        color: '#22c55e',
        x: 10,
        y: 20,
        dialogue: [
          'El viento guía nuestras flechas. El Cazador domina la distancia y la evasión.',
          'Caza 3 Jabalíes Furia en el Bosque para unirte a nuestro gremio.',
        ],
        givesQuestId: 'quest_job_cazador',
        jobPromotionClass: 'cazador',
      },
      {
        id: 'npc_instructor_mago',
        name: 'Archimago Valerius',
        title: 'Gran Sabio de la Torre Arcana (Job Mago)',
        sprite: '🔮🧙‍♂️',
        color: '#a855f7',
        x: 19,
        y: 8,
        dialogue: [
          'El poder de los elementos destruye a los malvados. La Magia es conocimiento supremo.',
          'Derrota 3 Víboras Pantanosas para reclamar tu título de Mago Arcano.',
        ],
        givesQuestId: 'quest_job_mago',
        jobPromotionClass: 'mago',
      },
      {
        id: 'npc_instructor_asesino',
        name: 'Sombra Nocturna',
        title: 'Contacto del Gremio de Ladrones (Job Asesino)',
        sprite: '🗡️🥷',
        color: '#64748b',
        x: 4,
        y: 19,
        dialogue: [
          'El golpe mortal se asesta desde la oscuridad. Apuñalar e invisibilidad son nuestras armas.',
          'Elimina 3 Bandidos en los caminos para demostrar tu valía en el gremio.',
        ],
        givesQuestId: 'quest_job_asesino',
        jobPromotionClass: 'picaro',
      },
    ],
    mobSpawns: [],
  },

  bosque_01: {
    id: 'bosque_01',
    name: 'Bosque de los Lobos',
    subtitle: 'Nivel recomendado: 1 - 3',
    isSafe: false,
    isDungeon: false,
    width: bosque1Grid[0].length,
    height: bosque1Grid.length,
    ambientLight: '#86efac',
    fogColor: '#052e16',
    theme: 'forest',
    tiles: bosque1Grid,
    portals: [
      {
        x: 12,
        y: 0,
        targetMapId: 'pueblo_inicial',
        targetX: 12,
        targetY: 22,
        label: 'Retorno a Villa Ullathorpe (Norte)',
      },
      {
        x: 12,
        y: 23,
        targetMapId: 'bosque_02',
        targetX: 12,
        targetY: 1,
        label: 'Hacia Bosque Profundo (Sur)',
      },
    ],
    chests: [
      {
        id: 'chest_bosque1',
        x: 21,
        y: 4,
        isOpened: false,
        gold: 40,
        items: [{ itemId: 'pocion_roja', count: 2 }, { itemId: 'flechas', count: 30 }],
      },
    ],
    gatherNodes: [
      { id: 'node_tree_1', type: 'tree', x: 5, y: 8, harvested: false, respawnTime: 0, yieldItemId: 'madera_roble' },
      { id: 'node_tree_2', type: 'tree', x: 20, y: 14, harvested: false, respawnTime: 0, yieldItemId: 'madera_roble' },
      { id: 'node_herb_1', type: 'herb', x: 8, y: 18, harvested: false, respawnTime: 0, yieldItemId: 'hierba_curativa' },
      { id: 'node_ore_1', type: 'ore', x: 19, y: 20, harvested: false, respawnTime: 0, yieldItemId: 'mineral_hierro' },
    ],
    npcs: [],
    mobSpawns: [
      { mobId: 'lobo_bosque', x: 6, y: 6, respawnSec: 10 },
      { mobId: 'lobo_bosque', x: 18, y: 8, respawnSec: 10 },
      { mobId: 'serpiente_venenosa', x: 7, y: 15, respawnSec: 12 },
      { mobId: 'serpiente_venenosa', x: 17, y: 18, respawnSec: 12 },
      { mobId: 'bandido_camino', x: 13, y: 12, respawnSec: 15 },
      { mobId: 'lobo_bosque', x: 8, y: 22, respawnSec: 10 },
    ],
  },

  bosque_02: {
    id: 'bosque_02',
    name: 'Bosque Profundo',
    subtitle: 'Nivel recomendado: 3 - 5',
    isSafe: false,
    isDungeon: false,
    width: bosque2Grid[0].length,
    height: bosque2Grid.length,
    ambientLight: '#4ade80',
    fogColor: '#022c22',
    theme: 'forest',
    tiles: bosque2Grid,
    portals: [
      {
        x: 12,
        y: 0,
        targetMapId: 'bosque_01',
        targetX: 12,
        targetY: 22,
        label: 'Hacia Bosque de los Lobos (Norte)',
      },
      {
        x: 12,
        y: 23,
        targetMapId: 'dungeon_cripta',
        targetX: 13,
        targetY: 1,
        label: 'Entrar a la Cripta Maldita (Sur)',
      },
    ],
    chests: [
      {
        id: 'chest_bosque2_orcs',
        x: 4,
        y: 20,
        isOpened: false,
        gold: 80,
        items: [{ itemId: 'anillo_agilidad', count: 1 }, { itemId: 'mineral_hierro', count: 4 }],
      },
    ],
    gatherNodes: [
      { id: 'node_b2_tree', type: 'tree', x: 6, y: 6, harvested: false, respawnTime: 0, yieldItemId: 'madera_roble' },
      { id: 'node_b2_ore', type: 'ore', x: 20, y: 8, harvested: false, respawnTime: 0, yieldItemId: 'mineral_hierro' },
      { id: 'node_b2_herb', type: 'herb', x: 21, y: 18, harvested: false, respawnTime: 0, yieldItemId: 'hierba_curativa' },
    ],
    npcs: [],
    mobSpawns: [
      { mobId: 'orco_explorador', x: 6, y: 10, respawnSec: 14 },
      { mobId: 'orco_explorador', x: 19, y: 12, respawnSec: 14 },
      { mobId: 'arana_gigante', x: 8, y: 18, respawnSec: 12 },
      { mobId: 'arana_gigante', x: 17, y: 20, respawnSec: 12 },
      { mobId: 'bandido_camino', x: 14, y: 6, respawnSec: 15 },
    ],
  },

  dungeon_cripta: {
    id: 'dungeon_cripta',
    name: 'Dungeon Cripta',
    subtitle: 'Mazmorra de 5 Salas — Jefe: Fendhel, el Ciervo Espectral',
    isSafe: false,
    isDungeon: true,
    width: criptaGrid[0].length,
    height: criptaGrid.length,
    ambientLight: '#38bdf8',
    fogColor: '#0f172a',
    theme: 'crypt',
    tiles: criptaGrid,
    portals: [
      {
        x: 13,
        y: 0,
        targetMapId: 'bosque_02',
        targetX: 12,
        targetY: 22,
        label: 'Salir al Bosque Profundo',
      },
    ],
    chests: [
      {
        id: 'chest_cripta_secret_2b',
        x: 20,
        y: 9,
        isOpened: false,
        gold: 180,
        items: [{ itemId: 'libro_herreria_intermedia', count: 1 }, { itemId: 'pocion_azul', count: 2 }],
      },
      {
        id: 'chest_cripta_boss',
        x: 13,
        y: 26,
        isOpened: false,
        gold: 400,
        items: [{ itemId: 'egida_fendhel', count: 1 }, { itemId: 'pocion_azul', count: 3 }],
      },
    ],
    gatherNodes: [],
    npcs: [],
    mobSpawns: [
      // Sala 1: Entrada (Sin combate - §4.2)
      // Sala 2: Cámara de sepulcros (2 enemigos - §4.2)
      { mobId: 'esqueleto_guerrero', x: 6, y: 8, respawnSec: 20 },
      { mobId: 'esqueleto_guerrero', x: 6, y: 11, respawnSec: 20 },
      // Sala 3: Corredor de huesos (3 enemigos más duros - §4.2)
      { mobId: 'esqueleto_guerrero', x: 8, y: 15, respawnSec: 20 },
      { mobId: 'nigromante_cripta', x: 13, y: 15, respawnSec: 25 },
      { mobId: 'esqueleto_guerrero', x: 18, y: 15, respawnSec: 20 },
      // Sala 4: Antesala (Punto de calma sin enemigos - §4.2)
      // Sala 5: Santuario / Arena de Fendhel (§4.2 / §11)
      { mobId: 'boss_fendhel', x: 13, y: 24, respawnSec: 60 },
    ],
  },

  costa_01: {
    id: 'costa_01',
    name: 'Costa de las Sirenas',
    subtitle: 'Nivel recomendado: 5 - 7',
    isSafe: false,
    isDungeon: false,
    width: costaGrid[0].length,
    height: costaGrid.length,
    ambientLight: '#38bdf8',
    fogColor: '#082f49',
    theme: 'coast',
    tiles: costaGrid,
    portals: [
      {
        x: 0,
        y: 12,
        targetMapId: 'pueblo_inicial',
        targetX: 23,
        targetY: 12,
        label: 'Retorno a Villa Ullathorpe (Oeste)',
      },
      {
        x: 12,
        y: 0,
        targetMapId: 'dungeon_faro',
        targetX: 11,
        targetY: 22,
        label: 'Subir al Faro Olvidado (Norte)',
      },
      {
        x: 12,
        y: 23,
        targetMapId: 'ruinas_final',
        targetX: 12,
        targetY: 1,
        label: 'Hacia las Ruinas de Arandor (Sur)',
      },
    ],
    chests: [
      {
        id: 'chest_costa_shipwreck',
        x: 14,
        y: 20,
        isOpened: false,
        gold: 150,
        items: [{ itemId: 'botas_velocidad', count: 1 }, { itemId: 'perla_abismo', count: 2 }],
      },
    ],
    gatherNodes: [
      { id: 'node_costa_pearl', type: 'herb', x: 15, y: 7, harvested: false, respawnTime: 0, yieldItemId: 'perla_abismo' },
      { id: 'node_costa_ore', type: 'ore', x: 5, y: 19, harvested: false, respawnTime: 0, yieldItemId: 'mineral_hierro' },
    ],
    npcs: [
      {
        id: 'npc_coleccionista',
        name: 'El Coleccionista Errante',
        title: 'Mercader de Tomos y Recetas Prohibidas (§8.4)',
        sprite: '📜🧳',
        color: '#f59e0b',
        x: 4,
        y: 11,
        dialogue: [
          '¿No has conseguido el tomo que buscabas en las mazmorras? Todo tiene un precio.',
          'Tengo recetas intermedias y grimorios de Segundo Job para aquellos con suficiente oro.',
          'El saber no se pierde en Arandor, solo cambia de manos...',
        ],
        shopType: 'crafting',
      },
    ],
    mobSpawns: [
      { mobId: 'cangrejo_acorazado', x: 8, y: 6, respawnSec: 12 },
      { mobId: 'cangrejo_acorazado', x: 13, y: 14, respawnSec: 12 },
      { mobId: 'pirata_costa', x: 6, y: 15, respawnSec: 15 },
      { mobId: 'pirata_costa', x: 10, y: 22, respawnSec: 15 },
    ],
  },

  dungeon_faro: {
    id: 'dungeon_faro',
    name: 'Faro Olvidado',
    subtitle: 'Mazmorra — 3 Pisos + Jefe: Leviatán Abisal',
    isSafe: false,
    isDungeon: true,
    width: faroGrid[0].length,
    height: faroGrid.length,
    ambientLight: '#38bdf8',
    fogColor: '#0c4a6e',
    theme: 'lighthouse',
    tiles: faroGrid,
    portals: [
      {
        x: 11,
        y: 23,
        targetMapId: 'costa_01',
        targetX: 12,
        targetY: 1,
        label: 'Descender a la Costa',
      },
    ],
    chests: [
      {
        id: 'chest_faro_loot',
        x: 12,
        y: 4,
        isOpened: false,
        gold: 450,
        items: [{ itemId: 'baculo_abismo', count: 1 }, { itemId: 'perla_abismo', count: 4 }],
      },
    ],
    gatherNodes: [],
    npcs: [],
    mobSpawns: [
      { mobId: 'gargola_faro', x: 7, y: 14, respawnSec: 18 },
      { mobId: 'gargola_faro', x: 16, y: 14, respawnSec: 18 },
      { mobId: 'pirata_costa', x: 11, y: 10, respawnSec: 20 },
      { mobId: 'boss_leviatan_faro', x: 11, y: 6, respawnSec: 70 },
    ],
  },

  ruinas_final: {
    id: 'ruinas_final',
    name: 'Ruinas de Arandor',
    subtitle: 'Nivel recomendado: 8 - 10',
    isSafe: false,
    isDungeon: false,
    width: ruinasGrid[0].length,
    height: ruinasGrid.length,
    ambientLight: '#f59e0b',
    fogColor: '#451a03',
    theme: 'ruins',
    tiles: ruinasGrid,
    portals: [
      {
        x: 12,
        y: 0,
        targetMapId: 'costa_01',
        targetX: 12,
        targetY: 22,
        label: 'Hacia Costa de las Sirenas (Norte)',
      },
      {
        x: 12,
        y: 23,
        targetMapId: 'dungeon_final',
        targetX: 12,
        targetY: 1,
        label: 'Entrar al Templo del Caos (Sur)',
      },
    ],
    chests: [
      {
        id: 'chest_ruinas_ancient',
        x: 21,
        y: 21,
        isOpened: false,
        gold: 600,
        items: [{ itemId: 'amuleto_arandor', count: 1 }, { itemId: 'espada_larga', count: 1 }],
      },
    ],
    gatherNodes: [
      { id: 'node_ruinas_ore', type: 'ore', x: 6, y: 18, harvested: false, respawnTime: 0, yieldItemId: 'mineral_hierro' },
    ],
    npcs: [],
    mobSpawns: [
      { mobId: 'golem_antiguo', x: 7, y: 8, respawnSec: 20 },
      { mobId: 'golem_antiguo', x: 18, y: 14, respawnSec: 20 },
      { mobId: 'espectro_ruinas', x: 8, y: 19, respawnSec: 16 },
      { mobId: 'espectro_ruinas', x: 18, y: 7, respawnSec: 16 },
    ],
  },

  dungeon_final: {
    id: 'dungeon_final',
    name: 'Templo del Caos',
    subtitle: 'Batalla Final — Malgor, Señor del Abismo',
    isSafe: false,
    isDungeon: true,
    width: finalGrid[0].length,
    height: finalGrid.length,
    ambientLight: '#ef4444',
    fogColor: '#450a0a',
    theme: 'fire_temple',
    tiles: finalGrid,
    portals: [
      {
        x: 12,
        y: 0,
        targetMapId: 'ruinas_final',
        targetX: 12,
        targetY: 22,
        label: 'Salir a las Ruinas de Arandor',
      },
    ],
    chests: [
      {
        id: 'chest_final_triumph',
        x: 12,
        y: 4,
        isOpened: false,
        gold: 2000,
        items: [{ itemId: 'espada_caos', count: 1 }, { itemId: 'armadura_placas', count: 1 }],
      },
    ],
    gatherNodes: [],
    npcs: [],
    mobSpawns: [
      { mobId: 'golem_antiguo', x: 6, y: 12, respawnSec: 25 },
      { mobId: 'espectro_ruinas', x: 19, y: 12, respawnSec: 25 },
      { mobId: 'boss_senor_abismo', x: 12, y: 6, respawnSec: 120 },
    ],
  },
};
