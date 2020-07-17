"use strict";
exports.__esModule = true;
var mongoose_1 = require("mongoose");
var notFound_error_1 = require("../../errors/notFound.error");
var badRequest_error_1 = require("../../errors/badRequest.error");
var BaseRepository = /** @class */ (function () {
    function BaseRepository(database, schemaName, schema) {
        this.database = database;
        this.model = this.database.setModel(schemaName, schema);
    }
    BaseRepository.prototype.get = function (query) {
        return this.model.find(query).select('-__v').exec();
    };
    BaseRepository.prototype.getById = function (_id) {
        return this.model.findById(_id).select('-__v').exec();
    };
    BaseRepository.prototype.add = function (data) {
        return this.model.create(data);
    };
    BaseRepository.prototype.update = function (data) {
        if (!mongoose_1.Types.ObjectId.isValid(data._id)) {
            throw new badRequest_error_1.BadRequestError('Invalid Id argument.');
        }
        return this.model.findById(data._id).exec()
            .then(function (doc) {
            if (doc === null) {
                throw new notFound_error_1.NotFoundError('Data not found');
            }
            for (var property in data) {
                doc[property] = data[property];
            }
            return doc.save();
        }).then(function (savedData) {
            var result = savedData.toObject();
            delete result.__v;
            return result;
        });
    };
    BaseRepository.prototype.count = function (query) {
        return this.model.countDocuments(query).exec();
    };
    BaseRepository.prototype["delete"] = function (_id) {
        return this.model.findOneAndDelete({ _id: _id }).exec();
    };
    return BaseRepository;
}());
exports.BaseRepository = BaseRepository;
