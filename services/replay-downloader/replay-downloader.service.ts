import { exec as execCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { Readable } from "stream";
import {createGunzip} from "zlib";
import type { Context, ServiceBroker, ServiceSettingSchema } from "moleculer";
import { Service } from "moleculer";
import unbzip2 from "unbzip2-stream";
import { request } from "undici";
import type { WebMeta } from "../types";
import type { ActionDownloadParams } from "./types";

const exec = promisify(execCallback);

interface ServiceSettings extends ServiceSettingSchema {
}

export default class ReplayDownloaderService extends Service<ServiceSettings> {

  protected bzipAvailable = false;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-downloader",
      settings: {
      },
      actions: {
        download: {
          rest: {
            method: "GET",
            path: "/",
          },
          params: {
            replayUrl: { type: "string" },
          },
          handler: this.download,
        },
      },
      created: this.serviceCreated,
    });
  }

  makeFileName(url: string): string {
    return url.split('/').pop()!.replace(/\.(bz2|gz)$/, '');
  }

  async download(ctx: Context<ActionDownloadParams, WebMeta>) {
    const { replayUrl } = ctx.params;

    const filename = this.makeFileName(replayUrl);
    ctx.meta.$responseType = "application/octet-stream";
    ctx.meta.$responseHeaders = {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${filename}`,
    };

    const response = await request(replayUrl);

    if (response.statusCode < 200 || response.statusCode > 299) {
      throw new Error("Remote file not found");
    }

    if (response.body === null) {
      throw new Error("Response body is null");
    }

    if (replayUrl.endsWith(".bz2")) {
      return this.unbz2(response.body);
    }

    if (replayUrl.endsWith(".gz")) {
      return this.ungz(response.body);
    }

    return response.body;
  }

  async unbz2(stream: Readable) {
    if (!this.bzipAvailable) {
      return stream.pipe(unbzip2());
    }

    const bzip2 = spawn("bzip2", ["-d"]);
    stream.pipe(bzip2.stdin);

    return bzip2.stdout;
  }

  async ungz(stream: Readable) {
    return stream.pipe(createGunzip());
  }


  async serviceCreated() {
    this.bzipAvailable = await this.checkBzip2Availability();
  }

  async checkBzip2Availability() {
    const command = "bzip2 --help";
    try {
      await exec(command);
      return true;
    } catch (error) {
      return false;
    }
  }

}
