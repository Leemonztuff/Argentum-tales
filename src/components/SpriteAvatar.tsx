import React from 'react';
import { SPRITESHEETS, CLASS_SPRITES, DEFAULT_MOB_SPRITE, DEFAULT_NPC_SPRITE } from '../data/spritesheets';

interface SpriteAvatarProps {
  spriteUrl?: string;
  fallbackEmoji?: string;
  facing?: 'down' | 'left' | 'right' | 'up';
  animFrame?: number;
  size?: number; // size in px, default 40
  className?: string;
  glowColor?: string;
}

export const SpriteAvatar: React.FC<SpriteAvatarProps> = ({
  spriteUrl,
  fallbackEmoji = '👤',
  facing = 'down',
  animFrame = 0,
  size = 40,
  className = '',
  glowColor,
}) => {
  // If spriteUrl is not provided directly, check if fallbackEmoji matches a class or mob
  const effectiveUrl = spriteUrl || (
    fallbackEmoji.includes('🐺') || fallbackEmoji.includes('🐍') || fallbackEmoji.includes('🥷') ||
    fallbackEmoji.includes('👹') || fallbackEmoji.includes('🕷️') || fallbackEmoji.includes('💀') ||
    fallbackEmoji.includes('🧙‍♂️') || fallbackEmoji.includes('🦀') || fallbackEmoji.includes('🏴‍☠️') ||
    fallbackEmoji.includes('🐉') || fallbackEmoji.includes('👻') || fallbackEmoji.includes('👿') ||
    fallbackEmoji.includes('🤖')
      ? DEFAULT_MOB_SPRITE
      : DEFAULT_NPC_SPRITE
  );

  const col = animFrame % 4;
  let row = 0;
  if (facing === 'left') row = 1;
  else if (facing === 'right') row = 2;
  else if (facing === 'up') row = 3;

  const posX = col === 0 ? '0%' : col === 1 ? '33.333333%' : col === 2 ? '66.666666%' : '100%';
  const posY = row === 0 ? '0%' : row === 1 ? '33.333333%' : row === 2 ? '66.666666%' : '100%';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden bg-slate-900/80 border border-white/10 shrink-0 select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: glowColor ? `0 0 12px ${glowColor}40` : undefined,
      }}
    >
      {effectiveUrl ? (
        <div
          className="w-full h-full bg-no-repeat bg-center transform scale-100 pixel-art"
          style={{
            backgroundImage: `url("${effectiveUrl}")`,
            backgroundSize: '400% 400%',
            backgroundPosition: `${posX} ${posY}`,
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <span className="text-xl">{fallbackEmoji}</span>
      )}
    </div>
  );
};
