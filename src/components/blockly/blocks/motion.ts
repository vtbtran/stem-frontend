import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

// Import thư viện chuẩn của Blockly để không bị lỗi math_number
import 'blockly/javascript';

export const defineMotionBlocks = () => {

    // 1. Move Forward
    Blockly.Blocks['motion_move_forward'] = {
        init: function () {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("di chuyển tới với tốc độ");
            this.appendValueInput("SECS")
                .setCheck("Number")
                .appendField("trong");
            this.appendDummyInput()
                .appendField("giây");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía trước với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // 2. Move Backward
    Blockly.Blocks['motion_move_backward'] = {
        init: function () {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("di chuyển lùi với tốc độ");
            this.appendValueInput("SECS")
                .setCheck("Number")
                .appendField("trong");
            this.appendDummyInput()
                .appendField("giây");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Di chuyển xe về phía sau với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // 3. Turn Left
    Blockly.Blocks['motion_turn_left'] = {
        init: function () {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("xoay trái với tốc độ");
            this.appendValueInput("SECS")
                .setCheck("Number")
                .appendField("trong");
            this.appendDummyInput()
                .appendField("giây");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang trái với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // 4. Turn Right
    Blockly.Blocks['motion_turn_right'] = {
        init: function () {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("xoay phải với tốc độ");
            this.appendValueInput("SECS")
                .setCheck("Number")
                .appendField("trong");
            this.appendDummyInput()
                .appendField("giây");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4C97FF");
            this.setTooltip("Xoay xe sang phải với tốc độ và thời gian chỉ định");
            this.setHelpUrl("");
        }
    };

    // ==========================================
    // JAVASCRIPT GENERATORS (Dùng valueToCode)
    // ==========================================
    javascriptGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = (javascriptGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (javascriptGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `await moveForward(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = (javascriptGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (javascriptGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `await moveBackward(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = (javascriptGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (javascriptGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `await turnLeft(${speed}, ${secs});\n`;
    };

    javascriptGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = (javascriptGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (javascriptGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `await turnRight(${speed}, ${secs});\n`;
    };

    // ==========================================
    // PYTHON GENERATORS
    // ==========================================
    pythonGenerator.forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = (pythonGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (pythonGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `await move_forward(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = (pythonGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (pythonGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `await move_backward(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = (pythonGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (pythonGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `await turn_left(${speed}, ${secs})\n`;
    };

    pythonGenerator.forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = (pythonGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (pythonGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `await turn_right(${speed}, ${secs})\n`;
    };

    // ==========================================
    // CPP GENERATORS
    // ==========================================
    (cppGenerator as any).forBlock['motion_move_forward'] = function (block: Blockly.Block) {
        const speed = (cppGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (cppGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `moveForward(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_move_backward'] = function (block: Blockly.Block) {
        const speed = (cppGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (cppGenerator as any).valueToCode(block, 'SECS', 0) || '1';
        return `moveBackward(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_turn_left'] = function (block: Blockly.Block) {
        const speed = (cppGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (cppGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `turnLeft(${speed}, ${secs});\n`;
    };

    (cppGenerator as any).forBlock['motion_turn_right'] = function (block: Blockly.Block) {
        const speed = (cppGenerator as any).valueToCode(block, 'SPEED', 0) || '150';
        const secs = (cppGenerator as any).valueToCode(block, 'SECS', 0) || '0.5';
        return `turnRight(${speed}, ${secs});\n`;
    };
};