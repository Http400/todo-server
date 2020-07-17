"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var base_repository_1 = require("./base.repository");
var Task_1 = require("../entities/Task");
var TaskRepository = /** @class */ (function (_super) {
    __extends(TaskRepository, _super);
    function TaskRepository(database) {
        return _super.call(this, database, 'Task', Task_1.taskSchema) || this;
    }
    TaskRepository.prototype.get = function (query) {
        return this.model.find(query).populate('user', '_id username').select('-__v').exec();
    };
    TaskRepository.prototype.getPaginated = function (query, page, pageSize, sortBy) {
        var sorting = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            lowestPriority: { priority: 1 },
            highestPriority: { priority: -1 }
        };
        return Promise.all([
            this.model.find(query)
                .sort(sortBy ? sorting[sortBy] : {})
                .skip(page * pageSize - pageSize)
                .limit(pageSize),
            this.model.count(query)
        ]).then(function (_a) {
            var results = _a[0], count = _a[1];
            return {
                items: results,
                totalItems: count,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(count / pageSize)
            };
        });
    };
    return TaskRepository;
}(base_repository_1.BaseRepository));
exports.TaskRepository = TaskRepository;
