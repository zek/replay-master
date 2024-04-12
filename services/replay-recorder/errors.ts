/* eslint-disable max-classes-per-file */
export class ConnectionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ConnectionError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends ConnectionError {
  constructor(message?: string) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SocketInitializationError extends ConnectionError {
  constructor(message?: string) {
    super(message);
    this.name = "SocketInitializationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}