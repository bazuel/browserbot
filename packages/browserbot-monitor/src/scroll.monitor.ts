import {BLMonitor, BLScrollEvent} from "./events";
import {throttle} from "./throttle.util";
import {on} from "./on.event";
import {blevent} from "./dispatched.events";

export class ScrollMonitor implements BLMonitor {
    private disableScroll: () => any = ()=>{}; 

    enable(): void {
        const updatePosition = throttle(evt => {
            this.manageScrollEvent(evt);
        }, 50);
        this.disableScroll = on('scroll', updatePosition);
    }

    manageScrollEvent(evt) {
        const scrollEl = evt.target as HTMLElement
        let x = scrollEl.scrollLeft
        let y = scrollEl.scrollTop
        if (evt.target == document) {
            x = window.scrollX
            y = window.scrollY
        }
        let data: Partial<BLScrollEvent> = {
            x,
            y,
            target: evt.target,
            currentTarget: evt.currentTarget
        }
        if (evt.target === document)
            blevent.mouse.scroll(data)
        else
            blevent.mouse.elementscroll(data)
    }

    disable(): void {
        this.disableScroll()
    }
}
