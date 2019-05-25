'use strict';
const Assert = require('assert');
const Joi = require('joi');
const MongoModels = require('mongo-models');
const NewDate = require('joistick/new-date');
const moment = require('moment');


const schema = Joi.object({
    _id: Joi.object(),
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    contact: Joi.string().required(),
    currentLocation: Joi.string().required(),
    willingToRelocate: Joi.boolean().required(),
    visaStatus: Joi.string().required(),
    timeCreated: Joi.date().default(NewDate(), 'time of creation'),
    userId: Joi.string().required(),
    jobListingId: Joi.string().required(),
    resumeKey: Joi.string().required(),
    isRejected: Joi.boolean(),
    currentStatus: Joi.array()
});


class JobApplication extends MongoModels {
    static async create(fullName, email,
        contact, currentLocation, willingToRelocate, visaStatus, jobListingId, resumeKey, userId) {

        Assert.ok(fullName, 'Missing fullname argument');
        Assert.ok(email, 'Missing email argument');
        Assert.ok(contact, 'Missing contact argument');
        Assert.ok(currentLocation, 'Missing location argument');
        Assert.ok(willingToRelocate, 'Missing relocation argument');
        Assert.ok(visaStatus, 'Missing visa argument');
        Assert.ok(jobListingId, 'Missing job listing argument');
        Assert.ok(resumeKey, 'Missing resume key argument');

        const document = new this({
            fullName: fullName,
            email: email,
            contact: contact,
            currentLocation: currentLocation,
            willingToRelocate: willingToRelocate,
            visaStatus: visaStatus,
            jobListingId: jobListingId,
            resumeKey: resumeKey,
            userId: `${userId}`,
            isRejected: false
        });

        
        const jobapplications = await this.insertOne(document);
        return jobapplications[0];

    }

    static async getListByJobId(jobListingId){
        const applicants = await this.find({
            jobListingId: jobListingId
        });
        return applicants;
    }

    static async updateTheStatus(status, id){
        const success = await this.findByIdAndUpdate({_id:id},{$set:{$push:{
                status: status,
                    time: moment().utc()
                }}});
        return success;
    }
}


JobApplication.collectionName = 'jobApplications';
JobApplication.schema = schema;
JobApplication.indexes = [
    { key: { userId: 1 } },
    { key: { jobListingId: 1 } } 
]


module.exports = JobApplication;
