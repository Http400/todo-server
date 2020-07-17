import Express, { Application } from 'express'; 
import bodyParser from 'body-parser';
import compress from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import { cleanEnv, str, port } from 'envalid';

import ErrorHandler from './helpers/error.handler';
import ApiRouter from './api/apiRouter';
import { Database } from './data/database';
import { UserRepository } from './data/repositories/user.repository';
import { TaskRepository } from './data/repositories/task.repository';
import { UserService } from './services/user.service';
import { TaskService } from './services/task.service';
import AuthorizationController from './api/controllers/auth.controller';
import TaskController from './api/controllers/task.controller';

class Server {
    private readonly app: Application;
    private readonly errorHandler: ErrorHandler;
    private readonly router: ApiRouter;
    private readonly database: Database;
    private config: { [Key: string]: string } = {};

    constructor() {
        this.getConfiguration();
        this.app = Express();
        this.errorHandler = new ErrorHandler();
        this.database = new Database(this.config.DATABASE_URI);

        this.initExpressMiddleware();

        // Repositories
        const userRepository = new UserRepository(this.database);
        const taskRepository = new TaskRepository(this.database);

        // Services
        const userService = new UserService(userRepository, taskRepository, this.config.TOKEN_SECRET_KEY, this.config.REFRESH_TOKEN_SECRET_KEY);
        const taskService = new TaskService(taskRepository, userRepository);

        this.router = new ApiRouter([
            new AuthorizationController(userService, this.config.TOKEN_SECRET_KEY, this.config.REFRESH_TOKEN_SECRET_KEY),
            new TaskController(taskService, this.config.TOKEN_SECRET_KEY)
        ]);

        this.initRoutes();
        this.initCustomMiddleware();
    }

    private getConfiguration() {
        cleanEnv(process.env, {
            PORT: port()
        });

        dotenv.config({ path: __dirname + '/../../.env' });

        this.config = {
            PORT:                       <string> process.env.PORT,
            DATABASE_URI:               <string> process.env.DATABASE_URI,
            TOKEN_SECRET_KEY:           <string> process.env.TOKEN_SECRET_KEY,
            REFRESH_TOKEN_SECRET_KEY:   <string> process.env.REFRESH_TOKEN_SECRET_KEY
        };
    }

    private initExpressMiddleware() {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(compress());
        // this.app.use(cors({ origin: 'http://todo.pawelwojnarowski.com' }));
        this.app.use(cors());
    }

    private initRoutes() {
        this.router.init(this.app);
    }

    private initCustomMiddleware() {
        this.app.use(this.errorHandler.init);
    }

    public start() {
        const PORT = this.config.PORT;
        this.app.listen(PORT, () => {
            console.log(`Express server listening on port ${PORT}.`);
        });
    }
}

export default Server;