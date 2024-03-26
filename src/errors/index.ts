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
export class UnauthorizedError extends APIError {
  constructor(public message: string) {
    super(message, 401);
  }
}

export class BadRequestError extends APIError {
  constructor(public message: string) {
    super(message, 400);
  }
}
