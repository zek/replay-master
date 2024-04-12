import { randomBytes } from "crypto";
import { EventEmitter } from "events";
import type { Socket } from "net";
import { connect } from "net";
import { ConnectionError, SocketInitializationError, TimeoutError } from "./errors";


export type LineCheck = (line: string) => boolean;

export default class SourceTelnet {
  private host: string;

  private port: number;

  private onConnectionLost: ((exception: Error) => void) | null = null;

  private checks: Map<LineCheck, EventEmitter> = new Map();

  private results: Map<LineCheck, string> = new Map();

  private assumedResolution: [number, number] = [1920, 1080];

  private socket: Socket | null = null;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  setConnectionLostCallback(callback: (exception: Error) => void): void {
    this.onConnectionLost = callback;
  }

  async connect(maxRetries = 5, retryInterval = 1000): Promise<void> {
    let retryCount = 0;

    return new Promise((resolve, reject) => {
      const attemptConnection = () => {
        const socket = connect(this.port, this.host, () => {
          this.socket = socket;
          this.readLoop().catch(err => {
            if (this.onConnectionLost) {
              this.onConnectionLost(err);
            }
          });
          resolve();
        });

        socket.on("error", err => {
          if (err.message.includes("ECONNREFUSED")) {
            if (retryCount < maxRetries) {
              setTimeout(attemptConnection, retryInterval);
              retryCount++;
            } else {
              reject(new ConnectionError("Max retries reached, connection failed."));
            }
          } else {
            reject(new ConnectionError(err.message));
          }
        });

        socket.on("close", () => {
          if (retryCount === 0) { // Only reject if no connection was ever made
            reject(new ConnectionError("Socket closed unexpectedly."));
          }
        });
      };

      attemptConnection();
    });
  }


  async waitFor(check: LineCheck, timeout: number = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      const event = new EventEmitter();
      this.checks.set(check, event);

      const timer = setTimeout(() => {
        this.checks.delete(check);
        reject(new TimeoutError(`Timeout waiting for response. Timeout: ${timeout}`));
      }, timeout);

      event.once("done", () => {
        clearTimeout(timer);
        this.checks.delete(check);
        resolve(this.results.get(check) || "");
        this.results.delete(check);
      });
    });
  }

  async waitForMany(checks: Record<string, LineCheck>, timeout: number = 60000): Promise<[string, string]> {
    return new Promise((resolve, reject) => {
      const event = new EventEmitter();
      const checker: LineCheck = (line: string): boolean => {
        for (const key of Object.keys(checks)) {
          if (checks[key](line)) {
            event.emit("done", key, line);
            return true;
          }
        }
        return false;
      };

      this.checks.set(checker, event);

      const timer = setTimeout(() => {
        this.checks.delete(checker);
        reject(new TimeoutError("Timeout waiting for response"));
      }, timeout);

      event.once("done", (matched, line) => {
        clearTimeout(timer);
        this.checks.delete(checker);
        resolve([matched, line]);
      });
    });
  }

  async run(command: string): Promise<string[]> {
    const startToken = randomBytes(16).toString("hex");
    const endToken = randomBytes(16).toString("hex");

    let listen = false;
    const output: string[] = [];

    const aggregator: LineCheck = (line: string) => {
      if (!listen && line.includes(startToken)) {
        listen = true;
      } else if (listen && line.includes(endToken)) {
        return true;
      } else if (listen) {
        output.push(line);
      }
      return false;
    };

    const task = this.waitFor(aggregator, 10000);

    console.log("Running command: ", command);
    await this.sendCommands(`echo ${startToken}`, command, `echo ${endToken}`);
    await task;

    return output;
  }

  async setResolution(width: number, height: number): Promise<void> {
    if (this.assumedResolution[0] !== width || this.assumedResolution[1] !== height) {
      await this.run(`mat_setvideomode ${width} ${height} 1`);
      this.assumedResolution = [width, height];
      await new Promise(resolve => {
        setTimeout(resolve, 12000);
      });
    }
  }

  async playDemo(demoName: string): Promise<void> {
    await this.run(`playdemo "${demoName}"`);
  }

  private async readLoop(): Promise<void> {
    if (!this.socket) {
      throw new SocketInitializationError("Socket not initialized");
    }

    this.socket.on("data", (data) => {
      const lines = data.toString().split("\r\n").filter(line => line.length > 0);
      lines.forEach(line => {
        const toRemove: LineCheck[] = [];
        this.checks.forEach((event, check) => {
          try {
            if (check(line)) {
              this.results.set(check, line);
              event.emit("done");
              toRemove.push(check);
            }
          } catch {
            toRemove.push(check);
          }
        });
        toRemove.forEach(remove => this.checks.delete(remove));
      });
    });

    this.socket.on("close", () => {
      const error = new Error("Connection lost to CSGO telnet server");
      this.checks.forEach(event => event.emit("done"));
      if (this.onConnectionLost) {
        this.onConnectionLost(error);
      }
    });
  }

  private async sendCommands(...commands: string[]): Promise<void> {
    if (!this.socket) {
      throw new SocketInitializationError("Socket not initialized");
    }

    const commandString = `${commands.join("\r\n")}\r\n`;
    this.socket.write(commandString);
  }
}