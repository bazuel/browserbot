export interface BBUser {
  bb_userid?: string;
  name: string;
  surname: string;
  password?: string;
  email: string;
  teams: BBTeam[];
  roles: BBRole[];
  state: BBUserState;
  phone?: string;
}

export type BBUserState = "ACTIVE" | "DELETED";

export type BBRole = "ADMIN" | "USER";
export const BBRoleLabels: { [role in BBRole]: string } = {
  ADMIN: "Amministratore",
  USER: "Utente",
};
export const BBRoleLabelsArray: { role: BBRole; label: string }[] = [];
for (const r in BBRoleLabels)
  BBRoleLabelsArray.push({ role: r as BBRole, label: BBRoleLabels[r] });

export interface BBTeam {
  teamid?: string;
  name: string;
  roles: BBRole[];
}

export interface BBAddress {
  city: string;
  province: string;
  region?: string;
  address: string;
  cap: string;
  country: string;
  //  cap is string because may start with zero
}

export interface BBSession {
  bb_sessionid?: string;
  url: string;
  path: string;
  owner?: BBUser;
}

export interface BBAction {
  name:
    | "mousemove"
    | "scroll"
    | "mouseup"
    | "mousedown"
    | "wait"
    | "goto"
    | "referrer"
    | "resize"
    | "device";
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

export interface BBReferrerAction extends BBAction {
  referrer: string;
  url: string;
}
