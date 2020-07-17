import { BaseRepository } from "./base.repository";
import { IUser, IUserModel, userSchema } from "../entities/User";
import { Database } from "../database";

export class UserRepository extends BaseRepository<IUser, IUserModel> {

    constructor(database: Database) {
        super(database, 'User', userSchema);
    }

    getById(_id: string): Promise<IUserModel | null> {
        return this.model.findById(_id).populate('tasks', '-__v').select('-__v').exec();
    }
}