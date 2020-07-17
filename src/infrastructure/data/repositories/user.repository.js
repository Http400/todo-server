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
var User_1 = require("../entities/User");
var UserRepository = /** @class */ (function (_super) {
    __extends(UserRepository, _super);
    function UserRepository(database) {
        return _super.call(this, database, 'User', User_1.userSchema) || this;
    }
    UserRepository.prototype.getById = function (_id) {
        return this.model.findById(_id).populate('tasks', '-__v').select('-__v').exec();
    };
    return UserRepository;
}(base_repository_1.BaseRepository));
exports.UserRepository = UserRepository;
