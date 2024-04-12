import HLAEScriptBuilder from "./hlae-script-builder";
import type { CS2ScriptOptions } from "./types";

export default function makeScript(options: CS2ScriptOptions): HLAEScriptBuilder {
  const c = new HLAEScriptBuilder();
  const padding = 4 * options.tickrate;
  const { startTick, skips, endTick, playerId } = options.highlight;
  c.skip(startTick - padding);
  c.tick(startTick - padding);

  const ffmpegOpt = [
    "-c:v libx264",
    `-b:v ${options.videoBitrate}`,
    "-pix_fmt yuv420p",
    "-preset superfast",
  ];

  if (options.videoFilters) {
    ffmpegOpt.push(`-vf "${options.videoFilters}"`);
  }

  ffmpegOpt.push("-y");
  ffmpegOpt.push("\"{AFX_STREAM_PATH}\\video.mp4\"");


  const commands = [
    "exec recorder",
    `host_framerate ${options.fps}`,
    `mirv_streams record fps "${options.fps}"`,
    `mirv_streams record name "${options.captureDir}"`,
    `mirv_streams settings edit ff options "${ffmpegOpt.join(" ").replace(/"/g, "{QUOTE}")}"`,
    `cl_draw_only_deathnotices ${options.fragmovie ? 1 : 0}`,
    `apply_crosshair_code ${options.crosshairCode}`,
    `cl_show_observer_crosshair ${options.useDemoCrosshair ? 2 : 0}`,
    "volume 0.5",
    `spec_lock_to_accountid ${playerId}`,
  ];

  for (const command of commands) {
    c.run(command);
    c.delta(8);
  }

  c.tick(startTick);
  c.run("mirv_streams record start");

  for (const [start, end] of skips) {
    c.tick(start);
    c.run("mirv_streams record end");
    c.run(`demo_gototick ${end}`);
    c.tick(end);
    c.run("mirv_streams record start");
  }

  c.tick(endTick);
  c.run("mirv_streams record end", "host_framerate 60");

  c.delta(options.tickrate * 0.5);
  c.run("disconnect");
  c.run("mirv_cmd clear");
  c.run(`echo ${options.unblockString}`);

  return c;
}
