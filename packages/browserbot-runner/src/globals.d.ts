import { BLEvent, BLSessionEvent } from '@browserbot/model';

export declare global {
  interface Window {
    blSerializer: any;
    controlMock: () => Promise<{ date: boolean; storage: boolean }>;
    setMockDateTrue: () => void;
    setMockStorageTrue: () => void;
    getActualMockedTimestamp: () => Promise<number>;
    bb_monitorInstance: SessionMonitor;
    browserbot: { SessionMonitor: SessionMonitor };
    sendTo: (event: BLEvent) => Promise<void>;
    createNewMonitor: () => {};
    bb_collect: (event: BLSessionEvent) => Promise<void>;
    bb_tabId: () => Promise<number>;
    bb_sid: () => Promise<number>;
  }
}

export interface SessionMonitor {
  new (sendTo: (event: BLEvent) => Promise<void>);
  enable: () => {};
  disable: () => {};
}
