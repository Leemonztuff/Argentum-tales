import React from 'react';
import { Item } from '../../types/game';

interface ItemIconProps {
  item: Item;
  /** Container class for the <img> wrapper */
  className?: string;
  /** Size class applied to the <img> (e.g. 'w-8 h-8') */
  size?: string;
}

/**
 * Renders an item's icon as a PNG image when `iconPath` is set,
 * falling back to the emoji `icon` string otherwise.
 */
export const ItemIcon: React.FC<ItemIconProps> = ({ item, className = '', size = 'w-8 h-8' }) => {
  if (item.iconPath) {
    return (
      <img
        src={item.iconPath}
        alt={item.name}
        className={`${size} object-contain drop-shadow ${className}`}
        draggable={false}
      />
    );
  }
  return <span className={className}>{item.icon}</span>;
};
