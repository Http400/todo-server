import { Request, Response} from 'express';

import BaseError from '../errors/_base.error';

class ErrorHandler {
    init(error: any, req: Request, res: Response, next: Function) {
        console.log(error.message);
        if (error instanceof BaseError) {
            res.status(error.code).send({ message: error.message, details: error.details });
        } else {
            res.status(500).send('An error occured.');
        }
    }
}

export default ErrorHandler;