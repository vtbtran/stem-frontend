import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator } from "@/lib/blockly/generators";

export const defineMotionBlocks = () => {

    // Move Forward
    Blockly.Blocks['motion_move_forward'] = {
        init: function () {
            this.appendValueInput("STEPS")
                .setCheck("Number")
                .appendField("di chuyển tới");
            this.appendDummyInput()
                .appendField("bước");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía trước");
            this.setHelpUrl("");
        }
    };

    // Move Backward
    Blockly.Blocks['motion_move_backward'] = {
        init: function () {
            this.appendValueInput("STEPS")
                .setCheck("Number")
                .appendField("di chuyển lùi");
            this.appendDummyInput()
                .appendField("bước");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía sau");
            this.setHelpUrl("");
        }
    };

    // Move Forward (Time)
    Blockly.Blocks['motion_move_forward_time'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("di chuyển tới")
                .appendField(new Blockly.FieldNumber(1), "STEPS")
                .appendField("bước trong")
                .appendField(new Blockly.FieldNumber(1, 0, 100), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển về phía trước số bước trong khoảng thời gian nhất định");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['motion_move_forward_time'] = function (block: Blockly.Block) {
        const steps = block.getFieldValue('STEPS');
        const secs = block.getFieldValue('SECS');
        return `await moveForwardTime(${steps}, ${secs});\n`;
    };

    pythonGenerator.forBlock['motion_move_forward_time'] = function (block: Blockly.Block) {
        const steps = block.getFieldValue('STEPS');
        const secs = block.getFieldValue('SECS');
        return `await move_forward_time(${steps}, ${secs})\n`;
    };

    // Move Backward (Time)
    Blockly.Blocks['motion_move_backward_time'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("di chuyển lùi")
                .appendField(new Blockly.FieldNumber(1), "STEPS")
                .appendField("bước trong")
                .appendField(new Blockly.FieldNumber(1, 0, 100), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển lùi số bước trong khoảng thời gian nhất định");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['motion_move_backward_time'] = function (block: Blockly.Block) {
        const steps = block.getFieldValue('STEPS');
        const secs = block.getFieldValue('SECS');
        return `await moveBackwardTime(${steps}, ${secs});\n`;
    };

    pythonGenerator.forBlock['motion_move_backward_time'] = function (block: Blockly.Block) {
        const steps = block.getFieldValue('STEPS');
        const secs = block.getFieldValue('SECS');
        return `await move_backward_time(${steps}, ${secs})\n`;
    };

    // Turn Left

    Blockly.Blocks['motion_turn_left'] = {
        init: function () {
            this.appendValueInput("DEGREES")
                .setCheck("Number")
                .appendField("xoay trái");
            this.appendDummyInput()
                .appendField("độ");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang trái");
            this.setHelpUrl("");
        }
    };

    // Turn Right
    Blockly.Blocks['motion_turn_right'] = {
        init: function () {
            this.appendValueInput("DEGREES")
                .setCheck("Number")
                .appendField("xoay phải");
            this.appendDummyInput()
                .appendField("độ");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang phải");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const steps = javascriptGenerator.valueToCode(block, 'STEPS', 0) || '0';
        return `await moveForward(${steps});\n`;
    };

    javascriptGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const steps = javascriptGenerator.valueToCode(block, 'STEPS', 0) || '0';
        return `await moveBackward(${steps});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const degrees = javascriptGenerator.valueToCode(block, 'DEGREES', 0) || '0';
        return `await turnLeft(${degrees});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const degrees = javascriptGenerator.valueToCode(block, 'DEGREES', 0) || '0';
        return `await turnRight(${degrees});\n`;
    };

    // Generators - Python
    pythonGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const steps = pythonGenerator.valueToCode(block, 'STEPS', 0) || '0';
        return `await move_forward(${steps})\n`;
    };

    pythonGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const steps = pythonGenerator.valueToCode(block, 'STEPS', 0) || '0';
        return `await move_backward(${steps})\n`;
    };

    pythonGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const degrees = pythonGenerator.valueToCode(block, 'DEGREES', 0) || '0';
        return `await turn_left(${degrees})\n`;
    };

    pythonGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const degrees = pythonGenerator.valueToCode(block, 'DEGREES', 0) || '0';
        return `await turn_right(${degrees})\n`;
    };
};
