import { writeFile } from "node:fs/promises";
import type { Command } from "./types";
import { create } from 'xmlbuilder2'; 
export default class HLAEScriptBuilder {
  private _tick: number;

  private _commands: Map<number, string[]>;

  constructor() {
    this._tick = 0;
    this._commands = new Map<number, string[]>();
  }

  tick(tick: number) {
    this._tick = tick;
  }

  delta(delta: number) {
    this._tick += delta;
  }

  run(...commands: string[]) {
    if (!this._commands.has(this._tick)) {
      this._commands.set(this._tick, []);
    }
		this._commands.get(this._tick)!.push(...commands);
  }

  skip(tick: number) {
    this.run(`demo_gototick ${tick}`);
  }

  async save(file: string) {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('commandSystem')
      .ele('commands');

    this._commands.forEach((commands, tick) => {
      commands.forEach(command => {
        doc.ele('c', { tick: tick.toString() }).txt(command);
      });
    });

    const xml = doc.end({ prettyPrint: true });
    await writeFile(file, xml);
  }


}
