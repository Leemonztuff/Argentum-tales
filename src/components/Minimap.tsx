import React from 'react';
import { GameMap, PlayerCharacter, ActiveMob } from '../types/game';

interface MinimapProps {
  currentMap: GameMap;
  player: PlayerCharacter;
  activeMobs: ActiveMob[];
}

export const Minimap: React.FC<MinimapProps> = ({
  currentMap,
  player,
  activeMobs,
}) => {
  const mapW = currentMap.width;
  const mapH = currentMap.height;

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
