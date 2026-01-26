
import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineHardwareBlocks = () => {

    // Hardware: LED
    Blockly.Blocks['hardware_led'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("bật đèn")
                .appendField(new Blockly.FieldDropdown([["Bật", "on"], ["Tắt", "off"]]), "STATE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FF9900"); // Orange for Hardware
            this.setTooltip("Điều khiển đèn LED trên xe");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_led'] = function (block: Blockly.Block) {
        const state = block.getFieldValue('STATE');
        return `await led('${state}');\n`;
    };

    pythonGenerator.forBlock['hardware_led'] = function (block: Blockly.Block) {
        const state = block.getFieldValue('STATE');
        return `await led('${state}')\n`;
    };

    (cppGenerator as any).forBlock['hardware_led'] = function (block: Blockly.Block) {
        const state = block.getFieldValue('STATE');
        return `led("${state}");\n`;
    };

    // Hardware: Servo
    Blockly.Blocks['hardware_servo'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("quay servo tới góc")
                .appendField(new Blockly.FieldNumber(90, 0, 180), "ANGLE")
                .appendField("độ");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#FF9900");
            this.setTooltip("Quay Servo tới góc chỉ định (0-180)");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const angle = block.getFieldValue('ANGLE');
        return `await servo(${angle});\n`;
    };

    pythonGenerator.forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const angle = block.getFieldValue('ANGLE');
        return `await servo(${angle})\n`;
    };

    (cppGenerator as any).forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const angle = block.getFieldValue('ANGLE');
        return `servo(${angle});\n`;
    };
};
