/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { sfx } from "../utils/audio";
import { CLATSLogo } from "./CLATSLogo";

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Play transition sound on launch for interactive delight
    sfx.playLevelUp();

    // Increment progress bar to simulate authentic application boot flow
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // Soft auto-dismiss once boot sequence reaches 100% complete
  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        onDismiss();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onDismiss]);

  return (
    <div
      id="clats-splash-screen"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Premium subtle Turquoise to Soft Purple smooth gradient
        background: "linear-gradient(135deg, #19C6C6 0%, #7A6FF0 100%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "60px 24px",
        overflow: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* Dynamic Keyframe Injection for the Pulses & Progress Shimmers */}
      <style>{`
        @keyframes pulseLogo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(255,255,255,0.15)); }
          50% { transform: scale(1.02); filter: drop-shadow(0 12px 24px rgba(255,255,255,0.25)); }
        }
        .clats-pulsing-logo {
          animation: pulseLogo 4s ease-in-out infinite;
        }
      `}</style>

      {/* Top Spacer to keep layout balanced */}
      <div style={{ height: 20 }} />

      {/* Main Container - Perfectly Centered Brand Presentation */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: 420,
          flex: 1
        }}
      >
        {/* Prominent CLATS Logo with elegant glow */}
        <div 
          className="clats-pulsing-logo"
          style={{ 
            marginBottom: 24, 
            transition: "all 0.3s ease-in-out",
            background: "rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            padding: "16px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.18)"
          }}
        >
          <CLATSLogo height={88} />
        </div>

        {/* Dynamic App Title */}
        <h1
          style={{
            color: "#FFFFFF",
            fontFamily: "'Baloo 2', system-ui, sans-serif",
            fontSize: "44px",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 10px 0",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 8px rgba(0,0,0,0.06)"
          }}
        >
          CLATS
        </h1>

        {/* Rounded Modern Sub-brand Tagline */}
        <p
          style={{
            color: "rgba(255, 255, 255, 0.95)",
            fontFamily: "'Baloo 2', system-ui, sans-serif",
            fontSize: "17px",
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
            maxWidth: 290,
            letterSpacing: "0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.04)"
          }}
        >
          Building Tomorrow's Tech Minds Today!
        </p>
      </div>

      {/* Bottom Section - Clean Minimal Loading Progress Indicator */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14
        }}
      >
        {/* Loading Indicator Text */}
        <span
          style={{
            color: "rgba(255, 255, 255, 0.92)",
            fontFamily: "'Baloo 2', system-ui, sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}
        >
          Preparing Your Learning Adventure...
        </span>

        {/* Elegant Minimalist Progress Bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            background: "rgba(255, 255, 255, 0.22)",
            borderRadius: 100,
            overflow: "hidden",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#FFFFFF",
              borderRadius: 100,
              transition: "width 0.1s linear"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
