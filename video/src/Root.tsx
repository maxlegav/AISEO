import { Composition } from "remotion";
import { SYBVideo } from "./SYBVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SYBVideo"
      component={SYBVideo}
      durationInFrames={750} // 25 seconds @ 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
