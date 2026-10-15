import React from "react";
import { motion } from "motion/react";
import { PatternItem, TileInteractionState } from "../types";
import { sfx } from "../../../../utils/audio";

interface TactileTileProps {
  item: PatternItem;
  state?: TileInteractionState;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TactileTile: React.FC<TactileTileProps> = ({
  item,
  state = "idle",
  size = "md",
  onClick,
  draggable = false,
  onDragStart,
  disabled = false,
  showLabel = true,
  className = "",
  style = {}
}) => {
  const sizeClasses = {
    sm: "w-16 h-16 sm:w-18 sm:h-18 text-2xl",
    md: "w-20 h-20 sm:w-22 sm:h-22 text-3xl",
    lg: "w-24 h-24 sm:w-28 sm:h-28 text-4xl"
  }[size];

  const handleClick = () => {
    if (disabled) return;
    sfx.playTap();
    onClick?.();
  };

  const getBorderColor = () => {
    if (state === "correct") return "#10B981";
    if (state === "incorrect") return "#EF4444";
    if (state === "selected") return "#FACC15";
    return item.color || "#38BDF8";
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      draggable={draggable && !disabled}
      onDragStartCapture={(e: any) => onDragStart?.(e)}
      whileHover={!disabled ? { scale: 1.08, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.94 } : {}}
      disabled={disabled}
      className={`relative group rounded-3xl flex flex-col items-center justify-center transition-all select-none p-2 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-400 ${sizeClasses} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:shadow-sm"
      } ${className}`}
      style={{
        backgroundColor: "#1E293B",
        borderWidth: "3px",
        borderStyle: "solid",
        borderColor: getBorderColor(),
        boxShadow: state === "selected" 
          ? `0 0 20px ${item.color}B3, 0 8px 16px rgba(0,0,0,0.4)`
          : `0 8px 20px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.15)`,
        ...style
      }}
      aria-label={`${item.label} tile`}
    >
      {/* Soft inner glow ring */}
      <div 
        className="absolute inset-1 rounded-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: item.color }}
      />

      {/* Symbol / Emoji */}
      <span 
        className="drop-shadow-md transform transition-transform group-hover:scale-110 pointer-events-none"
        style={{ 
          fontSize: size === "sm" ? "1.6rem" : size === "lg" ? "2.6rem" : "2.1rem",
          transform: item.size === "lg" ? "scale(1.32)" : item.size === "sm" ? "scale(0.78)" : undefined
        }}
      >
        {item.symbol}
      </span>

      {/* Tactile Text Label */}
      {showLabel && (
        <span 
          className="text-[10px] sm:text-[11px] font-black text-slate-200 mt-1 truncate max-w-full px-1 tracking-tight pointer-events-none drop-shadow"
          style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
        >
          {item.label}
        </span>
      )}

      {/* Correct checkmark badge */}
      {state === "correct" && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md border-2 border-white"
        >
          ✓
        </motion.div>
      )}

      {/* Incorrect wobble badge */}
      {state === "incorrect" && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow-md border-2 border-white"
        >
          ✕
        </motion.div>
      )}
    </motion.button>
  );
};
