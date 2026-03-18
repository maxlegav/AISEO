import { Config } from "@remotion/cli/config";

// PNG intermediates = lossless frames (crisp gradients, text, transparency)
Config.setVideoImageFormat("png");

// CRF 1 = near-lossless H.264 (max quality, ~2-3x larger file vs default)
Config.setCrf(1);

// Always overwrite
Config.setOverwriteOutput(true);

// Use all available CPU cores
Config.setConcurrency("100%");
