import React from "react";
import { Composition } from "remotion";
import { SYBVideo } from "./SYBVideo";
import { SYBVideo_Neon } from "./SYBVideo_Neon";
import { SYBVideo_TextReveal } from "./SYBVideo_TextReveal";
import { SYBVideo_GEO } from "./SYBVideo_GEO";
import { SYBVideo_GEO2 } from "./SYBVideo_GEO2";
import { SYBVideo_Cinematic } from "./SYBVideo_Cinematic";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SYBVideo"
        component={SYBVideo}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Portrait 9:16 — 7 scenes, 36 s, always pastel BG */}
      <Composition
        id="SYBVideo-Neon"
        component={SYBVideo_Neon}
        durationInFrames={1080}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Landscape 16:9 — 5 acts, 60 s, documentary brand film */}
      <Composition
        id="SYBVideo-TextReveal"
        component={SYBVideo_TextReveal}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 4K 16:9 — 5 scenes, 25 s, 60 fps, dark/electric aesthetic */}
      <Composition
        id="SYBVideo-GEO"
        component={SYBVideo_GEO}
        durationInFrames={1500}
        fps={60}
        width={3840}
        height={2160}
      />
      {/* Square 1:1 — 5 scenes, 20 s, 30 fps, LinkedIn/Instagram results-led */}
      <Composition
        id="SYBVideo-GEO2"
        component={SYBVideo_GEO2}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* 16:9 — 4 acts, 18 s, 30 fps, cinematic brand ad */}
      <Composition
        id="SYBVideo-Cinematic"
        component={SYBVideo_Cinematic}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
