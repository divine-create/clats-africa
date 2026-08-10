import React, { useState, useEffect } from "react";
import { Child } from "../../types";
import { Shield, Zap, Heart, RefreshCw, HelpCircle, Play, Sparkles } from "lucide-react";

interface SmartCityBuilderProps {
  child: Child;
  isDark: boolean;
  onComplete: (xpAward: number) => void;
  onClose: () => void;
}

interface Building {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  trafficEffect: number;
  pollutionEffect: number;
  healthEffect: number;
  techEffect: number;
  description: string;
}

const BUILDINGS: Building[] = [
  {
    id: "traffic-light",
    name: "Smart Traffic Light",
    emoji: "🚦",
    cost: 2,
    trafficEffect: -25,
    pollutionEffect: -5,
    healthEffect: 0,
    techEffect: 10,
    description: "AI optimizes lights to make traffic flow faster.",
  },
  {
    id: "solar-farm",
    name: "AI Solar Array",
    emoji: "☀️",
    cost: 3,
    trafficEffect: 0,
    pollutionEffect: -25,
    healthEffect: 5,
    techEffect: 15,
    description: "Generates clean sun power, reducing dirty smoke.",
  },
  {
    id: "smart-hospital",
    name: "AI Smart Hospital",
    emoji: "🏥",
    cost: 4,
    trafficEffect: 0,
    pollutionEffect: 0,
    healthEffect: 30,
    techEffect: 20,
    description: "Speeds up treatments and patient doctor care.",
  },
  {
    id: "wifi-tower",
    name: "5G Internet Tower",
    emoji: "📡",
    cost: 2,
    trafficEffect: -5,
    pollutionEffect: 0,
    healthEffect: 0,
    techEffect: 30,
    description: "Boosts Wi-Fi speed and connects schools.",
  },
  {
    id: "smart-recycling",
    name: "Smart Sorting Bin",
    emoji: "♻️",
    cost: 1,
    trafficEffect: 0,
    pollutionEffect: -20,
    healthEffect: 10,
    techEffect: 5,
    description: "Sorts trash automatically to clean up the air.",
  },
  {
    id: "electric-bus",
    name: "Autonomous EV Bus",
    emoji: "🚌",
    cost: 3,
    trafficEffect: -20,
    pollutionEffect: -15,
    healthEffect: 5,
    techEffect: 10,
    description: "Self-driving clean bus. Clears roads and smoke.",
  }
];

