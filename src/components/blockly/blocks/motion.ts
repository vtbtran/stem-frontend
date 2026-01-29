import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineMotionBlocks = () => {

    // Move Forward
    Blockly.Blocks['motion_move_forward'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("di chuyển tới với tốc độ")
                .appendField(new Blockly.FieldNumber(150, 0, 255), "SPEED")
                .appendField("trong")
                .appendField(new Blockly.FieldNumber(1, 0), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía trước với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // Move Backward
    Blockly.Blocks['motion_move_backward'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("di chuyển lùi với tốc độ")
                .appendField(new Blockly.FieldNumber(150, 0, 255), "SPEED")
                .appendField("trong")
                .appendField(new Blockly.FieldNumber(1, 0), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía sau với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // Turn Left
    Blockly.Blocks['motion_turn_left'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("xoay trái với tốc độ")
                .appendField(new Blockly.FieldNumber(150, 0, 255), "SPEED")
                .appendField("trong")
                .appendField(new Blockly.FieldNumber(0.5, 0), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang trái với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // Turn Right
    Blockly.Blocks['motion_turn_right'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("xoay phải với tốc độ")
                .appendField(new Blockly.FieldNumber(150, 0, 255), "SPEED")
                .appendField("trong")
                .appendField(new Blockly.FieldNumber(0.5, 0), "SECS")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang phải với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // Remove legacy Time blocks keys if conflict or keep them?
    // User wants to REPLACE logic. Let's just redefine the main keys.
    // We will comment out or remove the old `_time` variants to avoid duplication in toolbox if they are used there.
    // For now, I'll just skip defining `motion_move_forward_time` separately, 
    // or better, I will alias them to the same logic if needed, but for now I am overwriting the main keys.


    javascriptGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await moveForward(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await moveBackward(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await turnLeft(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await turnRight(${speed}, ${secs});\n`;
    };

    // Generators - Python
    pythonGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await move_forward(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await move_backward(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await turn_left(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `await turn_right(${speed}, ${secs})\n`;
    };

    // Generators - C++
    (cppGenerator as any).forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `moveForward(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `moveBackward(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `turnLeft(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = block.getFieldValue('SPEED');
        const secs = block.getFieldValue('SECS');
        return `turnRight(${speed}, ${secs});\n`;
    };
};
