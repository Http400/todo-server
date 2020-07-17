import { Router, Application } from 'express';

import IBaseController from './controllers/base.controller';

class ApiRouter {
    private apiRouter: Router;
    private controllers: IBaseController[];

    constructor(controllers: IBaseController[]) {
        this.apiRouter = Router();
        this.controllers = controllers;
    }

    init(app: Application) {
        for (let controller of this.controllers) {
            controller.init(this.apiRouter);
        }

        app.use('/api', this.apiRouter);
    }
}

export default ApiRouter;