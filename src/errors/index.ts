export class APIError extends Error {
  status: number;
  constructor(
    public message: string,
    status: number,
  ) {
    super(message);
    this.status = status;
  }
}

export class NotFoundError extends APIError {
  constructor(public message: string) {
    super(message, 404);
  }
}
