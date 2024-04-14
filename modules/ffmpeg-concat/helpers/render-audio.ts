import type { Log } from '../types/index';
import type { Scene } from '../types/internal';
import fsp from 'node:fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';

interface RenderAudioOpts {
  log: Log;
  scenes: Scene[];
  outputDir: string;
  fileName: string;
}

export const renderAudio = async (opts: RenderAudioOpts) => {
  const { log, scenes, outputDir, fileName } = opts;

  await fsp.mkdir(outputDir, { recursive: true });

  const concatListPath = path.join(outputDir, 'audioConcat.txt');
  const toConcat = scenes.filter((scene) => scene.sourceAudioPath).map((scene) => `file '${scene.sourceAudioPath}'`);
  const outputFileName = path.join(outputDir, fileName);

  // Write the content to the file
  await fsp.writeFile(concatListPath, toConcat.join('\n'));

  return new Promise<string>((resolve, reject) => {
    if (log) {
      log(`created ${concatListPath}`);
    }
    const cmd = ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .on('start', (cmd) => log && log(cmd))
      .on('end', () => resolve(outputFileName))
      .on('error', (err, stdout, stderr) => {
        if (err) {
          console.error('failed to concat audio', err, stdout, stderr);
        }
        reject(err);
      });
    cmd.save(outputFileName);
  });
};
