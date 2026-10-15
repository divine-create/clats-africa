import React from "react";
import { WonderWoodsEngine, WonderWoodsEngineProps } from "./wonder-woods/WonderWoodsEngine";

export type WonderWoodsProps = WonderWoodsEngineProps;

export default function WonderWoods(props: WonderWoodsProps) {
  return <WonderWoodsEngine {...props} />;
}
