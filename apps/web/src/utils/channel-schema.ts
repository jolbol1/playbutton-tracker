export class ViewStatsError extends Error {
  readonly details?: unknown;
  readonly status: number;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ViewStatsError";
    this.status = status;
    this.details = details;
  }
}
