/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, createContext, useContext } from "react";
import { C, F, getLevel, getNextLevel } from "../utils/config";
import { sfx } from "../utils/audio";

export const FontOffsetContext = createContext<number>(0);

// --- TEXT BLOCK ---
interface TxtProps {
  children: React.ReactNode;
  size?: number;
  weight?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}
export const Txt: React.FC<TxtProps> = ({
  children,
  size = 14,
  weight = 500,
  color,
  style = {},
  className = ""
}) => {
  const fontOffset = useContext(FontOffsetContext) || 0;
  return (
    <span
      className={className}
      style={{
        fontFamily: F.body,
        fontSize: size + fontOffset,
        fontWeight: weight,
        color: color || "var(--text-primary-sensitive, #1e293b)",
        lineHeight: 1.6,
        ...style
      }}
    >
      {children}
    </span>
  );
};

// --- DISPLAY HEADLINE ---
interface HeadingProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}
export const Heading: React.FC<HeadingProps> = ({
  children,
  size = 22,
  color,
  style = {},
  className = ""
}) => {
  const fontOffset = useContext(FontOffsetContext) || 0;
  const isDisplay = size >= 24;
  return (
    <h2
      className={className}
      style={{
        fontFamily: F.display,
        fontSize: size + fontOffset,
        fontWeight: isDisplay ? 900 : 700,
        letterSpacing: isDisplay ? "-0.04em" : "-0.02em",
        textTransform: isDisplay ? "uppercase" : "none",
        fontStyle: isDisplay ? "italic" : "normal",
        color: color || "var(--text-title-sensitive, #0f172a)",
        margin: 0,
        lineHeight: 1.15,
        ...style
      }}
    >
      {children}
    </h2>
  );
};

// --- ALL-CAPS ACCESSORY LABEL ---
export const Label: React.FC<TxtProps> = ({
  children,
  color,
  style = {},
  className = ""
}) => {
  return (
    <span
      className={className}
      style={{
        fontFamily: F.mono,
        fontSize: 11,
        fontWeight: 700,
        color: color || "var(--text-primary-sensitive, #94A3B8)",
        letterSpacing: 2,
        textTransform: "uppercase",
        display: "block",
        ...style
      }}
    >
      {children}
    </span>
  );
};

// --- CHIP PILL ---
interface ChipProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  style?: React.CSSProperties;
}
export const Chip: React.FC<ChipProps> = ({
  children,
  color = C.teal,
  bg,
  style = {}
}) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: bg || color + "1a",
        border: "1px solid " + color + "33",
        borderRadius: 8,
        padding: "4px 10px",
        fontFamily: F.mono,
        fontSize: 10,
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        ...style
      }}
    >
      {children}
    </span>
  );
};

// --- ACTION BUTTON ---
interface BtnProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "yellow" | "outline" | "ghost" | "danger" | "dark";
  full?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  style?: React.CSSProperties;
}
export const Btn: React.FC<BtnProps> = ({
  children,
  onClick,
  variant = "primary",
  full = false,
  size = "md",
  disabled = false,
  style = {}
}) => {
  const pv = size === "sm" ? "8px" : size === "lg" ? "14px" : "11px";
  const ph = size === "sm" ? "16px" : size === "lg" ? "28px" : "20px";
  const fs = size === "sm" ? 11 : size === "lg" ? 14 : 12.5;

  const V = {
    primary: {
      background: "linear-gradient(135deg," + C.teal + "," + C.tealDark + ")",
      color: "#0A0A0B",
      border: "none",
      boxShadow: "0 0 16px rgba(34, 211, 238, 0.25)"
    },
    yellow: {
      background: "linear-gradient(135deg," + C.yellow + "," + C.yellowDark + ")",
      color: "#0A0A0B",
      border: "none",
      boxShadow: "0 0 16px rgba(250, 204, 21, 0.25)"
    },
    outline: {
      background: "transparent",
      color: C.teal,
      border: "1.5px solid " + C.teal,
      boxShadow: "none"
    },
    ghost: {
      background: "rgba(255, 255, 255, 0.05)",
      color: C.slate,
      border: "1px solid " + C.mist,
      boxShadow: "none"
    },
    danger: {
      background: C.red,
      color: "#FFFFFF",
      border: "none",
      boxShadow: "0 4px 12px " + C.red + "33"
    },
    dark: {
      background: "#16161A",
      color: "#FFFFFF",
      border: "1px solid " + C.mist,
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
    }
  };

  const v = V[variant] || V.primary;

  return (
    <button
      onClick={disabled ? undefined : () => {
        sfx.playTap();
        onClick();
      }}
      disabled={disabled}
      style={{
        ...v,
        padding: pv + " " + ph,
        borderRadius: size === "lg" ? 14 : 11,
        fontFamily: F.display,
        fontSize: fs,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        width: full ? "100%" : "auto",
        transition: "all 0.15s ease-in-out",
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "scale(1.03)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = "";
        }
      }}
    >
      {children}
    </button>
  );
};

