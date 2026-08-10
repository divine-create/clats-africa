/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AgeGroup } from "../types";

interface KobeAvatarProps {
  size?: number;
  ageGroup?: AgeGroup;
  pulse?: boolean;
  style?: React.CSSProperties;
  className?: string;
  expression?: "happy" | "thinking" | "celebrating";
  character?: "kobe" | "chibi"; // Select which mascot is needed
}

export const KobeAvatar: React.FC<KobeAvatarProps> = ({
  size = 52,
  ageGroup = "young innovators",
  pulse = false,
  style = {},
  className = "",
  expression = "happy",
  character = "kobe" // Default is Kobe (the boy)
}) => {
  // Determine color scheme based on ageGroup metadata
  const colors = {
    "early explorers": {
      primary: "#F59E0B", // Amber
      accent: "#E89010",
      bg: "rgba(245, 158, 11, 0.12)"
    },
    "young innovators": {
      primary: "#2BBFBF", // Teal
      accent: "#1A9494",
      bg: "rgba(34, 211, 238, 0.12)"
    },
    "future builders": {
      primary: "#7C6FCD", // Soft Purple
      accent: "#5C4EBC",
      bg: "rgba(167, 139, 250, 0.12)"
    }
  };

  const scheme = colors[ageGroup] || colors["young innovators"];

  // Let's configure recursive fallback urls for maximum rendering safety
  const initialUrl = character === "kobe" 
    ? "/assets/input_file_0.png"  // Attachment index 0 (Boy)
    : "/assets/input_file_1.png"; // Attachment index 1 (Girl)

  const [imgSrc, setImgSrc] = useState<string>(initialUrl);
  const [retryStage, setRetryStage] = useState(0);

  // Sync state if character changes dynamically
  useEffect(() => {
    setImgSrc(character === "kobe" ? "/assets/input_file_0.png" : "/assets/input_file_1.png");
    setRetryStage(0);
  }, [character]);

  const handleImgError = () => {
    if (retryStage === 0) {
      // Fallback 1: Try serving from absolute root path directly
      setImgSrc(character === "kobe" ? "/input_file_0.png" : "/input_file_1.png");
      setRetryStage(1);
    } else if (retryStage === 1) {
      // Fallback 2: Try relative path inside the assets build directory 
      setImgSrc(character === "kobe" ? "./assets/input_file_0.png" : "./assets/input_file_1.png");
      setRetryStage(2);
    } else {
      // Fallback 3: Defer to high-fidelity SVG/emoji rendering
      setImgSrc("");
    }
  };

  const animationClass = pulse ? "animate-[pulse_1.5s_infinite]" : "";

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        userSelect: "none",
        flexShrink: 0,
        ...style
      }}
      className={`${animationClass} ${className}`}
    >
      {/* Outer Glow Halo Profile Circle */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: scheme.bg,
          border: `2px solid ${scheme.primary}`,
          zIndex: 1
        }}
      />

      {/* Profile Character Image or SVG Card */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          zIndex: 2
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={character === "kobe" ? "Kobe Mascot (Boy)" : "Chibi Mascot (Girl)"}
            onError={handleImgError}
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 22%",
              transform: character === "kobe" ? "scale(2.5)" : "scale(2.25)",
              transformOrigin: "center 22%",
              transition: "transform 0.2s"
            }}
          />
        ) : (
          /* High quality Vector / Emoji fallback matching character profiles */
          <div
            style={{
              fontSize: size * 0.48,
              lineHeight: 1,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            }}
          >
            {character === "kobe" ? "👦🏾" : "👧🏾"}
          </div>
        )}
      </div>

      {/* Decorative expression indicators */}
      {expression === "celebrating" && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            fontSize: 14,
            zIndex: 10
          }}
        >
          ✨
        </span>
      )}
      {expression === "thinking" && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            fontSize: 14,
            zIndex: 10
          }}
        >
          💭
        </span>
      )}

      {/* Pulse Beacon Aura (optional) */}
      {pulse && (
        <span
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: `2px solid ${scheme.primary}55`,
            zIndex: 0,
            pointerEvents: "none"
          }}
          className="animate-[ping_1.8s_ease-out_infinite]"
        />
      )}
    </div>
  );
};

export default KobeAvatar;
