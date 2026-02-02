
import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineSoundBlocks = () => {

    // Sound: Beep
    Blockly.Blocks['sound_beep'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("phát tiếng bíp");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
            this.setTooltip("Phát một âm thanh bíp ngắn");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['sound_beep'] = function (block: Blockly.Block) {
        return "await beep();\n";
    };

    pythonGenerator.forBlock['sound_beep'] = function (block: Blockly.Block) {
        return "await beep()\n";
    };

    (cppGenerator as any).forBlock['sound_beep'] = function (block: Blockly.Block) {
        return "beep();\n";
    };

    // Sound: Play Tone
    Blockly.Blocks['sound_tone'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("phát nốt nhạc tần số")
                .appendField(new Blockly.FieldNumber(440, 20, 20000), "FREQ")
                .appendField("Hz trong")
                .appendField(new Blockly.FieldNumber(0.5, 0.1, 10), "DURATION")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
            this.setTooltip("Phát một nốt nhạc với tần số và thời gian tùy chỉnh");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['sound_tone'] = function (block: Blockly.Block) {
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        return `await tone(${freq}, ${dur});\n`;
    };

    pythonGenerator.forBlock['sound_tone'] = function (block: Blockly.Block) {
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        return `await tone(${freq}, ${dur})\n`;
    };

    (cppGenerator as any).forBlock['sound_tone'] = function (block: Blockly.Block) {
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        return `tone(${freq}, ${dur});\n`;
    };
};
