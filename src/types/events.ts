export interface BlocklyCodeEventDetail {
  code: string;
}

export interface BlocklyRunEventDetail {
  // Empty for now, but good to have interface
}

export interface BlocklyStageSoundEventDetail {
  action: "beep" | "tone";
  value?: {
    freq: number;
    dur: number;
  };
}

export type MotionValue = number | { val: number; dur: number } | { x: number; y: number };

export interface BlocklyStageMotionEventDetail {
  type: "MOTION_MOVE" | "MOTION_TURN" | "MOTION_GOTO";
  value: MotionValue;
}

export interface BlocklyStageLookEventDetail {
  action: "say";
  value: {
    text: string;
    duration: number;
  };
}

// Custom Event Types
export type BlocklyCodeEvent = CustomEvent<BlocklyCodeEventDetail>;
export type BlocklyRunEvent = CustomEvent<BlocklyRunEventDetail>;
export type BlocklyStageSoundEvent = CustomEvent<BlocklyStageSoundEventDetail>;
export type BlocklyStageMotionEvent = CustomEvent<BlocklyStageMotionEventDetail>;
export type BlocklyStageLookEvent = CustomEvent<BlocklyStageLookEventDetail>;

declare global {
  interface WindowEventMap {
    "blockly:code": BlocklyCodeEvent;
    "blockly:run": BlocklyRunEvent;
    "blockly:stage_sound": BlocklyStageSoundEvent;
    "blockly:stage_motion": BlocklyStageMotionEvent;
    "blockly:stage_look": BlocklyStageLookEvent;
  }
}
