
import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineHardwareBlocks = () => {

    // Hardware: LED
    Blockly.Blocks['hardware_led'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("💡 bật đèn chân")
                .appendField(new Blockly.FieldDropdown([
                    ["13", "13"], // Mặc định Arduino thường có LED ở chân 13
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
                    ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"]
                ]), "PIN")
                .appendField("trạng thái")
                .appendField(new Blockly.FieldDropdown([["Bật", "on"], ["Tắt", "off"]]), "STATE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('hardware-style'); // Orange for Hardware
            this.setTooltip("Điều khiển đèn LED trên xe tại chân xác định");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_led'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        return `await led(${pin}, '${state}');\n`;
    };

    pythonGenerator.forBlock['hardware_led'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        return `await led(${pin}, '${state}')\n`;
    };

    (cppGenerator as any).forBlock['hardware_led'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        const val = state === 'on' ? 'HIGH' : 'LOW';
        return `pinMode(${pin}, OUTPUT);\ndigitalWrite(${pin}, ${val});\n`;
    };

    // Hardware: LED Brightness
    Blockly.Blocks['hardware_led_brightness'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("💡 chỉnh độ sáng đèn chân")
                .appendField(new Blockly.FieldDropdown([
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]), "PIN")
                .appendField("mức");
            this.appendValueInput("BRIGHTNESS")
                .setCheck("Number");
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('hardware-style');
            this.setTooltip("Điều chỉnh độ sáng đèn LED (0-255) qua PWM");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_led_brightness'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const brightness = (javascriptGenerator as any).valueToCode(block, 'BRIGHTNESS', 0) || '255';
        return `await setLedBrightness(${pin}, ${brightness});\n`;
    };

    pythonGenerator.forBlock['hardware_led_brightness'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const brightness = (pythonGenerator as any).valueToCode(block, 'BRIGHTNESS', 0) || '255';
        return `await set_led_brightness(${pin}, ${brightness})\n`;
    };

    (cppGenerator as any).forBlock['hardware_led_brightness'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const brightness = (cppGenerator as any).valueToCode(block, 'BRIGHTNESS', 0) || '255';
        return `pinMode(${pin}, OUTPUT);\nanalogWrite(${pin}, ${brightness});\n`;
    };

    // Hardware: Servo
    Blockly.Blocks['hardware_servo'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("⚙️ quay servo chân")
                .appendField(new Blockly.FieldDropdown([
                    ["9", "9"],   // Chân thông dụng cho Servo
                    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"],
                    ["6", "6"], ["7", "7"], ["8", "8"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]), "PIN")
                .appendField("tới góc")
                .appendField(new Blockly.FieldNumber(90, 0, 180), "ANGLE")
                .appendField("độ");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('hardware-style');
            this.setTooltip("Quay Servo tới góc chỉ định (0-180) tại chân cắm đã chọn");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const angle = block.getFieldValue('ANGLE');
        return `await servo(${pin}, ${angle});\n`;
    };

    pythonGenerator.forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const angle = block.getFieldValue('ANGLE');
        return `await servo(${pin}, ${angle})\n`;
    };

    (cppGenerator as any).forBlock['hardware_servo'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const angle = block.getFieldValue('ANGLE');
        return `servo(${pin}, ${angle});\n`;
    };

    // Hardware: Ultrasonic
    Blockly.Blocks['hardware_ultrasonic'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("📡 đo khoảng cách siêu âm (cm)");
            this.appendDummyInput()
                .appendField("chân TRIG")
                .appendField(new Blockly.FieldDropdown([
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"]
                ]), "TRIG");
            this.appendDummyInput()
                .appendField("chân ECHO")
                .appendField(new Blockly.FieldDropdown([
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
                ]), "ECHO");
            this.setInputsInline(true);
            this.setOutput(true, "Number");
            this.setStyle('hardware-style');
            this.setTooltip("Trả về khoảng cách đo được từ cảm biến siêu âm theo cm");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['hardware_ultrasonic'] = function (block: Blockly.Block) {
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');
        return [`await getUltrasonicDistance(${trig}, ${echo})`, 0]; // ATOMIC or NONE order
    };

    pythonGenerator.forBlock['hardware_ultrasonic'] = function (block: Blockly.Block) {
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');
        return [`await get_ultrasonic_distance(${trig}, ${echo})`, 0];
    };

    (cppGenerator as any).forBlock['hardware_ultrasonic'] = function (block: Blockly.Block) {
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');

        const cppGen = cppGenerator as any;
        cppGen.definitions_['include_ultrasonic'] = '#include <ultrasonic.h>\nultrasonic myUltrasonic;';
        cppGen.setups_['setup_ultrasonic'] = `myUltrasonic.Init(${trig}, ${echo});`;

        return [`myUltrasonic.Ranging()`, cppGen.ORDER.FUNCTION_CALL];
    };
};
