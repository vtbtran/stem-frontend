import { useEffect } from "react";
import { synth } from "@/lib/audio/SimpleSynth";
import { RobotController } from "@/lib/hardware/RobotController";
import { BlocklyStageSoundEvent } from "@/types/events";

export function useSimulationEvents() {
    useEffect(() => {
        const onSound = (e: BlocklyStageSoundEvent) => {
            const { action, value } = e.detail;
            if (action === "beep") {
                synth.beep();
                RobotController.getInstance().sendCommand({ type: "sound", action: "beep" });
            }
            if (action === "tone" && value) {
                synth.playTone(value.freq, value.dur);
                RobotController.getInstance().sendCommand({ type: "sound", action: "tone", value });
            }
        };

        const onMotion = (e: CustomEvent) => {
            const detail = e.detail;
            if (detail.type === "MOTION_MOVE") {
                RobotController.getInstance().sendCommand({ type: "motion", action: "move", value: detail.value });
            } else if (detail.type === "MOTION_TURN") {
                RobotController.getInstance().sendCommand({ type: "motion", action: "turn", value: detail.value });
            }
        };

        const onLook = (e: CustomEvent) => {
            const detail = e.detail;
            if (detail.action === "on" || detail.action === "off") {
                RobotController.getInstance().sendCommand({ type: "look", action: detail.action });
            }
        };

        const onServo = (e: CustomEvent) => {
            const detail = e.detail;
            RobotController.getInstance().sendCommand({ type: "servo", action: "set", value: detail.value });
        };

        window.addEventListener("blockly:stage_sound", onSound as EventListener);
        window.addEventListener("blockly:stage_motion", onMotion as EventListener);
        window.addEventListener("blockly:stage_look", onLook as EventListener);
        window.addEventListener("blockly:stage_servo", onServo as EventListener);

        return () => {
            window.removeEventListener("blockly:stage_sound", onSound as EventListener);
            window.removeEventListener("blockly:stage_motion", onMotion as EventListener);
            window.removeEventListener("blockly:stage_look", onLook as EventListener);
            window.removeEventListener("blockly:stage_servo", onServo as EventListener);
        };
    }, []);
}
