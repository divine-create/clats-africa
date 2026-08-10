/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

interface CLATSLogoProps {
  height?: number;
  style?: React.CSSProperties;
}

export const CLATSLogo: React.FC<CLATSLogoProps> = ({ height = 44, style = {} }) => {
  const [imgSrc, setImgSrc] = useState<string>("/assets/input_file_3.png");
  const [retryStage, setRetryStage] = useState(0);

  const handleImgError = () => {
    if (retryStage === 0) {
      // Fallback 1: absolute path of container
      setImgSrc("/input_file_3.png");
      setRetryStage(1);
    } else if (retryStage === 1) {
      // Fallback 2: relative assets path
      setImgSrc("./assets/input_file_3.png");
      setRetryStage(2);
    } else {
      // Fallback 3: native SVG fallback
      setImgSrc("");
    }
  };

  // If we fallback to native SVG markup
  if (!imgSrc) {
    const ratio = 2.6;
    const width = Math.round(height * ratio);
    const fontSize = height * 0.72;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "inline-block", ...style }}
      >
        <defs>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        {[
          "C",
          "L",
          "A",
          "T",
          "S",
        ].map((letter, i) => {
          const x = width * 0.08 + i * (width * 0.185);
          return (
            <g key={letter + i}>
              <text
                x={x}
                y={height * 0.78}
                fontFamily="'Space Grotesk', system-ui, sans-serif"
                fontStyle="italic"
                fontSize={fontSize}
                fontWeight="900"
                fill="url(#tealGrad)"
                stroke="#22d3ee"
                strokeWidth="0.5"
              >
                {letter}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Calculate proportional width (approx 2:1 ratio for the logo image)
  const width = Math.round(height * 2.0);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: height,
        width: width,
        overflow: "hidden",
        ...style,
      }}
    >
      <img
        src={imgSrc}
        alt="CLATS Logo"
        onError={handleImgError}
        referrerPolicy="no-referrer"
        style={{
          height: "100%",
          width: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
};

export default CLATSLogo;
