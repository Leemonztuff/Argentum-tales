/**
 * SpriteSockets — Sistema de anclado (sockets) para el paper-doll 2D.
 *
 * En vez de ratios anatómicos hardcodeados por dirección (la fuente del
 * "wobble" de la cabeza), las capas se anclan al RECTÁNGULO DE CONTENIDO
 * real del cuerpo YA dibujado en el canvas destino:
 *
 *   - Cabeza: su mentón se ancla al punto del cuello = centro X del torso
 *     superior del cuerpo + borde superior del contenido. Como se deriva del
 *     contenido de CADA frame, la cabeza sigue al cuerpo automáticamente.
 *   - Armas: una tabla de sockets de mano por dirección, expresada en
 *     coordenadas relativas (0..1) del rectángulo de contenido del cuerpo,
 *     con rotación/flip por dirección. Un arma single-frame cubre las 4
 *     vistas: detrás del cuerpo cuando mira arriba, delante en las demás.
 *
 * Los sockets son tweakable en caliente y se persisten en localStorage,
 * igual que la calibración de cabeza (ao_head_calibration).
 */

export type Facing = 'up' | 'down' | 'left' | 'right';

/** Socket de mano en coordenadas relativas del rectángulo de contenido del cuerpo. */
export interface HandSocket {
  /** 0..1 horizontal dentro del contenido del cuerpo (0 = borde izquierdo). */
  x: number;
  /** 0..1 vertical dentro del contenido del cuerpo (0 = línea del cuello). */
  y: number;
  /** Rotación del arma en grados (0 = hoja apuntando hacia arriba). */
  angleDeg: number;
  /** Espejo horizontal del gráfico del arma. */
  flipX: boolean;
  /** true: el arma se dibuja DETRÁS del cuerpo (mirando hacia arriba/norte). */
  behindBody: boolean;
}

/**
 * Tabla base de sockets. Valores pensados para cuerpos humanoides AO-style;
 * ajustables en runtime vía setSocketOverride (persistidos en localStorage).
 */
const DEFAULT_HAND_SOCKETS: Record<Facing, HandSocket> = {
  down:  { x: 0.74, y: 0.52, angleDeg: 35,  flipX: false, behindBody: false },
  left:  { x: 0.20, y: 0.50, angleDeg: 80,  flipX: true,  behindBody: false },
  right: { x: 0.80, y: 0.50, angleDeg: -80, flipX: false, behindBody: false },
  up:    { x: 0.26, y: 0.52, angleDeg: 215, flipX: false, behindBody: true  },
};

/** Bob vertical del arma siguiendo el ciclo de caminata (px de canvas 256). */
const WALK_BOB_PX = [1.5, 0, 1.5, 0];

/** Alto del arma como fracción del alto del contenido del cuerpo. */
export const WEAPON_HEIGHT_RATIO = 0.55;

const STORAGE_KEY = 'ao_socket_calibration_v1';

type Overrides = Partial<Record<Facing, Partial<HandSocket>>>;

let socketOverrides: Overrides = {};

try {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) socketOverrides = JSON.parse(saved) as Overrides;
  }
} catch {
  // localStorage no disponible — se usan defaults
}

/** Devuelve el socket de mano efectivo para una dirección (base + overrides). */
export function getHandSocket(facing: Facing, _animFrame = 0): HandSocket {
  return { ...DEFAULT_HAND_SOCKETS[facing], ...(socketOverrides[facing] ?? {}) };
}

/** Bob vertical (px canvas) que se suma al socket según el frame de caminata. */
export function getSocketBobPx(animFrame: number): number {
  return WALK_BOB_PX[((animFrame % 4) + 4) % 4];
}

/** Guarda/overrides parciales de un socket para una dirección (persiste). */
export function setSocketOverride(facing: Facing, patch: Partial<HandSocket>): void {
  socketOverrides = {
    ...socketOverrides,
    [facing]: { ...(socketOverrides[facing] ?? {}), ...patch },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(socketOverrides));
  } catch {
    // ignore
  }
}

/** Restablece todos los overrides a los defaults. */
export function resetSocketOverrides(): void {
  socketOverrides = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Lee los overrides actuales (para la UI de calibración). */
export function getSocketOverrides(): Overrides {
  return JSON.parse(JSON.stringify(socketOverrides));
}

/** Rectángulo del contenido visible de una capa ya dibujada en canvas. */
export interface ContentRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Ancla del cuello (donde "cuelga" la cabeza) derivada del contenido real
 * del cuerpo ya dibujado: centro X del torso + borde superior del contenido.
 * Al derivarse del contenido frame a frame, la cabeza sigue al cuerpo sin
 * calibración manual ni wobble entre frames/direcciones.
 */
export function getNeckAnchor(bodyContent: ContentRect, facing: Facing): { x: number; y: number } {
  const dirOffsetX = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
  return {
    x: bodyContent.x + bodyContent.w / 2 + dirOffsetX,
    y: bodyContent.y + Math.max(1, bodyContent.h * 0.04),
  };
}

/** Convierte un socket relativo a coordenadas absolutas del canvas. */
export function socketToCanvas(socket: HandSocket, bodyContent: ContentRect): { x: number; y: number } {
  return {
    x: bodyContent.x + socket.x * bodyContent.w,
    y: bodyContent.y + socket.y * bodyContent.h,
  };
}
