import * as Blockly from 'blockly';

// Extend CategoryInfo to include cssConfig via intersection
export type CustomCategory = {
  kind: 'category';
  name: string;
  contents?: Blockly.utils.toolbox.ToolboxItemInfo[];
  custom?: string;
  categorystyle?: string;
  imageUrl?: string;
  cssConfig?: {
    row?: string;
    icon?: string;
    [key: string]: string | undefined;
  };
  hidden?: string;
  colour?: string;
  expanded?: string | boolean;
};

// Union of our custom category and standard items
export type CustomToolboxItem = CustomCategory | Blockly.utils.toolbox.ToolboxItemInfo;

// Custom Toolbox Definition
interface CustomToolboxDefinition {
  kind: string;
  contents: CustomToolboxItem[];
}

export const TOOLBOX_CONFIG: CustomToolboxDefinition = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Điều khiển",
      categorystyle: "control-category",
      imageUrl: "/icons/mixer.png",
      cssConfig: {
        icon: "category-control"
      },
      contents: [
        { kind: "block", type: "event_start" },
        { kind: "block", type: "control_forever" },
        { kind: "block", type: "control_stop" },
        { kind: "block", type: "control_wait" },
        { kind: "sep", gap: 32 },
        {
          kind: "block",
          type: "motion_move_forward",
          fields: { SPEED: 150, SECS: 1 }
        },
        {
          kind: "block",
          type: "motion_move_backward",
          fields: { SPEED: 150, SECS: 1 }
        },
        {
          kind: "block",
          type: "motion_turn_left",
          fields: { SPEED: 150, SECS: 0.5 }
        },
        {
          kind: "block",
          type: "motion_turn_right",
          fields: { SPEED: 150, SECS: 0.5 }
        }
      ]
    },
    {
      kind: "category",
      name: "Phần cứng",
      categorystyle: "hardware-category",
      imageUrl: "/icons/desk-lamp.png",
      cssConfig: {
        icon: "category-hardware"
      },
      contents: [
        { kind: "block", type: "hardware_led" },
        { kind: "block", type: "hardware_servo" }
      ]
    },
    {
      kind: "category",
      name: "Thoại",
      categorystyle: "speech-category",
      imageUrl: "/icons/conversation.png",
      cssConfig: {
        icon: "category-speech"
      },
      contents: [
        { kind: "block", type: "looks_say" }
      ]
    },
    {
      kind: "category",
      name: "Âm thanh",
      categorystyle: "sound-category",
      imageUrl: "/icons/speaker-filled-audio-tool.png",
      cssConfig: {
        icon: "category-sound"
      },
      contents: [
        { kind: "block", type: "sound_beep" },
        { kind: "block", type: "sound_tone" }
      ]
    },
    { kind: "sep" },
    {
      kind: "category",
      name: "Logic",
      categorystyle: "logic-category",
      imageUrl: "/icons/skill-development.png",
      cssConfig: {
        icon: "category-logic"
      },
      contents: [
        { kind: "block", type: "controls_if" },
        { kind: "block", type: "logic_compare" },
        { kind: "block", type: "logic_operation" },
        { kind: "block", type: "logic_negate" },
        { kind: "block", type: "logic_boolean" },
        { kind: "block", type: "logic_null" },
        { kind: "block", type: "logic_ternary" }
      ]
    },
    {
      kind: "category",
      name: "Vòng lặp",
      categorystyle: "loops-category",
      imageUrl: "/icons/refresh.png",
      cssConfig: {
        icon: "category-loops"
      },
      contents: [
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 }
              }
            }
          }
        },
        { kind: "block", type: "controls_whileUntil" },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            TO: { shadow: { type: "math_number", fields: { NUM: 3 } } },
            BY: { shadow: { type: "math_number", fields: { NUM: 1 } } }
          }
        },
        { kind: "block", type: "controls_forEach" },
        { kind: "block", type: "controls_flow_statements" },
        // Pre-assembled Loop with Break
        {
          kind: "block",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: { NUM: 10 }
              }
            },
            DO: {
              block: {
                type: "controls_flow_statements",
                fields: { FLOW: "BREAK" }
              }
            }
          }
        }
      ]
    },
    {
      kind: "category",
      name: "Toán học",
      categorystyle: "math-category",
      imageUrl: "/icons/math-symbols.png",
      cssConfig: {
        icon: "category-math"
      },
      contents: [
        {
          kind: "block",
          type: "math_number",
          fields: { NUM: 123 }
        },
        {
          kind: "block",
          type: "math_arithmetic",
          inputs: {
            A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            B: { shadow: { type: "math_number", fields: { NUM: 1 } } }
          }
        },
        {
          kind: "block",
          type: "math_single",
          inputs: {
            NUM: { shadow: { type: "math_number", fields: { NUM: 9 } } }
          }
        },
        {
          kind: "block",
          type: "math_trig",
          inputs: {
            NUM: { shadow: { type: "math_number", fields: { NUM: 45 } } }
          }
        },
        { kind: "block", type: "math_constant" },
        {
          kind: "block",
          type: "math_number_property",
          inputs: {
            NUMBER_TO_CHECK: { shadow: { type: "math_number", fields: { NUM: 0 } } }
          }
        },
        {
          kind: "block",
          type: "math_round",
          inputs: {
            NUM: { shadow: { type: "math_number", fields: { NUM: 3.1 } } }
          }
        },
        { kind: "block", type: "math_on_list" },
        {
          kind: "block",
          type: "math_modulo",
          inputs: {
            DIVIDEND: { shadow: { type: "math_number", fields: { NUM: 64 } } },
            DIVISOR: { shadow: { type: "math_number", fields: { NUM: 10 } } }
          }
        },
        {
          kind: "block",
          type: "math_constrain",
          inputs: {
            VALUE: { shadow: { type: "math_number", fields: { NUM: 50 } } },
            LOW: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            HIGH: { shadow: { type: "math_number", fields: { NUM: 100 } } }
          }
        },
        {
          kind: "block",
          type: "math_random_int",
          inputs: {
            FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            TO: { shadow: { type: "math_number", fields: { NUM: 100 } } }
          }
        },
        { kind: "block", type: "math_random_float" }
      ]
    },
    {
      kind: "category",
      name: "Văn bản",
      categorystyle: "text-category",
      imageUrl: "/icons/document.png",
      cssConfig: {
        icon: "category-text"
      },
      contents: [
        { kind: "block", type: "text" },
        { kind: "block", type: "text_join" },
        {
          kind: "block",
          type: "text_append",
          inputs: {
            TEXT: { shadow: { type: "text" } }
          }
        },
        {
          kind: "block",
          type: "text_length",
          inputs: {
            VALUE: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        },
        {
          kind: "block",
          type: "text_isEmpty",
          inputs: {
            VALUE: { shadow: { type: "text", fields: { TEXT: "" } } }
          }
        },
        {
          kind: "block",
          type: "text_indexOf",
          inputs: {
            VALUE: { block: { type: "variables_get", fields: { VAR: "text" } } },
            FIND: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        },
        {
          kind: "block",
          type: "text_charAt",
          inputs: {
            VALUE: { block: { type: "variables_get", fields: { VAR: "text" } } }
          }
        },
        {
          kind: "block",
          type: "text_getSubstring",
          inputs: {
            STRING: { block: { type: "variables_get", fields: { VAR: "text" } } }
          }
        },
        {
          kind: "block",
          type: "text_changeCase",
          inputs: {
            TEXT: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        },
        {
          kind: "block",
          type: "text_trim",
          inputs: {
            TEXT: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        },
        {
          kind: "block",
          type: "text_print",
          inputs: {
            TEXT: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        },
        {
          kind: "block",
          type: "text_prompt_ext",
          inputs: {
            TEXT: { shadow: { type: "text", fields: { TEXT: "abc" } } }
          }
        }
      ]
    },
    {
      kind: "category",
      name: "Danh sách",
      categorystyle: "list-category",
      imageUrl: "/icons/list.png",
      cssConfig: {
        icon: "category-lists"
      },
      contents: [
        {
          kind: "block",
          type: "lists_create_with",
          extraState: { itemCount: 0 }
        },
        { kind: "block", type: "lists_create_with" },
        {
          kind: "block",
          type: "lists_repeat",
          inputs: {
            NUM: { shadow: { type: "math_number", fields: { NUM: 5 } } }
          }
        },
        { kind: "block", type: "lists_length" },
        { kind: "block", type: "lists_isEmpty" },
        {
          kind: "block",
          type: "lists_indexOf",
          inputs: {
            VALUE: { block: { type: "variables_get", fields: { VAR: "list" } } }
          }
        },
        {
          kind: "block",
          type: "lists_getIndex",
          inputs: {
            VALUE: { block: { type: "variables_get", fields: { VAR: "list" } } }
          }
        },
        {
          kind: "block",
          type: "lists_setIndex",
          inputs: {
            LIST: { block: { type: "variables_get", fields: { VAR: "list" } } }
          }
        },
        {
          kind: "block",
          type: "lists_getSublist",
          inputs: {
            LIST: { block: { type: "variables_get", fields: { VAR: "list" } } }
          }
        },
        {
          kind: "block",
          type: "lists_split",
          inputs: {
            DELIM: { shadow: { type: "text", fields: { TEXT: "," } } }
          }
        },
        { kind: "block", type: "lists_sort" },
        { kind: "block", type: "lists_reverse" }
      ]
    },
    {
      kind: "category",
      name: "Biến",
      custom: "VARIABLE",
      categorystyle: "variable-category",
      imageUrl: "/icons/variable-symbol-in-window.png",
      cssConfig: {
        icon: "category-variables"
      }
    },
    {
      kind: "category",
      name: "Hàm",
      custom: "PROCEDURE",
      categorystyle: "function-category",
      imageUrl: "/icons/calculate.png",
      cssConfig: {
        icon: "category-functions"
      }
    }
  ]
};
