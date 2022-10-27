import { BLEvent, BLSessionEvent } from '@browserbot/model';

export declare global {
  interface Window {
    blSerializer: any;
    controlMock: () => Promise<{ date: boolean; storage: boolean }>;
    setMockDateTrue: () => void;
    setMockStorageTrue: () => void;
    getActualMockedTimestamp: () => Promise<number>;
    getSid: () => Promise<number>;
    getTab: () => Promise<{ id: number; url: string }>;
    bb_monitorInstance: SessionMonitor;
    browserbot: { SessionMonitor: SessionMonitor };
    bb_tabId: number;
    bb_events: BLSessionEvent[];
    pushElements: () => Promise<BLEvent[]>;
    sendTo: (event: BLEvent | BLSessionEvent) => Promise<void>;
  }
}

export interface SessionMonitor {
  new (sendTo: (event: BLEvent | BLSessionEvent) => Promise<void>);
  enable: () => {};
  disable: () => {};
}
