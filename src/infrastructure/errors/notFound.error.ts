import BaseError from "./_base.error";

export class NotFoundError extends BaseError {
    constructor(message: string, details?: { [key: string]: string }) {
        super(message, 404, details);
    }
}