
import * as Blockly from "blockly";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";

export const defineSoundBlocks = () => {

    // Sound: Beep
    Blockly.Blocks['sound_beep'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("🔊 phát tiếng bíp ở chân")
                .appendField(new Blockly.FieldDropdown([
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"], ["14", "14"], ["15", "15"], ["32", "32"], ["33", "33"],
                    ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"]
                ]), "PIN");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
            this.setTooltip("Phát một âm thanh bíp ngắn");
            this.setHelpUrl("");
        }
    };

    javascriptGenerator.forBlock['sound_beep'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        return `await beep(${pin});\n`;
    };

    pythonGenerator.forBlock['sound_beep'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        return `await beep(${pin})\n`;
    };

    (cppGenerator as any).forBlock['sound_beep'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        (cppGenerator as any).setups_[`setup_buzzer_${pin}`] = `pinMode(${pin}, OUTPUT);`;
        // Tạo xung 1000Hz (chu kỳ 1ms = 1000us -> nửa chu kỳ 500us) kéo dài 200ms
        // Số lần lặp = thời gian (ms) * tần số (Hz) / 1000 = 200 * 1000 / 1000 = 200
        return `for (long i = 0; i < 200; i++) {\n  digitalWrite(${pin}, HIGH);\n  delayMicroseconds(500);\n  digitalWrite(${pin}, LOW);\n  delayMicroseconds(500);\n}\ndelay(100);\n`;
    };

    // Sound: Play Tone
    Blockly.Blocks['sound_tone'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("🎵 phát nốt nhạc ở chân")
                .appendField(new Blockly.FieldDropdown([
                    ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"],
                    ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"],
                    ["12", "12"], ["13", "13"], ["14", "14"], ["15", "15"], ["32", "32"], ["33", "33"],
                    ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"]
                ]), "PIN")
                .appendField("tần số")
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
        const pin = block.getFieldValue('PIN');
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        return `await tone(${pin}, ${freq}, ${dur});\n`;
    };

    pythonGenerator.forBlock['sound_tone'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        return `await tone(${pin}, ${freq}, ${dur})\n`;
    };

    (cppGenerator as any).forBlock['sound_tone'] = function (block: Blockly.Block) {
        const pin = block.getFieldValue('PIN');
        const freq = block.getFieldValue('FREQ');
        const dur = block.getFieldValue('DURATION');
        (cppGenerator as any).setups_[`setup_buzzer_${pin}`] = `pinMode(${pin}, OUTPUT);`;

        // Băm xung phần mềm để tạo sóng âm (tránh conflict với vehicle)
        // half_period (us) = 1000000 / (2 * freq)
        // total_loops = dur * freq
        return `for (long i = 0; i < (long)(${dur} * ${freq}); i++) {\n  digitalWrite(${pin}, HIGH);\n  delayMicroseconds(1000000 / (2 * ${freq}));\n  digitalWrite(${pin}, LOW);\n  delayMicroseconds(1000000 / (2 * ${freq}));\n}\ndelay(100);\n`;
    };

    // MP3: Play
    Blockly.Blocks['sound_mp3_play'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("▶️ phát nhạc MP3 trong")
                .appendField(new Blockly.FieldNumber(2, 0.1, 60), "DURATION")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
            this.setTooltip("Phát nhạc từ module MP3 trong khoảng thời gian nhất định (giây)");
        }
    };
    javascriptGenerator.forBlock['sound_mp3_play'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        return `await mp3Play();\nawait delay(${dur * 1000});\nawait mp3Pause();\n`;
    };
    pythonGenerator.forBlock['sound_mp3_play'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        return `await mp3_play()\nimport time\ntime.sleep(${dur})\nawait mp3_pause()\n`;
    };
    (cppGenerator as any).forBlock['sound_mp3_play'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        (cppGenerator as any).definitions_['include_my1690'] = '#include <MY1690.h>\nmy1690 myMP3;';
        return `myMP3.play();\ndelay(${dur * 1000});\nmyMP3.pause();\n`;
    };

    // MP3: Pause
    Blockly.Blocks['sound_mp3_pause'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("⏸️ tạm dừng MP3 trong")
                .appendField(new Blockly.FieldNumber(2, 0.1, 60), "DURATION")
                .appendField("giây");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
            this.setTooltip("Tạm dừng nhạc MP3 trong khoảng thời gian nhất định (giây)");
        }
    };
    javascriptGenerator.forBlock['sound_mp3_pause'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        return `await mp3Pause();\nawait delay(${dur * 1000});\nawait mp3Play();\n`;
    };
    pythonGenerator.forBlock['sound_mp3_pause'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        return `await mp3_pause()\nimport time\ntime.sleep(${dur})\nawait mp3_play()\n`;
    };
    (cppGenerator as any).forBlock['sound_mp3_pause'] = function (block: Blockly.Block) {
        const dur = block.getFieldValue('DURATION');
        (cppGenerator as any).definitions_['include_my1690'] = '#include <MY1690.h>\nmy1690 myMP3;';
        return `myMP3.pause();\ndelay(${dur * 1000});\nmyMP3.play();\n`;
    };

    // MP3: Next
    Blockly.Blocks['sound_mp3_next'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("⏭️ bài nhạc tiếp theo");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
        }
    };
    javascriptGenerator.forBlock['sound_mp3_next'] = function () { return `await mp3Next();\n`; };
    pythonGenerator.forBlock['sound_mp3_next'] = function () { return `await mp3_next()\n`; };
    (cppGenerator as any).forBlock['sound_mp3_next'] = function () {
        (cppGenerator as any).definitions_['include_my1690'] = '#include <MY1690.h>\nmy1690 myMP3;';
        return `myMP3.nextTrack();\n`;
    };

    // MP3: Prev
    Blockly.Blocks['sound_mp3_prev'] = {
        init: function () {
            this.appendDummyInput()
                .appendField("⏮️ bài nhạc trước đó");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setStyle('sound-style');
        }
    };
    javascriptGenerator.forBlock['sound_mp3_prev'] = function () { return `await mp3Prev();\n`; };
    pythonGenerator.forBlock['sound_mp3_prev'] = function () { return `await mp3_prev()\n`; };
    (cppGenerator as any).forBlock['sound_mp3_prev'] = function () {
        (cppGenerator as any).definitions_['include_my1690'] = '#include <MY1690.h>\nmy1690 myMP3;';
        return `myMP3.previousTrack();\n`;
    };
};