// --- INTERACTIVE CARD WRAPPER ---
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  pad?: number;
  className?: string;
  id?: string;
}
export const Card: React.FC<CardProps> = ({ children, style = {}, onClick, pad = 20, className = "", id }) => {
  const isPlayful = className.includes("playful");
  return (
    <div
      id={id}
      onClick={onClick}
      className={className}
      style={{
        background: isPlayful ? "#ffffff" : "var(--card-bg, #111114)",
        borderRadius: isPlayful ? 20 : 24,
        padding: pad,
        border: isPlayful ? undefined : "2.5px solid var(--card-border, rgba(255, 255, 255, 0.08))",
        boxShadow: isPlayful ? undefined : "var(--card-shadow, 0 8px 32px rgba(0, 0, 0, 0.4))",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-3px)";
          if (!isPlayful) {
            e.currentTarget.style.borderColor = "#2EC4B6";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(46, 196, 182, 0.25)";
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        if (!isPlayful) {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.boxShadow = "";
        }
      }}
    >
      {children}
    </div>
  );
};

// --- FLOATING OUTLINE INPUT ---
interface FieldInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  theme?: "light" | "dark";
}
export const FieldInput: React.FC<FieldInputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  error = "",
  hint = "",
  theme = "dark"
}) => {
  const [focus, setFocus] = useState(false);
  const isDark = theme !== "light";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label && <Label style={{ color: isDark ? C.stone : "#475569" }}>{label}</Label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          fontFamily: F.body,
          fontSize: 14,
          fontWeight: 500,
          color: isDark ? "#FFFFFF" : "#1E293B",
          background: isDark ? "rgba(0,0,0,0.4)" : "#F8FAFC",
          border: "2px solid " + (error ? C.red : focus ? "#19C6C6" : (isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0")),
          borderRadius: 12,
          padding: "11px 14px",
          outline: "none",
          transition: "all 0.2s ease-in-out",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: focus ? (isDark ? "0 0 12px rgba(25, 198, 198, 0.2)" : "0 0 12px rgba(25, 198, 198, 0.15)") : "none"
        }}
      />
      {hint && !error && (
        <Txt size={11} color={C.stone}>
          {hint}
        </Txt>
      )}
      {error && (
        <Txt size={12} color={C.red}>
          {error}
        </Txt>
      )}
    </div>
  );
};

// --- CIRCULAR PROGRESS RING ---
interface ProgressRingProps {
  pct?: number;
  size?: number;
  stroke?: number;
  color?: string;
}
export const ProgressRing: React.FC<ProgressRingProps> = ({
  pct = 0,
  size = 90,
  stroke = 7,
  color = C.teal
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${(circ * pct) / 100} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
    </svg>
  );
};

// --- DYNAMIC XP METER BAR ---
interface XPBarProps {
  xp: number;
  color?: string;
  trackBg?: string;
  xpColor?: string;
}
export const XPBar: React.FC<XPBarProps> = ({ xp, color = C.teal, trackBg = "rgba(15, 23, 42, 0.08)", xpColor = C.stone }) => {
  const cur = getLevel(xp);
  const next = getNextLevel(xp);
  const pct = next ? Math.round(((xp - cur.xpNeeded) / (next.xpNeeded - cur.xpNeeded)) * 100) : 100;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Txt size={11} weight={700} color={color}>
          Lv {cur.level} · {cur.label}
        </Txt>
        <Txt size={11} color={xpColor}>
          {xp} XP{next ? ` / ${next.xpNeeded}` : ""}
        </Txt>
      </div>
      <div style={{ height: 6, background: trackBg, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: pct + "%",
            background: "linear-gradient(90deg," + color + "," + color + "CC)",
            borderRadius: 4,
            transition: "width 0.8s ease"
          }}
        />
      </div>
    </div>
  );
};

// --- STAR RATING ---
interface StarRatingProps {
  count?: number;
  max?: number;
  color?: string;
}
export const StarRating: React.FC<StarRatingProps> = ({ count = 0, max = 3, color = C.yellow }) => {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 16, color: i < count ? color : "rgba(255,255,255,0.15)", transition: "color 0.3s" }}>
          ★
        </span>
      ))}
    </div>
  );
};

// --- PARENT PRESET TOGGLE ---
interface ToggleProps {
  on: boolean;
  onToggle: () => void;
}
export const Toggle: React.FC<ToggleProps> = ({ on, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? C.teal : "rgba(255,255,255,0.1)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.25s",
        flexShrink: 0
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 22 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)"
        }}
      />
    </div>
  );
};

// --- HORIZONTAL USAGE TRACK ---
interface SlotBarProps {
  label: string;
  used: number;
  limit: number;
  color: string;
  textColor?: string;
  trackBg?: string;
}
export const SlotBar: React.FC<SlotBarProps> = ({ label, used, limit, color, textColor = C.charcoal, trackBg = C.mist }) => {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <Txt size={13} weight={600} color={textColor} style={{ textTransform: "capitalize" }}>
          {label}
        </Txt>
        <Txt size={13} color={used >= limit && limit > 0 ? C.green : C.stone}>
          {fmt(used)} / {fmt(limit)}
        </Txt>
      </div>
      <div style={{ height: 5, background: trackBg, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: pct + "%",
            background: used >= limit && limit > 0 ? C.green : color,
            borderRadius: 4,
            transition: "width 0.6s"
          }}
        />
      </div>
    </div>
  );
};

export const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
};
