import { TaskRepository } from "../data/repositories/task.repository";
import { ITask, ITaskModel, Status } from "../data/entities/Task";
import { NotFoundError } from "../errors/notFound.error";
import { BadRequestError } from "../errors/badRequest.error";
import { UnauthorizedError } from "../errors/unauthorized.error";
import { UserRepository } from "../data/repositories/user.repository";
import { IUser, IUserModel } from "../data/entities/User";
import PaginatedResults from '../../common/models/PaginatedResults';
import Task from '../../common/models/Task';

export class TaskService {
    private readonly taskRepository: TaskRepository;
    private readonly userRepository: UserRepository;

    constructor(taskRepository: TaskRepository, userRepository: UserRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // async get(query: any): Promise<ITaskModel[]> {
    //     return this.taskRepository.get(query);
    // }

    async getUserTasks(userId: string): Promise<ITaskModel[]> {
        return this.taskRepository.get({ user: userId });
    }

    async getUserPaginatedTasks(userId: string, page: number, pageSize: number, sortBy: string): Promise<PaginatedResults<Task>> {
        return this.taskRepository.getPaginated({ user: userId }, page, pageSize, sortBy);
    }

    async getSingleUserTask(id: string, userId: string): Promise<ITaskModel | null> {
        const task = await this.taskRepository.getById(id);

        if (task && task.user != userId) {
            console.log(typeof task.user);
            console.log(typeof userId);
            throw new UnauthorizedError('Unauthorized');
        }

        return task;
    }

    // async count(query: any): Promise<number> {
    //     return this.taskRepository.count(query);
    // }

    // async add(task: ITask): Promise<ITaskModel> {
    //     if (!task.title) {
    //         throw new BadRequestError('Task name is required.');
    //     }

    //     return this.taskRepository.add(task);
    // }

    // async update(task: ITask): Promise<ITaskModel> {
    //     return this.taskRepository.update(task);
    // }
    
    // async delete(id: string): Promise<ITaskModel | null> {
    //     const task = await this.taskRepository.getById(id);

    //     if (!task) {
    //         throw new NotFoundError('Task not found.');
    //     }

    //     return this.taskRepository.delete(task.id);
    // } 

    async add(task: ITask): Promise<ITaskModel> {
        if (!task.title) {
            throw new BadRequestError('Task name is required.');
        }

        let user: IUser = await this.userRepository.getById(task.user as string) as IUser;
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        user.tasks.push(task);

        const result = await Promise.all([ this.taskRepository.add(task), this.userRepository.update(user) ]);
        return result[0];
    }

    async update(task: ITask): Promise<ITaskModel> {
        if (!task.title) {
            throw new BadRequestError('Task name is required.');
        }
        
        return this.taskRepository.update(task);
    }

    async setStatus(taskId: string, status: Status): Promise<ITaskModel> {
        if (!taskId || !status) {
            throw new BadRequestError('Task id and status are required.');
        }

        let task = await this.taskRepository.getById(taskId);
        if (!task) {
            throw new NotFoundError('Task not found.');
        }

        task.status = status;
        return this.taskRepository.update(task);
    }

    async delete(taskId: string, userId: string): Promise<void> {
        const user = await this.userRepository.getById(userId as string);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        let taskIndex = user.tasks.indexOf(taskId);
        if (taskIndex > -1) {
            user.tasks.splice(taskIndex, 1);
        }

        await Promise.all([ this.userRepository.update(user), this.taskRepository.delete(taskId) ]);
    }
}