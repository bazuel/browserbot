import {BLMonitor} from "./events";
import {throttle} from "./throttle.util";
import {blevent} from "./dispatched.events";
import {on} from "./on.event";


export class WindowResizeMonitor implements BLMonitor {
    private disableMonitoring: () => void = ()=>{};


    enable(): void {
        function getWindowHeight(): number {
            return (
                window.innerHeight ||
                (document.documentElement && document.documentElement.clientHeight) ||
                (document.body && document.body.clientHeight)
            );
        }

        function getWindowWidth(): number {
            return (
                window.innerWidth ||
                (document.documentElement && document.documentElement.clientWidth) ||
                (document.body && document.body.clientWidth)
            );
        }

        const updateDimension = throttle(() => {
            const height = getWindowHeight();
            const width = getWindowWidth();
            blevent.window.resize({
                width: Number(width),
                height: Number(height)
            });
        }, 200);
        updateDimension()
        this.disableMonitoring = on('resize', updateDimension, window);

    }

    disable(): void {
        this.disableMonitoring()
    }
}
