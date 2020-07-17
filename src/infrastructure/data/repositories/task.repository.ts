import { BaseRepository } from "./base.repository";
import { ITask, ITaskModel, taskSchema } from "../entities/Task";
import { Database } from "../database";
import PaginatedResults from '../../../common/models/PaginatedResults';

export class TaskRepository extends BaseRepository<ITask, ITaskModel> {

    constructor(database: Database) {
        super(database, 'Task', taskSchema);
    }

    get(query: any): Promise<ITaskModel[]> {
        return this.model.find(query).populate('user', '_id username').select('-__v').exec();
    }

    getPaginated(query: any, page: number, pageSize: number, sortBy?: string): Promise<PaginatedResults<ITaskModel>> {
        const sorting: any = {
            newest:    { createdAt: -1 },
            oldest:   { createdAt: 1 },
            lowestPriority:   { priority: 1 },
            highestPriority:  { priority: -1 },
        };

        return Promise.all([
            this.model.find(query)
                .select('-user')
                .sort(sortBy ? sorting[sortBy] : {})
                .skip(page * pageSize - pageSize)
                .limit(pageSize),
            this.model.count(query)
        ]).then(([results, count]) => {
            return {
                items: results,
                totalItems: count,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(count / pageSize)
            };
        });
    }
}