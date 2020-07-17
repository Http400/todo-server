import { Document, Schema, Model, Types } from 'mongoose';

import { Database } from "../database";
import { NotFoundError } from '../../errors/notFound.error';
import { BadRequestError } from '../../errors/badRequest.error';
import { IEntity } from '../entities/IEntity';

export abstract class BaseRepository<U extends IEntity, T extends Document & U> {
    private readonly database: Database;
    protected readonly model: Model<T, {}>;

    constructor(database: Database, schemaName: string, schema: Schema) {
        this.database = database;
        this.model = this.database.setModel<T>(schemaName, schema);
    }

    get(query: any): Promise<T[]> {
        return this.model.find(query).select('-__v').exec();
    }

    getById(_id: string): Promise<T | null> {
        return this.model.findById(_id).select('-__v').exec();
    }

    add(data: U): Promise<T> {
        return this.model.create(data);
    }

    update(data: U): Promise<T> {
        if( !Types.ObjectId.isValid(data._id) ) {
            throw new BadRequestError('Invalid Id argument.');
        }

        return this.model.findById(data._id).exec()
            .then((doc: U | null) => {
                if (doc === null) {
                    throw new NotFoundError('Data not found');
                }

                for (let property in data) {
                    doc[property] = data[property];
                }

                return (doc as T).save();
            }).then(savedData => {
                let result = savedData.toObject();
                delete result.__v;
                return result;
            });
    }

    count(query: any): Promise<number> {
        return this.model.countDocuments(query).exec();
    }

    delete(_id: string): Promise<T | null> {
        return this.model.findOneAndDelete({ _id: _id }).exec();
    }
    // dla kazdego modelu musi byc nadpisana
}