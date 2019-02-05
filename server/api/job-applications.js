'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Preware = require('../preware');
const JobApplication = require('../models/job-application');
const User = require('../models/user');


const register = function (server, serverOptions) {

    server.route({
        method: 'GET',
        path: '/api/job-applications',
        options: {
            tags: ['api','job-applications'],
            description: 'Get a paginated list of all job applications. [Admin Scope]',
            notes: 'Get a paginated list of all job applications.',
            auth: false,
            validate: {
                query: {
                    sort: Joi.string().default('_id'),
                    limit: Joi.number().default(20),
                    page: Joi.number().default(1)
                }
            }
        },
        handler: async function (request, h) {

            const query = {};
            const limit = request.query.limit;
            const page = request.query.page;
            const options = {
                sort: JobApplication.sortAdapter(request.query.sort)
            };

            return await JobApplication.pagedFind(query, page, limit, options);
        }
    });


    server.route({
        method: 'POST',
        path: '/api/job-applications',
        options: {
            tags: ['api','job-applications'],
            description: 'Create a new job application. [Admin Scope]',
            notes: 'Create a new job application.',
            auth: false,
            validate: {
                payload: {
                    fullName: Joi.string().required(),
                    email: Joi.string().email().required(),
                    contact: Joi.string().required(),
                    currentLocation: Joi.string().required(),
                    willingToRelocate: Joi.string(),
                    visaStatus: Joi.string().required(),
                    jobListingId: Joi.string().required()
                }
            }
        },
        handler: async function (request, h) {
            
            const fullName = request.payload.fullName;
            const email = request.payload.email;
            const contact = request.payload.contact;
            const currentLocation = request.payload.currentLocation;
            const willingToRelocate = request.payload.willingToRelocate;
            const visaStatus = request.payload.visaStatus;
            const jobListingId = request.payload.jobListingId;
            
            return await JobApplication.create(fullName, email, contact, currentLocation, willingToRelocate, visaStatus, jobListingId);
        }
    });


    server.route({
        method: 'GET',
        path: '/api/job-applications/{id}',
        options: {
            tags: ['api','job-applications'],
            description: 'Get a job-application by ID. [Admin Scope]',
            notes: 'Get a job-application by ID.',
            validate: {
                params: {
                    id : Joi.string().required().description('the id to get the job-application')
                }
            },
            auth: false
        },
        handler: async function (request, h) {

            const jobapplication = await JobApplication.findById(request.params.id);

            if (!jobapplication) {
                throw Boom.notFound('Jobapplication not found.');
            }

            return jobapplication;
        }
    });


    server.route({
        method: 'PUT',
        path: '/api/job-applications/{id}',
        options: {
            tags: ['api','job-applications'],
            description: 'Update a job-application by ID. [Admin Scope]',
            notes: 'Update a job-application by ID.',
            auth: false,
            validate: {
                payload: {
                    fullName: Joi.string().required(),
                    email: Joi.string().email().required(),
                    contact: Joi.string().required(),
                    currentLocation: Joi.string().required(),
                    willingToRelocate: Joi.string().required(),
                    visaStatus: Joi.string().required()
                },
                params: {
                    id : Joi.string().required().description('the id to update the job-application')
                }
            }
        },
        handler: async function (request, h) {

            const id = request.params.id;
            const update = {
                $set: {
                    fullName: request.payload.fullName,
                    email: request.payload.email,
                    contact: request.payload.contact,
                    currentLocation: request.payload.currentLocation,
                    willingToRelocate: request.payload.willingToRelocate,
                    visaStatus: request.payload.visaStatus
                }
            };
            
            const jobapplication = await JobApplication.findByIdAndUpdate(id, update);

            if (!jobapplication) {
                throw Boom.notFound('Jobapplication not found.');
            }

            return jobapplication;
        }
    });


    server.route({
        method: 'DELETE',
        path: '/api/job-applications/{id}',
        options: {
            tags: ['api','job-applications'],
            description: 'Delete a job-application by ID. [Root Scope]',
            notes: 'Delete a job-application by ID.',
            validate: {
                params: {
                    id : Joi.string().required().description('the id to delete the job-application')
                }
            },
            auth: false,
            // pre: [
            //     // Preware.requireAdminGroup('root')
            // ]
        },
        handler: async function (request, h) {

            const jobapplication = await JobApplication.findByIdAndDelete(request.params.id);

            if (!jobapplication) {
                throw Boom.notFound('Job application not found.');
            }

            return { message: 'Success.' };
        }
    });

};


module.exports = {
    name: 'api-job-applications',
    dependencies: [
        'auth',
        'hapi-auth-basic',
        'hapi-mongo-models'
    ],
    register
};
