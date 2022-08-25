export interface BBAction {
  action:
    | 'mousemove'
    | 'scroll'
    | 'mouseup'
    | 'mousedown'
    | 'wait'
    | 'goto'
    | 'referer'
    | 'resize'
    | 'device';
}

export interface BBDeviceInformationAction extends BBAction {
  userAgent: string;
}

export interface BBGotoAction extends BBAction {
  url: string;
}

export interface BBMouseMoveAction extends BBAction {
  x: number;
  y: number;
  moves: { x: number; y: number; at: number }[];
}

export interface BBScrollAction extends BBAction {
  x: number;
  y: number;
}

export interface BBWaitAction extends BBAction {
  timeout: number;
}

export interface BBResizeAction extends BBAction {
  width: number;
  height: number;
}

export interface BBRefererAction extends BBAction {
  referer: string;
}