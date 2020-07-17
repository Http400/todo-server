import { Response as ExpressResponse } from 'express';

interface Response<T> extends ExpressResponse {
    send: (body: T) => Response<T>;
}

export default Response;