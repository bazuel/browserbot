import {BLMonitor} from "../events";
import {on} from "../on.event";
import {blevent} from "../dispatched.events";

export class MediaMonitor implements BLMonitor {
    private disableMonitoring!: () => void;

    enable(): void {


        const handlers = [
            on('play', e => {
                blevent.media.play({target: e.target})
            }),
            on('pause', e => {
                blevent.media.pause({target: e.target})
            })
        ];
        this.disableMonitoring = () => {
            handlers.forEach(h => h());
        };
    }

    disable(): void {
        this.disableMonitoring()
    }
}
