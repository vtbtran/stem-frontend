export interface BlocklyCodeEventDetail {
  code: string;
}

export interface BlocklyWorkspaceEventDetail {
  workspace: unknown;
}

export interface BlocklyWorkspaceLoadEventDetail {
  workspace: unknown;
  skipPreview?: boolean; // If true, load immediately without preview
}

export interface BlocklyAddBlockEventDetail {
  type: string;
}

export interface BlocklyWorkspacePreviewEventDetail {
  workspace: unknown;
  source: string; // "ai-generate" | "ai-fix" | "ai-explain-fix"
  onAccept: () => void;
  onReject: () => void;
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
export type BlocklyWorkspaceEvent = CustomEvent<BlocklyWorkspaceEventDetail>;
export type BlocklyWorkspaceLoadEvent = CustomEvent<BlocklyWorkspaceLoadEventDetail>;
export type BlocklyWorkspacePreviewEvent = CustomEvent<BlocklyWorkspacePreviewEventDetail>;
export type BlocklyAddBlockEvent = CustomEvent<BlocklyAddBlockEventDetail>;
export type BlocklyRunEvent = CustomEvent<BlocklyRunEventDetail>;
export type BlocklyStageSoundEvent = CustomEvent<BlocklyStageSoundEventDetail>;
export type BlocklyStageMotionEvent = CustomEvent<BlocklyStageMotionEventDetail>;
export type BlocklyStageLookEvent = CustomEvent<BlocklyStageLookEventDetail>;

declare global {
  interface WindowEventMap {
    "blockly:code": BlocklyCodeEvent;
    "blockly:workspace": BlocklyWorkspaceEvent;
    "blockly:workspace_load": BlocklyWorkspaceLoadEvent;
    "blockly:workspace_preview": BlocklyWorkspacePreviewEvent;
    "blockly:add_block": BlocklyAddBlockEvent;
    "blockly:run": BlocklyRunEvent;
    "blockly:stage_sound": BlocklyStageSoundEvent;
    "blockly:stage_motion": BlocklyStageMotionEvent;
    "blockly:stage_look": BlocklyStageLookEvent;
  }
}
