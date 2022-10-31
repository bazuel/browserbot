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
  api_token?: string;
}

export type BBUserState = 'ACTIVE' | 'DELETED';

export type BBRole = 'ADMIN' | 'USER';
export const BBRoleLabels: { [role in BBRole]: string } = {
  ADMIN: 'Amministratore',
  USER: 'Utente'
};
export const BBRoleLabelsArray: { role: BBRole; label: string }[] = [];
for (const r in BBRoleLabels) BBRoleLabelsArray.push({ role: r as BBRole, label: BBRoleLabels[r] });

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
  reference: string;
  owner?: BBUser;
  master_session: string;
}

export type BBEventWithSerializedTarget<T> = T & {
  target: BBSerializedTarget;
  value?: string;
};

export type BBSerializedTarget = {
  rect: { x: number; y: number; width: number; height: number };
  attributes: { [p: string]: string | null };
  tag: string;
  innerText: string;
};

export type BBSessionInfo = {
  sessionReference: string;
  screenshots: BBScreenShot[];
  domShots: BBDomShot[];
  video: BBVideo;
};

export type BBScreenShot = {
  filename: string;
  dimension: { width: number; height: number };
};

export type BBVideo = {
  filename: string;
};

export type BBDomShot = {
  filename: string;
};

export const BBApiPermission: string[] = ['all', 'download', 'upload', 'run'];
export type BBApiPermissionType = typeof BBApiPermission[number];
