/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

interface CLATSLogoProps {
  height?: number | string;
  style?: React.CSSProperties;
  inline?: boolean;
}

export const CLATSLogo: React.FC<CLATSLogoProps> = ({ height = 44, style = {}, inline = false }) => {
  const [imgSrc, setImgSrc] = useState<string>("/logo-3.png");
  const handleImgError = () => {
    // If the primary logo fails to load, gracefully fallback to the native SVG markup
    setImgSrc("");
  };

  // If we fallback to native SVG markup
  if (!imgSrc) {
    // If height is a string like "1em", we can't easily compute raw SVG widths. We fallback to 100%.
    const isStringHeight = typeof height === "string";
    const numericHeight = isStringHeight ? 44 : (height as number);
    const ratio = 2.6;
    const width = Math.round(numericHeight * ratio);
    const fontSize = numericHeight * 0.72;
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

  // Calculate proportional width (approx 2.6:1 ratio for the logo image)
  const isStringHeight = typeof height === "string";
  const numericHeight = isStringHeight ? 44 : (height as number);
  const wrapperWidth = isStringHeight ? "auto" : Math.round(numericHeight * 2.6);

  return (
    <div
      style={{
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        justifyContent: "center",
        height: height,
        width: wrapperWidth,
        overflow: "visible",
        verticalAlign: inline ? "middle" : "baseline",
        margin: inline ? "0 0.2em" : 0,
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
