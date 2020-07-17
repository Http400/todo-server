import { Document, Schema } from 'mongoose';

import { IEntity } from './IEntity';
import { ITask } from './Task';

interface IUser extends IEntity {
    username: string;
    hashedPassword: string;
    refreshToken?: string;
    tasks: Array<ITask | string>;
    accountType: AccountType;
}

enum AccountType {
    Normal,
    Demo
}

interface IUserModel extends IUser, Document {}

// class User implements IUser {
//     public name: string;

//     constructor(name: string) {
//         this.name = name;
//         const re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
//         if (!re.test(email))
//             throw new Error('Invalid email.');

//         this.email = email;
//     }
// }

const userSchema = new Schema({
    username: { type: String, unique: true, required: '{PATH} is required!', trim: true},
    hashedPassword: { type: String, required: '{PATH} is required!' },
    refreshToken: { type: String },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    accountType: { type: Number, default: 0 }
});

export { IUser, IUserModel, userSchema, AccountType };