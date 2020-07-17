import { Database } from "../../src/infrastructure/data/database";
import { UserRepository } from "../../src/infrastructure/data/repositories/user.repository";
import { TaskRepository } from "../../src/infrastructure/data/repositories/task.repository";
import { UserService } from "../../src/infrastructure/services/user.service";

import * as jwt from 'jsonwebtoken';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { mock, instance } from 'ts-mockito';
import { BadRequestError } from "../../src/infrastructure/errors/badRequest.error";
import { NotFoundError } from "../../src/infrastructure/errors/notFound.error";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('User service', () => {
    let database: Database;
    let userRepository: UserRepository;
    let taskRepository: TaskRepository;
    let userService: UserService;
    const authTokenSecretKey: string = 'secret';
    const refreshTokenSecretKey: string = 'secret2';

    before(() => {
        console.log('before');

        database = new Database('mongodb://mo1018_todo-test:akEuNYEc9i3VEKt4a5UE@mongo25.mydevil.net:27017/mo1018_todo-test');
        userRepository = new UserRepository(database);
        taskRepository = new TaskRepository(database);
        userService = new UserService(userRepository, taskRepository, authTokenSecretKey, refreshTokenSecretKey);
    });


    after(() => {
        console.log('after');
        database.disconnect();
    });

    // it('should get users', async () => {

    //     const users = await userService.get({});
    //     // console.log(users);
    // });

    context('register', () => {

        describe('successful registering', () => {
            after( async () => {
                const users = await userRepository.get({ username: 'John Doe' });
    
                for (let user of users) {
                    await userRepository.delete(user._id);
                }
            });
    
            it('should create new user without error', async () => {
                const user = await userService.register('John Doe', 'password');
    
                expect(user._id.toString()).to.be.a('string');
                expect(user._id).to.not.be.empty;
                expect(user.username).to.be.a('string');
                expect(user.username).to.equal('John Doe');
                expect(user.tasks).to.be.an('array').that.is.empty;
            });
        });

        describe('unsuccessful registering because of invalid input data', () => {
            it('should throw a bad request error - username required', async () => {
                await expect(userService.register('', 'password')).to.be.rejectedWith(BadRequestError, 'Username and password are required.');
            });

            it('should throw a bad request error - password required', async () => {
                await expect(userService.register('John Doe', '')).to.be.rejectedWith(BadRequestError, 'Username and password are required.');
            });
        });
        
        describe('unsuccessful registering because of not unique username', () => {
            before( async() => {
                await userService.register('John Doe', 'password');
            });

            after( async () => {
                const users = await userRepository.get({ username: 'John Doe' });
    
                for (let user of users) {
                    await userRepository.delete(user._id);
                }
            });

            it('shoud throw a bad request error - username taken', async () => {
                await expect(userService.register('John Doe', 'password')).to.be.rejectedWith(BadRequestError, 'This username is already taken.');
            });
        });

    });

    context('login', () => {

        before( async () => {
            await userService.register('John Doe', 'password');
        });

        after( async () => {
            const users = await userRepository.get({ username: 'John Doe' });

            for (let user of users) {
                await userRepository.delete(user._id);
            }
        });

        describe('successful login', () => {
            it('should login without error', async () => {
                const { authToken, refreshToken } = await userService.login('John Doe', 'password');

                expect(authToken).to.not.be.empty;
                expect(authToken).to.be.a('string');
                expect(refreshToken).to.not.be.empty;
                expect(refreshToken).to.be.a('string');
            });
        });
        
        describe('unsuccessful login', () => {
            it('shoud throw a bad request error - password is not valid', async () => {
                await expect(userService.login('John Doe', 'password412423')).to.be.rejectedWith(BadRequestError, 'Password is not valid.');
            });

            it('shoud throw user not found error', async () => {
                await expect(userService.login('James Doe', 'password')).to.be.rejectedWith(NotFoundError, 'User not found.');
            });

            it('shoud throw a bad request error - username required', async () => {
                await expect(userService.login('John Doe', '')).to.be.rejectedWith(BadRequestError, 'Username and password are required.');
            });

            it('shoud throw a bad request error - password required', async () => {
                await expect(userService.login('', 'password')).to.be.rejectedWith(BadRequestError, 'Username and password are required.');
            });
        });

    });

    context('refresh token', () => {
        let authToken: string; let refreshToken: string;

        before( async () => {
            await userService.register('John Doe', 'password');
            const result = await userService.login('John Doe', 'password');
            authToken = result.authToken;
            refreshToken = result.refreshToken;
        });

        after( async () => {
            const users = await userRepository.get({ username: 'John Doe' });

            for (let user of users) {
                await userRepository.delete(user._id);
            }
        });

        describe('successful refresh token', () => {
            it('should refresh token without errors', async () => {
                const decoded = jwt.decode(authToken);
                const userId = decoded !== null && typeof decoded === 'object' ? decoded['id'] : '';
                const newAuthToken = await userService.refreshToken(userId, refreshToken);

                expect(newAuthToken).to.not.be.empty;
                expect(newAuthToken).to.be.a('string');
            });
        });

        describe('unsuccessful refresh token', () => {
            it('should throw a bad request error - user id required', async () => {
                await expect(userService.refreshToken('', 'refreshToken')).to.be.rejectedWith(BadRequestError, 'User id and refresh token are required.');
            });

            it('should throw a bad request error - refresh token required', async () => {
                await expect(userService.refreshToken('userId', '')).to.be.rejectedWith(BadRequestError, 'User id and refresh token are required.');
            });

            it('should throw user not found error', async () => {
                await expect(userService.refreshToken('5d3576f39c0de60932890992', 'refreshToken')).to.be.rejectedWith(NotFoundError, 'User not found.');
            });
        });
    });

    context('change password', () => {
        const username: string = 'John Doe';
        const password: string = 'password';
        let userId: string;

        before( async () => {
            await userService.register(username, password);
            const result = await userService.login(username, password);
            const decoded = jwt.decode(result.authToken);
            userId = decoded !== null && typeof decoded === 'object' ? decoded['id'] : '';
        });

        after( async () => {
            const users = await userRepository.get({ username });

            for (let user of users) {
                await userRepository.delete(user._id);
            }
        });

        describe('successful change password', () => {
            it('should change password without errors', async () => {
                await expect(userService.changePassword(userId, password, 'newPassword')).to.be.fulfilled;
            });
        });

        describe('unsuccessful change password', () => {
            it('should throw a bad request error - user id required', async () => {
                await expect(userService.changePassword('', password, 'newPassword')).to.be.rejectedWith(BadRequestError, 'User id is required.');
            });

            it('should throw a bad request error - current password required', async () => {
                await expect(userService.changePassword(username, '', 'newPassword')).to.be.rejectedWith(BadRequestError, 'Current password and new password are required.');
            });

            it('should throw a bad request error - new password required', async () => {
                await expect(userService.changePassword(username, password, '')).to.be.rejectedWith(BadRequestError, 'Current password and new password are required.');
            });

            it('should throw user not found error', async () => {
                await expect(userService.changePassword('5d3576f39c0de60932890992', password, 'newPassword')).to.be.rejectedWith(NotFoundError, 'User not found.');
            });

            it('should throw a bad request error - current password invalid', async () => {
                await expect(userService.changePassword(userId, 'invalidPassword', 'newPassword')).to.be.rejectedWith(BadRequestError, 'Current password is not valid.');
            });
        });
    });

    // context('create user', () => {
    //     after( async () => {
    //         const users = await userService.get({ name: 'John Doe' });

    //         for (let user of users) {
    //             await userService.delete(user._id);
    //         }
    //     });

    //     it('should create new user', async () => {
    //         const data: IUser = {
    //             _id: new Types.ObjectId().toHexString(),
    //             username: 'John Doe',
    //             hashedPassword: '',
    //             tasks: []
    //         };

    //         const user = await userService.add(data);

    //         expect(user._id.toString()).to.be.a('string');
    //         expect(user._id).to.not.be.empty;
    //         expect(user.username).to.be.a('string');
    //         expect(user.username).to.equal('John Doe');
    //         expect(user.tasks).to.be.an('array').that.is.empty;
    //     });

    //     it('should throw a bad request error', async () => {
    //         const data: IUser = {
    //             _id: new Types.ObjectId().toHexString(),
    //             username: '',
    //             hashedPassword: '',
    //             tasks: []
    //         };

    //         await expect(userService.add(data)).to.be.rejectedWith(BadRequestError);
    //     });
    // });

     

});