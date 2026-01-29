
import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineLooksBlocks = () => {

    // Command: Say (Wait)
    Blockly.Blocks['looks_say'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("nói")
                .appendField(new Blockly.FieldTextInput("Hello!"), "MESSAGE")
                .appendField("trong")
                .appendField(new Blockly.FieldNumber(2, 0.1, 60), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('speech-style');
            this.setTooltip("Hiển thị bong bóng thoại trong khoảng thời gian");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['looks_say'] = function (block: Blockly.Block) {
        const msg = block.getFieldValue('MESSAGE');
        const secs = block.getFieldValue('SECS');
        return `await say("${msg}", ${secs});\n`;
    };

    pythonGenerator.forBlock['looks_say'] = function (block: Blockly.Block) {
        const msg = block.getFieldValue('MESSAGE');
        const secs = block.getFieldValue('SECS');
        return `await say("${msg}", ${secs})\n`;
    };

    (cppGenerator as any).forBlock['looks_say'] = function (block: Blockly.Block) {
        const msg = block.getFieldValue('MESSAGE');
        const secs = block.getFieldValue('SECS');
        return `say("${msg}", ${secs});\n`;
    };
};
