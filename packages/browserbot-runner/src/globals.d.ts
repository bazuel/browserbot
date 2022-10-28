import { BLSessionEvent } from '@browserbot/model';

export declare global {
  interface Window {
    blSerializer: any;
    controlMock: () => Promise<{ date: boolean; storage: boolean }>;
    setMockDateTrue: () => void;
    setMockStorageTrue: () => void;
    getActualMockedTimestamp: () => Promise<number>;
    bb_monitorInstance: SessionMonitor;
    browserbot: { SessionMonitor: SessionMonitor };
    sendTo: (event: BLSessionEvent) => Promise<void>;
    createNewMonitor: () => {};
  }
}

export interface SessionMonitor {
  new (sendTo: (event: BLSessionEvent) => Promise<void>);
  enable: () => {};
  disable: () => {};
}
