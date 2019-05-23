'use strict';
const Assert = require('assert');
const Joi = require('joi');
const MongoModels = require('mongo-models');
const NewDate = require('joistick/new-date');


const schema = Joi.object({
    _id: Joi.object(),
    jobId: Joi.string().required(),
    jobTitle: Joi.string().required(),
    location: Joi.string().required(),
    description: Joi.string().required(),
    timeCreated: Joi.date().default(NewDate(), 'time of creation'),
    userId: Joi.string().required(),
    experience: Joi.number().required(),
    isClosed: Joi.boolean()
});


class JobListing extends MongoModels {
    static async create(jobTitle, location, description, experience, userId, isClosed) {

        Assert.ok(jobTitle, 'Missing jobtitle argument.');
        Assert.ok(location, 'Missing location argument.');
        Assert.ok(description, 'Missing description argument.');
        Assert.ok(experience, 'Missing experience argument.');

        const document = new this({
            jobId: 'ENSHIRE' +( + new Date()),
            jobTitle: jobTitle,
            location: location,
            description: description,
            experience: experience,
            userId: `${userId}`,
            isClosed: isClosed || false
        });

        const joblistings = await this.insertOne(document);
        return joblistings[0];
    }

    static async getOpenJobLocations(){
        const locations = await this.distinct('location',{
            isClosed:false
        },{_id:-1,location:1})
        return locations;
    }
}


JobListing.collectionName = 'jobListings';
JobListing.schema = schema;
JobListing.indexes = [
    { key: { userId: 1 } }
];


module.exports = JobListing;
