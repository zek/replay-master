import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";
import type { ServiceBroker } from "moleculer";
import type { ActionDownloadParams, DownloadReplayOptions, ReplaySource } from "../services/replay-downloader/types";

export default async function getReplayPath(meta: Required<ReplaySource>, broker: ServiceBroker, replayDir: string): Promise<string> {
  const objectName = `${meta.origin}/${meta.sharecode}.dem`;
  const filePath = join(replayDir, objectName);

  try {
    await stat(filePath);
    return filePath;
  } catch (err) {
    // File doesn't exist
  }

  try {
    await mkdir(dirname(filePath), { recursive: true });


    await broker.call<void, DownloadReplayOptions>("file.downloadReplay", {
      objectName,
      filePath,
    });
    return filePath;
  } catch (error) {
    const replayUrl = meta.replayUrl;
    const replayStream = await broker.call<Readable, ActionDownloadParams>("replay-downloader.download", {
      replayUrl,
    });

    await pipeline(replayStream, createWriteStream(filePath));

    await broker.call("file.uploadReplay", replayStream, {
      meta: {
        objectName,
        filePath,
      },
      timeout: 2_000,
    }).catch(err => console.error(err));
  }

  return filePath;
}
