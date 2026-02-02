import * as Blockly from 'blockly';

export const OnyxTheme = Blockly.Theme.defineTheme('onyx', {
    name: 'onyx',
    base: Blockly.Themes.Classic,
    componentStyles: {
        workspaceBackgroundColour: '#F6F7FB', // User: #F6F7FB
        toolboxBackgroundColour: '#FFFFFF',   // User: Surface
        toolboxForegroundColour: '#1F2937',   // User: Text
        flyoutBackgroundColour: '#FFFFFF',
        flyoutForegroundColour: '#1F2937',
        flyoutOpacity: 1,
        scrollbarColour: '#E5E7EB',           // User: Border
        insertionMarkerColour: '#22C55E',     // User: Drop target highlight (base color)
        insertionMarkerOpacity: 0.3,
        scrollbarOpacity: 0.4,
        cursorColour: '#2563EB',              // User: Selected glow base
    },
    blockStyles: {
        "control-style": {
            colourPrimary: "#3B82F6",
            colourSecondary: "#2563EB",
            colourTertiary: "#1D4ED8"
        },
        "hardware-style": {
            colourPrimary: "#10B981",
            colourSecondary: "#059669",
            colourTertiary: "#047857"
        },
        "speech-style": {
            colourPrimary: "#06B6D4",
            colourSecondary: "#0891B2",
            colourTertiary: "#0E7490"
        },
        "sound-style": {
            colourPrimary: "#D946EF",
            colourSecondary: "#C026D3",
            colourTertiary: "#A21CAF"
        },
        "logic_blocks": {
            colourPrimary: "#F59E0B",
            colourSecondary: "#D97706",
            colourTertiary: "#B45309"
        },
        "loop_blocks": {
            colourPrimary: "#8B5CF6",
            colourSecondary: "#7C3AED",
            colourTertiary: "#6D28D9"
        },
        "math_blocks": {
            colourPrimary: "#F43F5E",
            colourSecondary: "#E11D48",
            colourTertiary: "#BE123C"
        },
        "text_blocks": {
            colourPrimary: "#F97316",
            colourSecondary: "#EA580C",
            colourTertiary: "#C2410C"
        },
        "list_blocks": {
            colourPrimary: "#6366F1", // Indigo-500
            colourSecondary: "#4F46E5",
            colourTertiary: "#4338CA"
        },
        "variable_blocks": {
            colourPrimary: "#F43F5E", // Rose-500
            colourSecondary: "#E11D48",
            colourTertiary: "#BE123C"
        },
        "procedure_blocks": {
            colourPrimary: "#A78BFA", // Map to Loops/Purple
            colourSecondary: "#8B5CF6",
            colourTertiary: "#7C3AED"
        }
    },
    categoryStyles: {
        "control-category": { colour: "#3B82F6" },
        "hardware-category": { colour: "#10B981" },
        "speech-category": { colour: "#06B6D4" },
        "sound-category": { colour: "#D946EF" },
        "logic-category": { colour: "#F59E0B" },
        "loops-category": { colour: "#8B5CF6" },
        "math-category": { colour: "#F43F5E" },
        "text-category": { colour: "#F97316" },
        "list-category": { colour: "#6366F1" },
        "variable-category": { colour: "#F43F5E" },
        "function-category": { colour: "#8B5CF6" } // Map to Loops
    }
});
