import React from 'react';
import { Card, Rank, Suit } from '../../../shared/types';

interface CardViewProps {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isFaceDown?: boolean;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  0: '♠',
  1: '♣',
  2: '♦',
  3: '♥',
};

export const RANK_SYMBOLS: Record<Rank, string> = {
  0: '3',
  1: '4',
  2: '5',
  3: '6',
  4: '7',
  5: '8',
  6: '9',
  7: '10',
  8: 'J',
  9: 'Q',
  10: 'K',
  11: 'A',
  12: '2',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  selected = false,
  onClick,
  size = 'md',
  disabled = false,
  isFaceDown = false,
}) => {
  const isRed = card.suit === 2 || card.suit === 3;
  const rankStr = RANK_SYMBOLS[card.rank];
  const suitStr = SUIT_SYMBOLS[card.suit];

  const sizeClasses = {
    sm: 'w-8 h-12 text-[10px] sm:w-10 sm:h-14 sm:text-xs rounded',
    md: 'w-11 h-16 sm:w-16 sm:h-24 text-xs sm:text-base rounded-md sm:rounded-lg',
    lg: 'w-14 h-20 sm:w-20 sm:h-28 text-sm sm:text-lg rounded-lg sm:rounded-xl',
  }[size];

  if (isFaceDown) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-blue-900 to-indigo-950 border-2 border-amber-400/40 shadow-lg flex items-center justify-center cursor-default`}
      >
        <div className="w-4/5 h-4/5 border border-dashed border-amber-400/30 rounded flex items-center justify-center">
          <span className="text-amber-400 font-bold opacity-70">👑</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        ${sizeClasses}
        relative bg-white font-bold select-none transition-all duration-150 cursor-pointer shadow-md
        flex flex-col justify-between p-1 sm:p-1.5 touch-manipulation active:scale-95
        ${isRed ? 'text-red-600' : 'text-slate-900'}
        ${
          selected
            ? '-translate-y-4 sm:-translate-y-5 shadow-2xl ring-2 sm:ring-4 ring-amber-400 ring-offset-1 sm:ring-offset-2 ring-offset-slate-950'
            : 'sm:hover:-translate-y-1'
        }
        ${disabled ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      {/* Top Left */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-extrabold">{rankStr}</span>
        <span className="text-xs sm:text-sm">{suitStr}</span>
      </div>

      {/* Center Big Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
        <span className="text-2xl sm:text-4xl">{suitStr}</span>
      </div>

      {/* Bottom Right */}
      <div className="flex flex-col items-center leading-none self-end rotate-180">
        <span className="font-extrabold">{rankStr}</span>
        <span className="text-xs sm:text-sm">{suitStr}</span>
      </div>
    </div>
  );
};
