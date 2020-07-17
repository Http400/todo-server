import BaseError from "./_base.error";

export class BadRequestError extends BaseError {
    constructor(message: string, details?: { [key: string]: string }) {
        super(message, 400, details);
    }
}