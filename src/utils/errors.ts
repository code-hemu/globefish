export class GlobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlobError";
  }
}

export class PatternSyntaxError extends GlobError {
  constructor(message: string) {
    super(message);
    this.name = "PatternSyntaxError";
  }
}

export class WalkError extends GlobError {
  constructor(message: string) {
    super(message);
    this.name = "WalkError";
  }
}
