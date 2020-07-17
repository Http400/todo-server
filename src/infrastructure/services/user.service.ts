import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { UserRepository } from "../data/repositories/user.repository";
import { TaskRepository } from "../data/repositories/task.repository";
import { IUser, IUserModel, AccountType } from "../data/entities/User";
import { NotFoundError } from "../errors/notFound.error";
import { BadRequestError } from "../errors/badRequest.error";

export class UserService {
    private readonly userRepository: UserRepository;
    private readonly taskRepository: TaskRepository;
    private readonly authTokenSecretKey: string;
    private readonly refreshTokenSecretKey: string; 

    constructor(userRepository: UserRepository, taskRepository: TaskRepository, authTokenSecretKey: string, refreshTokenSecretKey: string) {
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.authTokenSecretKey = authTokenSecretKey;
        this.refreshTokenSecretKey = refreshTokenSecretKey;
    }

    // async get(query: any): Promise<IUserModel[]> {
    //     return this.userRepository.get(query);
    // }

    // async getById(id: string): Promise<IUserModel | null> {
    //     return this.userRepository.getById(id);
    // }

    // async count(query: any): Promise<number> {
    //     return this.userRepository.count(query);
    // }

    // async add(user: IUser): Promise<IUserModel> {
    //     if (!user.username) {
    //         throw new BadRequestError('User name is required.');
    //     }

    //     return this.userRepository.add(user);
    // }

    // async update(user: IUser): Promise<IUserModel> {
    //     return this.userRepository.update(user);
    // }
    
    // async delete(id: string): Promise<any[]> {
    //     const user = await this.userRepository.getById(id);

    //     if (!user) {
    //         throw new NotFoundError('User not found.');
    //     }

    //     let promises: Promise<any>[] = [ this.userRepository.delete(user.id) ];

    //     for (let taskId of user.tasks) {
    //         promises.push( this.taskRepository.delete(taskId as string) );
    //     }

    //     return Promise.all(promises);
    // }

    async register(username: string, password: string): Promise<IUserModel> {
        if (!username || !password) {
            throw new BadRequestError('Username and password are required.');
        }

        const isUsernameTaken = await this.userRepository.count({ username }) > 0;
        
        if (isUsernameTaken) {
            throw new BadRequestError('This username is already taken.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return this.userRepository.add({ 
            _id: new Types.ObjectId().toHexString(), 
            username,
            hashedPassword,
            tasks: [],
            accountType: 0
        });
    }

    async login(username: string, password: string): Promise<{ authToken: string, refreshToken: string }> {
        if (!username || !password) {
            throw new BadRequestError('Username and password are required.');
        }

        const user = ( await this.userRepository.get({ username }) )[0];

        if (!user) {
            throw new NotFoundError('User not found.', { username: 'User not found.' });
        }

        let isPasswordValid = bcrypt.compareSync(password, user.hashedPassword);
        if (!isPasswordValid)
            throw new BadRequestError('Password is not valid.', { password: 'Password is not valid.' });

        const authToken = jwt.sign({ id: user._id, username: user.username, accountType: user.accountType }, this.authTokenSecretKey, {
            expiresIn: 1800
        });

        const refreshToken = jwt.sign({ id: user._id, username: user.username }, this.refreshTokenSecretKey, { 
            expiresIn: 86400
        });

        user.refreshToken = refreshToken;
        await this.userRepository.update(user);

        return { authToken, refreshToken };
    }

    async refreshToken(userId: string, refreshToken: string): Promise<string> {
        if (!userId || !refreshToken) {
            throw new BadRequestError('User id and refresh token are required.');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        if (user.refreshToken !== refreshToken) {
            throw new BadRequestError('Invalid refresh token.');
        }

        const token = jwt.sign({ id: user._id, username: user.username }, this.authTokenSecretKey, {
            expiresIn: 1800
        });

        return token;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        if (!userId) {
            throw new BadRequestError('User id is required.');
        }

        if (!currentPassword || !newPassword) {
            throw new BadRequestError('Current password and new password are required.');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        let isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.hashedPassword);
        if (!isCurrentPasswordValid) {
            throw new BadRequestError('Current password is not valid.', { currentPassword: 'Current Password is not valid.' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        user.hashedPassword = newHashedPassword;
        await this.userRepository.update(user);
    }

    async changeAccountType(userId: string, accountType: AccountType): Promise<void> {
        if (!userId || !accountType) {
            throw new BadRequestError('User id and account type are required.');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) {
            throw new NotFoundError('User not found.');
        }

        user.accountType = accountType;
        await this.userRepository.update(user);
    }
}