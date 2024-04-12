import fs from "fs/promises";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as process from "process";
import type { Readable } from "stream";
import { execa } from "execa";
import { Service } from "moleculer";
import type { Context, ServiceBroker } from "moleculer";
import getReplayPath from "../../utils/get-replay-path";
import randomString from "../../utils/random-string";
import type { ReplayEntity } from "../replay-parser/types";
import { calculateBitrate, getKillsByRound, getKillsInfo, singleHighlight } from "../replay-parser/utils";
import makeScript from "./hlae-cs2-script";
import SourceTelnet from "./source-telnet";
import type { ActionReplayRecordParams, CS2ScriptOptions, Highlight, HighlightRequest } from "./types";
import { concatVideos, mergeVideoAndAudio } from "./utils";

interface ServiceSettings {
  hlaeDir: string;
  mmCfgPath: string;
  width: number;
  height: number;
  replayDir: string;
  csgoDir: string;
  tempDir: string;
  ffmpegPath: string;
  captureDir: string;
  videoFilters: string;
  crosshairCode: string;
}


export default class ReplayRecorderService extends Service<ServiceSettings> {

  telnet?: SourceTelnet;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: "replay-recorder",
      settings: {
        csgoDir: resolve(process.env.CSGO_DIR || "C:/Program Files (x86)/Steam/steamapps/common/Counter-Strike Global Offensive/game/"),
        hlaeDir: resolve(process.env.HLAE_DIR || "./resources/hlae/"),
        mmCfgPath: resolve(process.env.CSGO_MM_CFG_PATH || "./resources/mmcfg/"),
        tempDir: resolve(process.env.REPLAY_TEMP_DIR || "./data/tmp/"),
        replayDir: resolve(process.env.REPLAY_DIR || "./data/replays/"),
        ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg.exe",
        captureDir: resolve(process.env.REPLAY_CAPTURE_DIR || "./data/captures/"),
        videoFilters: process.env.VIDEO_FILTERS || "",
        crosshairCode: process.env.CROSSHAIR_CODE || "CSGO-CRGTh-TOq2d-nhbkC-doNM6-tzioE",
        width: 1920,
        height: 1080,
      },
      actions: {
        'single-highlight': {
          params: {},
          handler: this.singleHighlight,
        },
        record: {
          params: {},
          timeout: 180_000,
          bulkhead: {
            enabled: true,
            concurrency: 1,
            maxQueueSize: 10,
          },
          handler: this.record,
        },
      },
      started: this.started,
    });
  }

  async singleHighlight(context: Context<HighlightRequest>): Promise<Highlight> {
    const { steamId, roundId } = context.params;

    const replay = await this.getReplayInfo(context.params.sharecode);

    const kills = getKillsByRound(replay.metadata.halves, roundId, steamId);
    if (kills.length === 0) {
      throw new Error(`Match (demo ${replay.origin}, ${replay.identifier}) does not have any kills by player ${steamId}`);
    }

    const { startTick, endTick, skips, totalSeconds } = singleHighlight(replay.metadata.headers.tickrate, kills);

    if (endTick < startTick) {
      throw new Error("End tick must be after start tick");
    }

    const player = this.getPlayerFromReplay(replay, steamId);
    this.logger.info(
      `Recording player ${player.name} #${player.steamId} from tick ${startTick} to ${endTick} with skips ${skips}`,
    );

    const info = getKillsInfo(kills, roundId)!;

    return {
      title: `${info.round} ${player.name} ${info.kills}`,
      playerId: player.steamId,
      startTick,
      endTick,
      totalSeconds,
      skips,
    };
  }

  async record(context: Context<ActionReplayRecordParams>): Promise<Readable> {
    const {
      fps = 60,
      audioBitrate = 192,
      crosshairCode = this.settings.crosshairCode,
      fragmovie = false,
      useDemoCrosshair = false,
      highlight,
    } = context.params;

    this.logger.info("Recording highlight: ", highlight);

    const replay = await this.getReplayInfo(context.params.sharecode);

    const takeFolders = await this.startRecording({
      highlight,
      tickrate: replay.metadata.headers.tickrate || 64,
      videoBitrate: calculateBitrate(highlight.totalSeconds),
      demoPath: await getReplayPath(context.params, this.broker, this.settings.replayDir),
      videoFilters: this.settings.videoFilters,
      unblockString: randomString(),
      fps,
      audioBitrate,
      crosshairCode,
      fragmovie,
      useDemoCrosshair,
      captureDir: this.settings.captureDir,
    });

    // Wait 1 second to make sure the recording is finished
    await new Promise(f => setTimeout(f, 1000));

    return this.processRecording(takeFolders);
  }

  async started() {
    const { replayDir, tempDir, csgoDir } = this.settings;

    const cfgPath = `${csgoDir}/csgo/cfg`;
    try {
      await fs.access(cfgPath);
      await fs.cp("./resources/cfg/", cfgPath, { recursive: true });
    } catch (error) {
      this.logger.error(`Cannot copy cfg files into ${cfgPath}: ${error}`);
    }
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(replayDir, { recursive: true });
    await this.makeCS2(41920);
  }

  protected async getReplayInfo(url: string): Promise<ReplayEntity> {
    const replay = await this.broker.call<ReplayEntity, Partial<any>>("replay-info.get", {
      url,
    });
    if (!replay) {
      throw new Error(`Match (demo ${url}) not found`);
    }
    return replay;
  }

  protected getPlayerFromReplay(replay: ReplayEntity, playerId: string) {
    const player = replay.metadata.players.find((p) => p.steamId === playerId);
    if (!player) {
      throw new Error(`Match (demo ${replay.origin}, ${replay.identifier}) does not have player ${playerId}`);
    }
    return player;
  }

  protected async runPreplayCommands(scriptFile: string): Promise<void> {
    const preplayCommands = [
      "mirv_cmd clear",
      `mirv_cmd load "${scriptFile}"`,
    ];
    this.logger.info("Running preplay commands: ", preplayCommands);

    await this.telnet?.run(preplayCommands.join(";"));
    await this.telnet?.setResolution(1920, 1080);
  }

  protected async processRecording(takeFolders: string[]): Promise<Readable> {
      const taskId = randomString(10);

      const parts = await Promise.all(
        takeFolders.map(async (folder, idx) => {
          this.logger.info(`Muxing in ${folder}`);

          const files = await readdir(folder);
          const wav = files.find(file => file.endsWith(".wav"));
          if (!wav) {
            throw new Error(`Could not find .wav in ${folder}`);
          }

          const clipOutput = join(folder, `${taskId}-${idx}.mp4`);
          return mergeVideoAndAudio(
            join(folder, "video.mp4"),
            join(folder, wav),
            clipOutput,
            { ffmpegPath: this.settings.ffmpegPath },
          ).then(() => clipOutput);
        }),
      );

      if (parts.length === 0) {
        throw new Error("No recording parts found");
      }

      return await concatVideos(parts, {
        tempDir: this.settings.tempDir,
        ffmpegPath: this.settings.ffmpegPath,
      }).then(res => {
        res.once("exit", async() => {
          for (const takeFolder of takeFolders) {
            await fs.rm(takeFolder, { recursive: true });
          }              
        })
        return res
      })
  }

  protected async startRecording(options: CS2ScriptOptions) {
    const cmds = makeScript(options);

    this.logger.info("Recording with options: ", options);

    const job_id = randomString(10);
    const scriptFile = join(this.settings.tempDir, `${job_id}.xml`);
    try {
      await cmds.save(scriptFile);

      await this.runPreplayCommands(scriptFile);

      let error: Error | null = null;
      const takeFolders: string[] = [];

      let stopFolderChecker = false;
      const folderChecker = (line: string) => {
        if (stopFolderChecker) {
          return true;
        }
        const match = line.match(/Recording to "(.*)"\./);
        if (match) {
          const folder = match[1];
          this.logger.info(`Found take folder: ${folder}`);
          takeFolders.push(folder);
        }
        return false;
      };

      const checker = (line: string) => {
        if (line.match(/^Missing map .*, disconnecting$/)) {
          error = new Error("Demos that require old maps are not supported.");
          return true;
        }
        return line.trim() === options.unblockString.trim();
      };

      const takeFolderTask = this.telnet?.waitFor(folderChecker, 250_000);

      this.logger.info("Starting demo recording: ", options.demoPath);
      await this.telnet?.playDemo(options.demoPath);

      try {
        await this.telnet?.waitFor(checker, 240_000);
      } finally {
        stopFolderChecker = true;
      }

      this.logger.info("Waiting for folder checker to finish");

      await takeFolderTask;

      if (error) {
        throw (error as Error);
      }

      return takeFolders;
    } finally {
      await fs.unlink(scriptFile);
    }
  }

  protected craft_hlae_args(port: number): string[] {
    const { csgoDir, mmCfgPath, width, height } = this.settings;
    return [
      "-customLoader",
      "-afxDisableSteamStorage",
      "-noGui",
      "-autoStart",
      "-hookDllPath",
      join(this.settings.hlaeDir, "x64/AfxHookSource2.dll"),
      "-programPath",
      join(csgoDir, "bin/win64/cs2.exe"),
      "-cmdLine",
      `-w ${width} -h ${height} -window -netconport ${port} -console -novid -tools -noassetbrowser -insecure -steam +sv_lan 1`,
      "-addEnv",
      `USRLOCALCSGO=${mmCfgPath}`,
    ];
  }

  protected async makeCS2(port: number): Promise<void> {
    this.logger.info("Making cs2");

    const telnet = new SourceTelnet("127.0.0.1", port);
    this.telnet = telnet;

    try {
      const hlaeBin = join(this.settings.hlaeDir, "hlae.exe");
      const args = this.craft_hlae_args(port);
      const process = execa(hlaeBin, args, { timeout: 5_000, reject: false });

      await telnet.connect().then(async () => {
        process.kill()
        
        const startupCommands: string[] = [
          "mirv_block_commands add 5 \"\\*\"",
          "exec recorder",
          "exec stream",
        ];
        
        for (const command of startupCommands) {
          await telnet.run(command);
          await new Promise(resolve => {
            setTimeout(resolve, 250);
          });
        }
      });
    } catch (error) {
      this.logger.error(`Failed to start Hlae: ${error.message}`);
    }
  }

}


