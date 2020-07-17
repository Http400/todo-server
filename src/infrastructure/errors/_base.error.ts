import CustomError from '../../common/models/Error';

class BaseError extends Error implements CustomError {
    public code: number;
    public details?: { [key: string]: string };

    constructor(message: string, code: number, details?: { [key: string]: string }) {
        super(message);
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, BaseError);
    }
}

export default BaseError;