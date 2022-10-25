// import {DBConfig} from "../db/postgres-db.service";

import * as process from 'process';

export interface EmailConfiguration {
  region: string;
  api_version: string;
  aws: {
    access_key_id: string;
    secret_access_key: string;
  };
  default_from: string;
}

export interface Config {
  db: any;
  storage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  email: EmailConfiguration;
  master_password: string;
  backend_url: string;
}

export function initGlobalConfig() {
  const {
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT,
    SSO_MASTER_PASSWORD,
    SSO_BACKEND_URL,
    SSO_RUNNER_URL,
    SSO_EMAIL_AWS_REGION,
    SSO_EMAIL_AWS_API_VERSION,
    SSO_EMAIL_AWS_ACCESS_KEY_ID,
    SSO_EMAIL_AWS_SECRET_ACCESS_KEY,
    SSO_DEFAULT_FROM,
    SSO_DEFAULT_COLOR,
    APP_URL,
    S3_SECRET_KEY,
    S3_ACCESS_KEY,
    S3_ENDPOINT,
    S3_BUCKET
  } = process.env;

  return {
    db: {
      host: DB_HOST,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: +DB_PORT
    },
    master_password: SSO_MASTER_PASSWORD,
    backend_url: SSO_BACKEND_URL,
    app_url: APP_URL,
    runner_url: SSO_RUNNER_URL,
    color: SSO_DEFAULT_COLOR || '#29ffad',
    email: {
      aws: {
        access_key_id: SSO_EMAIL_AWS_ACCESS_KEY_ID,
        secret_access_key: SSO_EMAIL_AWS_SECRET_ACCESS_KEY
      },
      api_version: SSO_EMAIL_AWS_API_VERSION,
      default_from: SSO_DEFAULT_FROM,
      region: SSO_EMAIL_AWS_REGION
    },
    storage: {
      accessKey: S3_ACCESS_KEY,
      endpoint: S3_ENDPOINT,
      secretKey: S3_SECRET_KEY,
      bucket: S3_BUCKET
    }
  };
}

type GlobalConfig = ReturnType<typeof initGlobalConfig>;

export class ConfigService implements Config {
  db: any;
  storage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  email: EmailConfiguration;
  master_password: string;
  backend_url: string;
  app_url: string;
  color: string;
  runner_url: string;

  constructor(globalConfig: GlobalConfig) {
    this.db = globalConfig.db as any;
    this.master_password = globalConfig.master_password;
    this.backend_url = globalConfig.backend_url;
    this.app_url = globalConfig.app_url;
    this.color = globalConfig.color;
    this.email = globalConfig.email;
    this.storage = globalConfig.storage;
    this.runner_url = globalConfig.runner_url;
  }
}
