import { Injectable } from '@nestjs/common';
import { ConfigService } from '../shared/config.service';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import { getS3Stream } from './s3-stream';

const AWS = require('aws-sdk');

interface S3Object {
  Key: string;
  LastModified: Date;
  ETag: string;
  ChecksumAlgorithm: [];
  Size: number;
  StorageClass: 'STANDARD' | string;
  Owner: {
    DisplayName: string;
    ID: string;
  };
}

@Injectable()
export class StorageService {
  private s3: S3;
  private bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.storage.bucket;
    this.s3 = new AWS.S3({
      endpoint: config.storage.endpoint,
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
      s3BucketEndpoint: true,
    });
  }

  list(prefix?: string): Promise<S3Object[]> {
    const result = new Promise<S3Object[]>((s, e) => {
      this.s3.listObjects(
        {
          Bucket: this.bucket,
          Prefix: prefix,
        },
        function (err, data) {
          if (err) {
            throw { error: err, data };
          } else {
            // Return the list ("Contents") as JSON
            s(data.Contents as unknown as S3Object[]);
          }
        },
      );
    });
    return result;
  }

  async delete(path: string) {
    return new Promise((s, e) => {
      this.s3.deleteObject({ Bucket: this.bucket, Key: path }, (err, data) => {
        if (err) {
          e({ error: err, data });
        } else {
          s(data);
        }
      });
    });
  }

  async read(path: string): Promise<Buffer> {
    return new Promise((s, e) => {
      this.s3.getObject({ Bucket: this.bucket, Key: path }, (err, data) => {
        if (err) {
          throw { error: err, data };
        } else {
          s(data.Body as Buffer);
        }
      });
    });
  }

  async getStream(path: string): Promise<Readable> {
    return getS3Stream(this.bucket, path, this.s3);
  }

  async upload(buffer: Buffer, filename: string) {
    const data = buffer;
    const result = new Promise((s, e) => {
      try {
        this.s3
          .upload(
            {
              Body: data,
              Bucket: this.bucket,
              Key: filename,
            },
            function (err, data) {
              if (err) {
                e({ error: err, data });
              } else {
                s(data);
              }
            },
          )
          .on('httpUploadProgress', ({ loaded, total }) => {
            console.log(
              'Progress:',
              loaded,
              '/',
              total,
              `${Math.round((100 * loaded) / total)}%`,
            );
          });
      } catch (e) {
        throw new Error('Cannot upload file');
      }
    });
    return result;
  }
}
