import BaseError from "./_base.error";

export class UnauthorizedError extends BaseError {
    constructor(message: string, details?: { [key: string]: string }) {
        super(message, 401, details);
    }
}