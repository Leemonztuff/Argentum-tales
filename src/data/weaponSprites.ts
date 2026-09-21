/**
 * Mapeo de armas (item id) → sprite single-frame para renderizar en la mano
 * del personaje vía el sistema de sockets (src/engine/SpriteSockets.ts).
 *
 * Los PNG viven en `public/weapons/`. Son gráficos ÚNICOS (sin vistas por
 * dirección): el sistema de sockets los rota/espeja según el facing y los
 * dibuja detrás o delante del cuerpo.
 *
 * Convención sugerida: PNG con transparencia, hoja apuntando hacia arriba,
 * empuñadura en la base (el socket ancla la empuñadura a la mano).
 */
export const WEAPON_SPRITES: Record<string, string> = {
  daga_simple: '/weapons/daga_simple.png',
  daga_asesina: '/weapons/daga_asesina.png',
  espada_corta: '/weapons/espada_corta.png',
  espada_larga: '/weapons/espada_larga.png',
  hacha_barbara: '/weapons/hacha_barbara.png',
  espada_caos: '/weapons/espada_caos.png',
  arco_simple: '/weapons/arco_simple.png',
  arco_compuesto: '/weapons/arco_compuesto.png',
  baculo_aprendiz: '/weapons/baculo_aprendiz.png',
  baculo_abismo: '/weapons/baculo_abismo.png',
};

/**
 * Devuelve la URL del sprite del arma equipada, o undefined si el ítem
 * no tiene arte aún (el arma simplemente no se dibuja).
 */
export function getWeaponSpriteUrl(itemId: string | null | undefined): string | undefined {
  if (!itemId) return undefined;
  return WEAPON_SPRITES[itemId];
}
