import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator } from "@/lib/blockly/generators";

export const defineControlBlocks = () => {

    // Event: Start (Hat block)
    Blockly.Blocks['event_start'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("khi bấm");
            this.appendDummyInput()
                .appendField("bắt đầu");
            this.setNextStatement(true, null);
            this.setColour("#4C97FF"); // Match Motion Blue
            this.setTooltip("Bắt đầu chương trình");
            this.setHelpUrl("");
        }
    };

    // Generator - JS
    javascriptGenerator.forBlock['event_start'] = function (block: Blockly.Block) {
        // The start block is just an entry point, code flows through it.
        return '// Start Program\n';
    };

    // Generator - Python
    pythonGenerator.forBlock['event_start'] = function (block: Blockly.Block) {
        return '# Start Program\n';
    };


    // Loop: Forever
    Blockly.Blocks['control_forever'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("lặp lại mãi");
            this.appendStatementInput("DO")
                .setCheck(null);
            this.setPreviousStatement(true, null);
            this.setColour("#4C97FF"); // Match Motion Blue
            this.setTooltip("Lặp lại các khối bên trong mãi mãi");
            this.setHelpUrl("");
        }
    };

    // Generator - JS (Async Safe)
    javascriptGenerator.forBlock['control_forever'] = function (block: Blockly.Block) {
        const branch = javascriptGenerator.statementToCode(block, 'DO');
        // Inject a small delay to prevent browser freeze and allow UI updates
        return `while (true) {\n${branch}  await new Promise(r => setTimeout(r, 10));\n}\n`;
    };

    // Generator - Python (Async Safe)
    pythonGenerator.forBlock['control_forever'] = function (block: Blockly.Block) {
        const branch = pythonGenerator.statementToCode(block, 'DO');
        // Inject asyncio sleep to yield control
        return `while True:\n${branch}  import asyncio\n  await asyncio.sleep(0.01)\n`;
    };

    // Command: Stop
    Blockly.Blocks['control_stop'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("dừng lại");
            this.setPreviousStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Dừng chương trình ngay lập tức");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['control_stop'] = function (block: Blockly.Block) {
        return "throw 'STOP';\n";
    };

    pythonGenerator.forBlock['control_stop'] = function (block: Blockly.Block) {
        return "raise Exception('STOP')\n";
    };
};
