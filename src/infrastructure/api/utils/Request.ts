import { Request as ExpressRequest } from 'express';

interface Request<T, U = {}, S = {}> extends ExpressRequest {
    body: T;
    query: U;
    params: S;
}

export default Request;