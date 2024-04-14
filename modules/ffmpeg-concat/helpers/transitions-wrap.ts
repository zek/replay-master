import Transitions from 'gl-transitions';

export type TransitionName =
  | 'Bounce'
  | 'BowTieHorizontal'
  | 'BowTieVertical'
  | 'ButterflyWaveScrawler'
  | 'CircleCrop'
  | 'ColourDistance'
  | 'CrazyParametricFun'
  | 'CrossZoom'
  | 'Directional'
  | 'DoomScreenTransition'
  | 'Dreamy'
  | 'DreamyZoom'
  | 'GlitchDisplace'
  | 'GlitchMemories'
  | 'GridFlip'
  | 'InvertedPageCurl'
  | 'LinearBlur'
  | 'Mosaic'
  | 'PolkaDotsCurtain'
  | 'Radial'
  | 'SimpleZoom'
  | 'StereoViewer'
  | 'Swirl'
  | 'WaterDrop'
  | 'ZoomInCircles'
  | 'angular'
  | 'burn'
  | 'cannabisleaf'
  | 'circle'
  | 'circleopen'
  | 'colorphase'
  | 'crosshatch'
  | 'crosswarp'
  | 'cube'
  | 'directionalwarp'
  | 'directionalwipe'
  | 'displacement'
  | 'doorway'
  | 'fade'
  | 'fadecolor'
  | 'fadegrayscale'
  | 'flyeye'
  | 'heart'
  | 'hexagonalize'
  | 'kaleidoscope'
  | 'luma'
  | 'luminance_melt'
  | 'morph'
  | 'multiply_blend'
  | 'perlin'
  | 'pinwheel'
  | 'pixelize'
  | 'polar_function'
  | 'randomsquares'
  | 'ripple'
  | 'rotate_scale_fade'
  | 'squareswire'
  | 'squeeze'
  | 'swap'
  | 'undulatingBurnOut'
  | 'wind'
  | 'windowblinds'
  | 'windowslice'
  | 'wipeDown'
  | 'wipeLeft'
  | 'wipeRight'
  | 'wipeUp';

export interface DefaultParams {
  count?: number;
  smoothness?: number;
  center?: [number, number];
  color?: [number, number, number];
  reflection?: number;
  perspective?: number;
  depth?: number;
  colorSeparation?: number;
  squares?: [number, number];
  direction?: [number, number];
  backColor?: [number, number, number, number];
  scale?: number;
  rotation?: number;
  size?: [number, number];
  amplitude?: number;
  speed?: number;
  seed?: number;
  squaresMin?: [number, number];
  strength?: number;
  l_threshold?: number;
  above?: number;
  angle?: number;
  power?: number;
  zoom?: number;
  unzoom?: number;
  floating?: number;
  persp?: number;
  [key: string]: unknown;
}

interface ParamsType {
  color?: string;
  colorPhase?: string;
}
export interface GLTransition {
  name: TransitionName;
  paramsType: ParamsType;
  defaultParams: DefaultParams;
  glsl: string;
  author: string;
  license: string;
  createdAt: string;
  updatedAt: string;
}

const transitions: GLTransition[] = Transitions;

export default transitions;
