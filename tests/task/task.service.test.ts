import { Database } from "../../src/infrastructure/data/database";
import { UserRepository } from "../../src/infrastructure/data/repositories/user.repository";
import { TaskRepository } from "../../src/infrastructure/data/repositories/task.repository";
import { TaskService } from "../../src/infrastructure/services/task.service";
import { UserService } from "../../src/infrastructure/services/user.service";

import { Types } from "mongoose";
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { mock, instance } from 'ts-mockito';
import { BadRequestError } from "../../src/infrastructure/errors/badRequest.error";
import { NotFoundError } from "../../src/infrastructure/errors/notFound.error";
import { ITask, Status } from "../../src/infrastructure/data/entities/Task";
import { ObjectID } from "bson";
import { IUser, IUserModel } from "../../src/infrastructure/data/entities/User";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Task service', () => {
    let database: Database;
    let userRepository: UserRepository;
    let taskRepository: TaskRepository;
    let userService: UserService;
    let taskService: TaskService;
    const authTokenSecretKey: string = 'secret';
    const refreshTokenSecretKey: string = 'secret2';
    const username: string = 'John Doe';
    const password: string = 'password';
    let user: IUser;
    let userId: string;

    before( async () => {
        console.log('before');

        database = new Database('mongodb://mo1018_todo-test:akEuNYEc9i3VEKt4a5UE@mongo25.mydevil.net:27017/mo1018_todo-test');
        userRepository = new UserRepository(database);
        taskRepository = new TaskRepository(database);
        userService = new UserService(userRepository, taskRepository, authTokenSecretKey, refreshTokenSecretKey);
        taskService = new TaskService(taskRepository, userRepository);
        user = await userService.register(username, password);
        userId = user._id;
    });

    after( async () => {
        const users = await userRepository.get({ username });
        for (let user of users) {
            await userRepository.delete(user._id);
        }

        const tasks = await taskRepository.get({ user: userId });
        for (let task of tasks) {
            await taskRepository.delete(task._id);
        }

        database.disconnect();
    });

    context('get tasks', async () => {
        before( async () => {
            const tasks = [
                {
                    _id: new Types.ObjectId().toHexString(),
                    title: 'Test task 1',
                    description: 'Some task 1 description',
                    user: userId
                },
                {
                    _id: new Types.ObjectId().toHexString(),
                    title: 'Test task 2',
                    description: 'Some task 2 description',
                    user: userId
                }
            ];

            let promises = [];

            for (let t of tasks) {
                promises.push(taskRepository.add(t));
            }

            await Promise.all(promises);
        });

        after( async () => {
            let u = await userRepository.getById(userId) as IUserModel;
            u.tasks = [];
            let tasks = await taskRepository.get({});
            let promises: Promise<any>[] = [ userRepository.update(u) ];
            for (let t of tasks) {
                promises.push( taskRepository.delete(t.id) );
            }
            await Promise.all(promises);
        });

        describe('successful get tasks', () => {
            it('should get tasks withour errors', async () => {
                const tasks = await taskService.getUserTasks(userId);

                expect(tasks).to.have.lengthOf(2);
                expect((tasks[0].user as IUser)._id.equals(userId)).to.be.true;
                expect((tasks[1].user as IUser)._id.equals(userId)).to.be.true;
            });
        });
    });

    context('add task', async () => {
        describe('successful add task', () => {
            let t: ITask;

            after( async () => {
                await taskRepository.delete(t._id);
            });

            it('should add task without errors', async () => {
                t = {
                    _id: new Types.ObjectId().toHexString(),
                    title: 'Test task',
                    description: 'Some task description',
                    user: userId
                };
        
                const task = await taskService.add(t);
                expect(task._id instanceof ObjectID).to.be.true;
                expect(task._id).to.not.be.empty;
                expect(task.title).to.be.a('string');
                expect(task.title).to.equal('Test task');
                expect(task.description).to.be.a('string');
                expect(task.description).to.equal('Some task description');
                expect(task.user instanceof ObjectID).to.be.true;
                expect(task.user).to.equal(userId);
                expect(task.status).to.be.not.null;
                expect(task.status).to.equal(0);
            });
        });

        describe('unsuccessful add task', () => {
            it('should throw a bad request error - title required', async () => {
                const task: ITask = {
                    _id: new Types.ObjectId().toHexString(),
                    title: '',
                    description: 'Some task description',
                    user: userId
                };
                
                await expect(taskService.add(task)).to.be.rejectedWith(BadRequestError, 'Task name is required.');
            });
        });
    });

    context('update task', async () => {
        let task: ITask;

        before( async() => {
            const t: ITask = {
                _id: new Types.ObjectId().toHexString(),
                title: 'Test task',
                description: 'Some task description',
                user: userId
            };
    
            task = await taskRepository.add(t);
        });

        after( async() => {
            await taskRepository.delete(task._id);
        });

        describe('successful update task', () => {
            it('should update task without errors', async () => {
                task.title = 'Updated task title';
                task.description = 'Updated task description';

                const updatedTask = await taskService.update(task);
                
                expect(updatedTask.title).to.be.a('string');
                expect(updatedTask.title).to.equal('Updated task title');
                expect(updatedTask.description).to.be.a('string');
                expect(updatedTask.description).to.equal('Updated task description');
                expect(updatedTask.user instanceof ObjectID).to.be.true;
                expect(updatedTask.user).to.equal(userId);
            });

            it('should update task status without errors', async () => {
                const updatedTask = await taskService.setStatus(task._id, Status.InProgress);

                expect(updatedTask.status).to.equal(Status.InProgress);
            });
        });

        describe('unsuccessful update task', () => {
            it('should throw a bad request error - title required', async () => {
                task.title = '';
                
                await expect(taskService.update(task)).to.be.rejectedWith(BadRequestError, 'Task name is required.');
            });
        });
    });

    context('delete task', () => {
        describe('successful delete task', () => {
            it('should delete task without errors', async () => {
                const t: ITask = {
                    _id: new Types.ObjectId().toHexString(),
                    title: 'Test task',
                    description: 'Some task description',
                    user: userId
                };

                const addedTask = await taskService.add(t);
                await taskService.delete(addedTask.id, userId);
                const userAfterDeleteTask = await userRepository.getById(userId) as IUserModel;

                expect(userAfterDeleteTask.tasks).to.be.an('array').that.is.empty;
            });
        });
    });
});