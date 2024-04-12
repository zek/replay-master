import type {  Context,  ServiceBroker } from "moleculer";
import { Service } from "moleculer";
import type { SettingsSchema } from "../../mixins/minio.mixin";
import MinioMixin from "../../mixins/minio.mixin";
import type { DownloadReplayOptions, UploadReplayOptions } from "./types";

export default class FileService extends Service<SettingsSchema> {

  constructor(broker: ServiceBroker) {
    super(broker)

    this.parseServiceSchema({
      mixins: [MinioMixin],
      name: 'file',
      settings: {
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      },
      actions: {
        uploadReplay: {
          handler: this.uploadReplay.bind(this)
        },
        downloadReplay: {
          handler: this.downloadReplay.bind(this)
        }
      },
      started: this.started,
    })
  }

  async uploadReplay(context: Context<UploadReplayOptions>){
    return this.actions.putObject(context.params,{
      meta: {
        bucketName: "replays",
        ...context.meta,
      }
    });
  }

  async downloadReplay(context: Context<DownloadReplayOptions>){
    return this.actions.fgetObject(context.params, {
      meta: {
        bucketName: "replays",
        ...context.meta,
      }
    });
  }

  async started(){
    const buckets = ['replays'];
    for (const bucketName of buckets) {
      const exists = await this.actions.bucketExists({ bucketName });
      if (!exists) {
        await this.actions.makeBucket({
          bucketName
        });
      }
    }
  }

}
