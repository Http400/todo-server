import { Document, Schema } from 'mongoose';

import { IEntity } from './IEntity';
import { IUser } from './User';

interface ITask extends IEntity {
    title: string;
    description: string;
    user?: IUser | string;
    status?: Status;
    priority?: Priority;
    createdAt?: Date;
    updatedAt?: Date;
}

enum Status {
    Waiting,
    InProgress,
    Paused,
    Completed,
    Cancelled
};

enum Priority {
    Low,
    Medium,
    High,
    VeryHigh
};

interface ITaskModel extends ITask, Document {}

const taskSchema = new Schema({
    title: { type: String, required: '{PATH} is required!' },
    description: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: Number, default: 0 },
    priority: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre<ITaskModel>('save', function (next) {
    let now = new Date();
    this.updatedAt = now;
    if(!this.createdAt) {
        this.createdAt = now
    }
    next();
});

taskSchema.pre<ITaskModel>('update', function (next) {
    this.updatedAt = new Date();
    next();
});

export { ITask, Status, ITaskModel, taskSchema };