export const SmartCityBuilder: React.FC<SmartCityBuilderProps> = ({
  isDark,
  onComplete,
  onClose,
}) => {
  const [budget, setBudget] = useState(10);
  const [grid, setGrid] = useState<(Building | null)[]>(Array(36).fill(null));
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Metrics (Start at bad levels, student needs to improve them)
  const [traffic, setTraffic] = useState(85); // Goal: <= 35
  const [pollution, setPollution] = useState(80); // Goal: <= 30
  const [health, setHealth] = useState(40); // Goal: >= 75
  const [tech, setTech] = useState(30); // Goal: >= 75

  // Calculate live scores based on grid items
  useEffect(() => {
    let tDelta = 0;
    let pDelta = 0;
    let hDelta = 0;
    let teDelta = 0;

    grid.forEach((b) => {
      if (b) {
        tDelta += b.trafficEffect;
        pDelta += b.pollutionEffect;
        hDelta += b.healthEffect;
        teDelta += b.techEffect;
      }
    });

    setTraffic(Math.max(10, Math.min(100, 85 + tDelta)));
    setPollution(Math.max(5, Math.min(100, 80 + pDelta)));
    setHealth(Math.max(10, Math.min(100, 40 + hDelta)));
    setTech(Math.max(10, Math.min(100, 30 + teDelta)));
  }, [grid]);

  const handleTileClick = (index: number) => {
    const currentBuilding = grid[index];

    // If removing an existing building
    if (currentBuilding) {
      const newGrid = [...grid];
      newGrid[index] = null;
      setGrid(newGrid);
      setBudget(prev => prev + currentBuilding.cost);
      return;
    }

    // Placing a building
    if (!selectedBuilding) return;

    if (budget < selectedBuilding.cost) {
      alert("Not enough budget coins!");
      return;
    }

    const newGrid = [...grid];
    newGrid[index] = selectedBuilding;
    setGrid(newGrid);
    setBudget(prev => prev - selectedBuilding.cost);
  };

  const handleReset = () => {
    setGrid(Array(36).fill(null));
    setBudget(10);
  };

  const isVictorious = traffic <= 35 && pollution <= 30 && health >= 75 && tech >= 75;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        background: isDark ? "#1e293b" : "#ffffff",
        border: "4px solid #2EC4B6",
        borderRadius: 28,
        padding: "20px 16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
        color: isDark ? "#fff" : "#1e293b",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .sc-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .sc-layout {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            gap: 20px;
          }
        }
        .sc-tile {
          aspect-ratio: 1/1;
          font-size: 20px;
          transition: all 0.1s ease;
        }
        @media (min-width: 480px) {
          .sc-tile {
            font-size: 28px;
          }
        }
        .sc-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }
        @media (min-width: 480px) {
          .sc-stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
        }
        .sc-inst-overlay {
          position: absolute;
          inset: 0;
          background: ${isDark ? "#1e293b" : "#ffffff"};
          border-radius: 24px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow-y: auto;
          box-sizing: border-box;
        }
      `}</style>

      {/* ── SIMPLE INSTRUCTIONS OVERLAY ─────────────────────────────────── */}
      {showInstructions && (
        <div className="sc-inst-overlay">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 32 }}>🏙️</span>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Fix the City!</h2>
              <span style={{ fontSize: 11, color: "#2EC4B6", fontWeight: 800 }}>AI City Builder Game</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, fontSize: 13, lineHeight: 1.5 }}>
            <p style={{ margin: 0, opacity: 0.95, fontWeight: 600 }}>
              Oh no! The city is unhappy because it has four big problems:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 10 }}>
              <div>🚗 <strong>Traffic:</strong> Roads are too crowded!</div>
              <div>💨 <strong>Dirty Air:</strong> There is too much pollution!</div>
              <div>🏥 <strong>Hospitals:</strong> Medical care is too slow!</div>
              <div>⚡ <strong>Internet:</strong> Wi-Fi is too weak!</div>
            </div>
            <p style={{ margin: 0, opacity: 0.95 }}>
              Use your <strong>10 gold coins</strong> 🪙 to place smart buildings and fix all 4 problems!
            </p>

            <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`, padding: 12, borderRadius: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <h4 style={{ margin: 0, fontWeight: 900, color: "#7A6FF0", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={14} /> Easy Steps:
              </h4>
              <div>1. Tap a building on the list (like 🚦 or 🏥).</div>
              <div>2. Tap an empty block on the map grid to build it.</div>
              <div>3. Tap a placed building to remove it and get your coin back.</div>
              <div>4. Turn all 4 checks green to win <strong>150 XP</strong>!</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setShowInstructions(false)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #7A6FF0 0%, #19C6C6 100%)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 6px 20px rgba(122,111,240,0.35)",
              }}
            >
              <Play size={16} /> Play Game!
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "14px 20px",
                borderRadius: 14,
                border: `1.5px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                background: "transparent",
                color: isDark ? "#cbd5e1" : "#475569",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Modal Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          background: isDark ? "rgba(255,255,255,0.05)" : "#cbd5e1",
          border: "none",
          borderRadius: "50%",
          width: 32,
          height: 32,
          color: isDark ? "#fff" : "#1e293b",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: "bold",
          zIndex: 10,
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>🏙️</span>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Fix the City!</h2>
          <span style={{ fontSize: 10, color: "#2EC4B6", fontWeight: 800 }}>
            Use AI to fix traffic, dirty air, hospitals, and internet!
          </span>
        </div>
      </div>

      <div className="sc-layout">
        {/* Main Grid View */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Simplified Stats Dashboard */}
          <div className="sc-stats-grid" style={{ background: isDark ? "rgba(0,0,0,0.2)" : "#f1f5f9", padding: 10, borderRadius: 16 }}>
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }} className="block">TRAFFIC</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: traffic > 35 ? "#ef4444" : "#10b981" }} className="block">
                🚗 {traffic}%
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }} className="block">DIRTY AIR</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: pollution > 30 ? "#ef4444" : "#10b981" }} className="block">
                💨 {pollution}%
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }} className="block">HOSPITALS</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: health < 75 ? "#ef4444" : "#10b981" }} className="block">
                🏥 {health}%
              </span>
            </div>
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }} className="block">INTERNET</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: tech < 75 ? "#ef4444" : "#10b981" }} className="block">
                ⚡ {tech}%
              </span>
            </div>
          </div>

          {/* 6x6 Map Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 3,
              aspectRatio: "1/1",
              background: isDark ? "#0f172a" : "#cbd5e1",
              padding: 4,
              borderRadius: 20,
              border: `2px solid ${isDark ? "#334155" : "#94a3b8"}`,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {grid.map((building, i) => (
              <button
                key={i}
                onClick={() => handleTileClick(i)}
                style={{
                  background: building
                    ? (isDark ? "#334155" : "#e2e8f0")
                    : (isDark ? "#1e293b" : "#f1f5f9"),
                  border: `1.5px dashed ${isDark ? "#475569" : "#cbd5e1"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  boxSizing: "border-box",
                }}
                className="sc-tile hover:scale-105 hover:bg-emerald-500/10"
                title={building ? `Click to remove ${building.name}` : "Click to place building"}
              >
                {building ? building.emoji : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Side Panel: Inventory & Goal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Budget and Instructions Help toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #7A6FF0 0%, #6366f1 100%)",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.8 }} className="block">GOLD COINS</span>
                <span style={{ fontSize: 18, fontWeight: 900 }} className="block">🪙 {budget}</span>
              </div>
              <button
                onClick={handleReset}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  cursor: "pointer",
                }}
                title="Reset Grid"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            <button
              onClick={() => setShowInstructions(true)}
              style={{
                padding: "8px 12px",
                borderRadius: 14,
                border: `1.5px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                background: isDark ? "#1e293b" : "#fff",
                color: isDark ? "#cbd5e1" : "#475569",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Show Instructions"
            >
              <HelpCircle size={18} />
            </button>
          </div>

          {/* Goal Targets Checklist */}
          <div
            style={{
              background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              padding: 10,
              borderRadius: 14,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: "#7A6FF0" }} className="block mb-1.5">🎯 GOALS TO WIN:</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: traffic <= 35 ? "#10b981" : "" }}>
                <span>{traffic <= 35 ? "✅" : "❌"}</span>
                <span>Traffic 🚗: 35% or less</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: pollution <= 30 ? "#10b981" : "" }}>
                <span>{pollution <= 30 ? "✅" : "❌"}</span>
                <span>Dirty Air 💨: 30% or less</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: health >= 75 ? "#10b981" : "" }}>
                <span>{health >= 75 ? "✅" : "❌"}</span>
                <span>Hospitals 🏥: 75% or more</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: tech >= 75 ? "#10b981" : "" }}>
                <span>{tech >= 75 ? "✅" : "❌"}</span>
                <span>Internet ⚡: 75% or more</span>
              </div>
            </div>
          </div>

          {/* Buildings Inventory */}
          <div
            style={{
              overflowY: "auto",
              maxHeight: 180,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              paddingRight: 2,
            }}
          >
            {BUILDINGS.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBuilding(b)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 10,
                  border: `2px solid ${selectedBuilding?.id === b.id ? "#2EC4B6" : (isDark ? "#334155" : "#e2e8f0")}`,
                  background: selectedBuilding?.id === b.id
                    ? (isDark ? "rgba(46,196,182,0.15)" : "rgba(46,196,182,0.1)")
                    : (isDark ? "#1e293b" : "#fff"),
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 20 }}>{b.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 900 }} className="truncate">{b.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b" }}>🪙{b.cost}</span>
                  </div>
                  <span style={{ fontSize: 8.5, opacity: 0.6 }} className="block truncate">{b.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Banner - Win State */}
      {isVictorious ? (
        <div
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff",
            padding: 12,
            borderRadius: 20,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.4)",
          }}
        >
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>🎉 City Fixed!</h3>
            <p style={{ fontSize: 10, margin: 0, opacity: 0.9 }}>
              Excellent job! You built a clean, smart, and connected city using AI.
            </p>
          </div>
          <button
            onClick={() => onComplete(150)}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "none",
              background: "#fff",
              color: "#059669",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            className="hover:scale-105 transition"
          >
            Claim 150 XP 🚀
          </button>
        </div>
      ) : (
        <div
          style={{
            background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
            padding: 8,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            opacity: 0.8,
            lineHeight: 1.3,
          }}
        >
          <span>
            💡 <strong>Tip:</strong> Pick a building on the list, then tap a block on the grid to build it. Tap a building to remove it. Turn all checks green to win!
          </span>
        </div>
      )}
    </div>
  );
};
