'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Preware = require('../preware');
const JobListing = require('../models/job-listing');
const User = require('../models/user');


const register = function (server, serverOptions) {

    server.route({
        method: 'GET',
        path: '/api/job-listings',
        options: {
            tags: ['api','job-listings'],
            description: 'Get a paginated list of all job listings. [Admin Scope]',
            notes: 'Get a paginated list of all job listings.',
            auth: false,
            validate: {
                query: {
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1),
                    filter: Joi.alternatives().try(Joi.boolean(), Joi.object())
                }
            }
        },
        handler: async function (request, h) {

            const query = {};

            if(request.query.filter){

                const filter = request.query.filter;
                console.log('locations::::,',filter);
                if(filter.minimumExperience){
                    query.experience = {$lte:filter.minimumExperience}
                }

                if(filter.locations){
                    query.location = {$in:filter.locations}
                }
            }
            const limit = request.query.limit;
            const page = request.query.page;
            const options = {
                sort: JobListing.sortAdapter(request.query.sort)
            };

            return await JobListing.pagedFind(query, page, limit, options);
        }
    });


    server.route({
        method: 'POST',
        path: '/api/job-listings',
        options: {
            tags: ['api','job-listings'],
            description: 'Create a new job listing. [Admin Scope]',
            notes: 'Create a new job listing.',
            auth: {
                scope: 'admin'
            },
            pre: [
                Preware.requireAdminGroup('root')
            ],
            validate: {
                payload: {
                    jobTitle: Joi.string().required(),
                    location: Joi.string().required(),
                    description: Joi.string().required(),
                    experience: Joi.number().required()
                }
            }
        },
        handler: async function (request, h) {            
            
            const jobTitle = request.payload.jobTitle;
            const location = request.payload.location;
            const description = request.payload.description;
            const experience = request.payload.experience;
            const userId = request.auth.credentials.roles.admin._id;
            
            return await JobListing.create(jobTitle, location, description, experience, userId, false);
        }
    });


    server.route({
        method: 'GET',
        path: '/api/job-listings/{id}',
        options: {
            tags: ['api','job-listings'],
            description: 'Get a job-listing by ID. [Admin Scope]',
            notes: 'Get a job-listing by ID.',
            validate: {
                params: {
                    id : Joi.string().required().description('the id to get the joblisting')
                }
            },
            auth: false
        },
        handler: async function (request, h) {

            const joblisting = await JobListing.findById(request.params.id);

            if (!joblisting) {
                throw Boom.notFound('Joblisting not found.');
            }

            return joblisting;
        }
    });


    server.route({
        method: 'PUT',
        path: '/api/job-listings/{id}',
        options: {
            tags: ['api','job-listings'],
            description: 'Update a job-listing by ID. [Admin Scope]',
            notes: 'Update a job-listing by ID.',
            auth: {
                scope: 'admin'
            },
            pre: [
                Preware.requireAdminGroup('root')
            ],
            validate: {
                payload: {
                    jobTitle: Joi.string().required(),
                    location: Joi.string().required(),
                    description: Joi.string().required(),
                    experience: Joi.number().required(),
                    isClosed: Joi.boolean()
                },
                params: {
                    id : Joi.string().required().description('the id to update the job-listing')
                }
            }
        },
        handler: async function (request, h) {

            const id = request.params.id;
            const update = {
                $set: {
                    jobTitle: request.payload.jobTitle,
                    location: request.payload.location,
                    description: request.payload.description,
                    experience: request.payload.experience,
                    isClosed: request.payload.isClosed || false
                }
            };
            
            const joblisting = await JobListing.findByIdAndUpdate(id, update);

            if (!joblisting) {
                throw Boom.notFound('Joblisting not found.');
            }

            return joblisting;
        }
    });


    server.route({
        method: 'DELETE',
        path: '/api/job-listings/{id}',
        options: {
            tags: ['api','job-listings'],
            description: 'Delete a job-listing by ID. [Root Scope]',
            notes: 'Delete a job-listing by ID.',
            validate: {
                params: {
                    id : Joi.string().required().description('the id to delete the job-listing')
                }
            },
            auth: {
                scope: 'admin'
            },
            pre: [
                Preware.requireAdminGroup('root')
            ]
        },
        handler: async function (request, h) {

            const joblisting = await JobListing.findByIdAndDelete(request.params.id);

            if (!joblisting) {
                throw Boom.notFound('Job listings not found.');
            }

            return { message: 'Success.' };
        }
    });


    server.route({
        method: 'GET',
        path: '/api/job-listings/locations',
        options:{
            tags: ['api', 'job-listings', 'locations'],
            description: 'Returns list of locations where job available',
            validate:{
            },
            auth:false
        },
        handler: async function(request, h) {
            const locations = await JobListing.getOpenJobLocations();
            return locations;
        }
    })

    server.route({
        method:'GET',
        path:'/api/job-listings/job-titles',
        options:{
            auth:false
        },
        handler: async function(request, h){
            const jobTitles = await JobListing.find({isClosed:false},{
                projection:{
                    _id:-1,
                    jobId:1,
                    jobTitle:1,
                    location:-1,
                    description:-1,
                    userId:-1,
                    experience: -1
                }

            });
            return jobTitles;
        }
    })

};


module.exports = {
    name: 'api-job-listings',
    dependencies: [
        'auth',
        'hapi-auth-basic',
        'hapi-mongo-models'
    ],
    register
};
