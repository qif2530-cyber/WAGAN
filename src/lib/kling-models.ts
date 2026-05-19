export type KlingMode = 'std' | 'pro' | '4k' | 'none';
export type KlingTaskType = 'm2v' | 'i2v';

export interface KlingModelFeature {
  allowedDurations: number[]; // e.g. [5, 10]
  resolution: string; // e.g. '720p', '1080p', '4k'
  framerate: string; // e.g. '30fps', '24fps'
  firstLastFrame?: boolean;
  audioControl?: boolean;
  motionControl?: boolean;
  videoReference?: boolean;
}

export interface KlingModelConfig {
  id: string;
  name: string;
  supportedTaskTypes: KlingTaskType[];
  modes: {
    [key in KlingMode]?: KlingModelFeature;
  };
}

export const KLING_MODELS: Record<string, KlingModelConfig> = {
  'kling-v3': {
    id: 'kling-v3',
    name: '可灵 v3',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10, 15], resolution: '720p', framerate: '30fps', firstLastFrame: true, motionControl: true },
      'pro': { allowedDurations: [5, 10, 15], resolution: '1080p', framerate: '30fps', firstLastFrame: true, motionControl: true },
      '4k': { allowedDurations: [5, 10, 15], resolution: '4k', framerate: '30fps', firstLastFrame: true, motionControl: false },
    }
  },
  'kling-v3-omni': {
    id: 'kling-v3-omni',
    name: '可灵 v3 Omni',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10, 15], resolution: '720p', framerate: '30fps', firstLastFrame: true, videoReference: true },
      'pro': { allowedDurations: [5, 10, 15], resolution: '1080p', framerate: '30fps', firstLastFrame: true, videoReference: true },
      '4k': { allowedDurations: [5, 10, 15], resolution: '4k', framerate: '30fps', firstLastFrame: true, videoReference: false },
    }
  },
  'kling-video-o1': {
    id: 'kling-video-o1',
    name: '可灵 O1',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps', firstLastFrame: true, videoReference: true },
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '30fps', firstLastFrame: true, videoReference: true },
    }
  },
  'kling-v2-6': {
    id: 'kling-v2-6',
    name: '可灵 v2.6',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps' },
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '30fps', firstLastFrame: true, audioControl: true },
    }
  },
  'kling-v2-5-turbo': {
    id: 'kling-v2-5-turbo',
    name: '可灵 v2.5 Turbo',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps' },
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '30fps', firstLastFrame: true },
    }
  },
  'kling-v2-1-master': {
    id: 'kling-v2-1-master',
    name: '可灵 v2.1 Master',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'none': { allowedDurations: [5, 10], resolution: '1080p', framerate: '24fps' }
    }
  },
  'kling-v2-1': {
    id: 'kling-v2-1',
    name: '可灵 v2.1',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '24fps' },
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '24fps', firstLastFrame: true },
    }
  },
  'kling-v2-master': {
    id: 'kling-v2-master',
    name: '可灵 v2 Master',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'none': { allowedDurations: [5, 10], resolution: '720p', framerate: '24fps' }
    }
  },
  'kling-v1-6': {
    id: 'kling-v1-6',
    name: '可灵 v1.6',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '24fps' }, // 24fps for m2v, 30fps for i2v... let's unify to 30 or note it.
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '24fps', firstLastFrame: true },
    }
  },
  'kling-v1-5': {
    id: 'kling-v1-5',
    name: '可灵 v1.5',
    supportedTaskTypes: ['i2v'], // purely i2v based on table
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps' },
      'pro': { allowedDurations: [5, 10], resolution: '1080p', framerate: '30fps', firstLastFrame: true },
    }
  },
  'kling-v1': {
    id: 'kling-v1',
    name: '可灵 v1',
    supportedTaskTypes: ['m2v', 'i2v'],
    modes: {
      'std': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps', firstLastFrame: true },
      'pro': { allowedDurations: [5, 10], resolution: '720p', framerate: '30fps', firstLastFrame: true },
    }
  }
};
