import { Router, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import Request from '../utils/Request';
import Response from '../utils/Response';
import BaseController from "./base.controller";
import { TaskService } from '../../services/task.service';
import { BadRequestError } from '../../errors/badRequest.error';
import { NotFoundError } from '../../errors/notFound.error';
import PaginatedResults from '../../../common/models/PaginatedResults';
import Task from '../../../common/models/Task';
import { AccountType } from '../../data/entities/User';
import { ITask } from '../../data/entities/Task';

class TaskController extends BaseController {
    private readonly taskService: TaskService;
    private readonly url: string = '/tasks';

    constructor(taskService: TaskService, secretKey: string) {
        super(secretKey);
        this.taskService = taskService;
    }

    init(router: Router) {
        // router.get(this.url, this.verifyToken.bind(this), this.getUserTasks.bind(this));
        router.get(this.url, this.verifyToken.bind(this), this.getUserPaginatedTasks);
        router.get(this.url + '/:id', this.verifyToken.bind(this), this.getSingleUserTask);
        router.post(this.url, this.verifyToken.bind(this), this.addTask);
        router.put(this.url + '/:id', this.verifyToken.bind(this), this.updateTask);
        router.delete(this.url + '/:id', this.verifyToken.bind(this), /*this.verifyAccountType.bind(this, AccountType.Normal),*/ this.deleteTask);
    }

    // async getUserTasks(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const tasks: ITaskModel[] = await this.taskService.getUserTasks(res.locals.userId);
    //         res.send(tasks);
    //     } catch (error) {
    //         next(error);
    //     } 
    // }

    getUserPaginatedTasks = async (req: Request<undefined, { page?: string, pageSize?: string, sortBy?: string }>, res: Response<PaginatedResults<Task>>, next: NextFunction) => {
        try {
            req.query
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 5;
            const sortBy = req.query.sortBy || '';
            const paginatedTasks: PaginatedResults<Task> = await this.taskService.getUserPaginatedTasks(res.locals.userId, page, pageSize, sortBy);
            res.send(paginatedTasks);
        } catch (error) {
            next(error);
        }
    }

    getSingleUserTask = async (req: Request<undefined, undefined, { id: string }>, res: Response<Task | null>, next: NextFunction) => {
        try {
            const task: Task | null = await this.taskService.getSingleUserTask(req.params.id, res.locals.userId);
            res.send(task);
        } catch (error) {
            next(error);
        }
    }

    addTask = async (req: Request<Task>, res: Response<Task>, next: NextFunction) => {
        try {
            const task: ITask = {
                ...req.body,
                _id: new Types.ObjectId().toHexString(),
                user: res.locals.userId
            }
            const result = await this.taskService.add(task);
            res.status(201).send(result);
        } catch (error) {
            next(error);
        }
    }

    updateTask = async (req: Request<Task, undefined, { id: string }>, res: Response<Task>, next: NextFunction) => {
        try {
            console.log(req.body);
            const task: ITask = {
                ...req.body,
                _id: req.params.id
            };
            const result = await this.taskService.update(task);
            res.status(200).send(result);
        } catch (error) {
            next(error);
        }
    }

    deleteTask = async (req: Request<undefined, undefined, { id: string }>, res: Response<string>, next: NextFunction) => {
        try {
            await this.taskService.delete(req.params.id, res.locals.userId);
            res.status(200).send('Task has been removed');
        } catch (error) {
            next(error);
        }
    }
}

export default TaskController;