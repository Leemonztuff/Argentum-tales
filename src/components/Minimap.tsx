import React, { useMemo } from 'react';
import { GameMap, PlayerCharacter, ActiveMob } from '../types/game';

interface MinimapProps {
  currentMap: GameMap;
  player: PlayerCharacter;
  activeMobs: ActiveMob[];
}

// Terrain palette for the radar canvas (mejora 6: real tile layout instead
// of icons floating on a plain background).
const TILE_COLORS: Record<number, string> = {
  0: '#274a1e', // grass
  1: '#3d3d4b', // wall
  2: '#155a75', // water
  3: '#4b4b58', // stone floor
  4: '#5d4a33', // wood floor
  5: '#17301a', // dense trees
  6: '#413b3b', // big rock
  7: '#07070d', // void
  8: '#6e5732', // dirt path
};

export const Minimap: React.FC<MinimapProps> = ({
  currentMap,
  player,
  activeMobs,
}) => {
  const mapW = currentMap.width;
  const mapH = currentMap.height;

  // Bake the tile layout once per map into a tiny pixel canvas.
  const terrainUrl = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = mapW;
    canvas.height = mapH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        ctx.fillStyle = TILE_COLORS[currentMap.tiles[y]?.[x] ?? 7] || '#111118';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas.toDataURL();
  }, [currentMap, mapW, mapH]);

  return (
    <div className="absolute top-16 right-3 pointer-events-auto z-20 hidden md:flex flex-col items-center hud-blur rounded-2xl p-2.5 shadow-2xl shadow-black/80">
      <div className="flex items-center justify-between w-full mb-1.5 px-0.5 text-[9px] font-bold text-slate-400 font-pixel tracking-wider">
        <span>Radar</span>
        <span className="text-amber-400">({player.x}, {player.y})</span>
      </div>

      <div
        className="relative bg-[#08080c]/90 border border-white/10 rounded-xl overflow-hidden shadow-inner"
        style={{ width: 104, height: 104 }}
      >
        {/* Baked terrain layout */}
        {terrainUrl && (
          <img
            src={terrainUrl}
            alt=""
            className="absolute inset-0 w-full h-full opacity-80"
            style={{ imageRendering: 'pixelated' }}
          />
        )}

        {/* Portals */}
        {currentMap.portals.map((p, idx) => (
          <div
            key={idx}
            className="absolute w-2 h-2 rounded-full bg-cyan-400 border border-cyan-200 animate-ping"
            style={{
              left: `${(p.x / mapW) * 100}%`,
              top: `${(p.y / mapH) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* NPCs */}
        {currentMap.npcs.map((npc) => (
          <div
            key={npc.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-sky-400 border border-white shadow-sm"
            style={{
              left: `${(npc.x / mapW) * 100}%`,
              top: `${(npc.y / mapH) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            title={npc.name}
          />
        ))}

        {/* Gather nodes */}
        {currentMap.gatherNodes.map((node) => (
          <div
            key={node.id}
            className={`absolute w-1 h-1 rounded-full ${
              node.harvested ? 'bg-slate-600' : 'bg-emerald-300'
            }`}
            style={{
              left: `${(node.x / mapW) * 100}%`,
              top: `${(node.y / mapH) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Mobs */}
        {activeMobs.map((mob) => (
          <div
            key={mob.instanceId}
            className={`absolute w-1.5 h-1.5 rounded-full ${
              mob.isBoss
                ? 'bg-purple-500 w-2.5 h-2.5 border border-purple-200'
                : mob.isRevengeTarget
                ? 'bg-amber-400 animate-pulse'
                : 'bg-red-500'
            }`}
            style={{
              left: `${(mob.x / mapW) * 100}%`,
              top: `${(mob.y / mapH) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Chests */}
        {currentMap.chests.map((chest) => (
          <div
            key={chest.id}
            className={`absolute w-1.5 h-1.5 rounded-sm ${
              chest.isOpened ? 'bg-slate-700' : 'bg-yellow-400 border border-amber-200 shadow-sm'
            }`}
            style={{
              left: `${(chest.x / mapW) * 100}%`,
              top: `${(chest.y / mapH) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Player Point */}
        <div
          className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-lg z-10 animate-pulse"
          style={{
            left: `${(player.x / mapW) * 100}%`,
            top: `${(player.y / mapH) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  );
};
