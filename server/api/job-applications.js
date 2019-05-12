'use strict';
const Boom = require('boom');
const Joi = require('joi');
const Preware = require('../preware');
const JobApplication = require('../models/job-application');
const User = require('../models/user');
const fs = require('fs');
const S3 = require('../lib/aws').S3;
const register = function (server, serverOptions) {

    server.route({
        method: 'GET',
        path: '/api/job-applications',
        options: {
            tags: ['api','job-applications'],
            description: 'Get a paginated list of all job applications. [Admin Scope]',
            notes: 'Get a paginated list of all job applications.',
            auth: { 
                scope: 'admin'
             },
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
            auth:false,
            // auth: {
            //     scope: 'account'
            // },
            validate: {
                payload: {
                    fullName: Joi.string().required(),
                    email: Joi.string().email().required(),
                    contact: Joi.string().required(),
                    currentLocation: Joi.string().required(),
                    willingToRelocate: Joi.string(),
                    visaStatus: Joi.string().required(),
                    jobListingId: Joi.string().required(),
                    resumeKey: Joi.string().required()
                }
            }
        },
        handler: async function (request, h) {
            console.log('request.auth.credentials:::::::',request.auth.credentials);
            const fullName = request.payload.fullName;
            const email = request.payload.email;
            const contact = request.payload.contact;
            const currentLocation = request.payload.currentLocation;
            const willingToRelocate = request.payload.willingToRelocate;
            const visaStatus = request.payload.visaStatus;
            const jobListingId = request.payload.jobListingId;
            const resumeKey = request.payload.resumeKey;
            const userId = request.auth.credentials ? request.auth.credentials.roles.account._id : null ;

            return await JobApplication.create(fullName, email, contact, currentLocation, willingToRelocate, visaStatus, jobListingId, resumeKey, userId);
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
            auth: { 
                scope: 'account'
            },
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
            auth: { 
                scope: 'account'
            },
            validate: {
                payload: {
                    fullName: Joi.string().required(),
                    email: Joi.string().email().required(),
                    contact: Joi.string().required(),
                    currentLocation: Joi.string().required(),
                    willingToRelocate: Joi.string().required(),
                    visaStatus: Joi.string().required(),
                    resumeKey: Joi.string().required()
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
            auth: { 
                scope: 'account'
            },
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

    server.route({
        method: 'POST',
        path: '/api/resumes/uploads',
        options: {
            payload: {
                output: 'stream',
                parse: true,
                allow: 'multipart/form-data',
                maxBytes: 2 * 1024 * 1024
            },
            auth: false
        },
        handler: async function (request, h) {
            var identifier = + Date.now()
            var filepath = __dirname +'/resumes/' + identifier + '/';
            fs.mkdirSync(filepath, { recursive: true });

            var result = await  S3.putObject({
                Bucket:'app.enshire.com',
                Key: identifier,
                Body: request.payload.file._data
            });
            console.log('Request:::::::');
            console.log(request.payload.file);
            return { file: request.payload.file.hapi.filename,
                         key: identifier,
                         url: 'https://s3.us-east-2.amazonaws.com/app.enshire.com/'+identifier,
                         message: 'Success.' }
            }


            // request.payload.file.pipe(fs.createWriteStream(
            //      filepath + request.payload.file.hapi.filename,
            //     {
            //         flags: 'a'
            //     }
            // ));


            // return { file: request.payload.file.hapi.filename,
            //          key: identifier,
            //          url: 'https://s3.us-east-2.amazonaws.com/app.enshire.com/'+identifier,
            //          message: 'Success.' }

    });

    server.route({
        method: 'GET',
        path: '/api/job-applications/{id}/resume',
        options: {
            tags: ['api', 'resumes'],
            validate: {
                params: {
                    id: Joi.string().required().description('the id of the job-application to get resume')
                }
            },
            auth: { 
                scope: 'account'
            },
        }, 
        handler: async function (request, h) {
            // console.log(request.params.id);
            // const jobapplication = await JobApplication.findById(request.params.id);

            // return h.file(__dirname + '/resumes/1550763603011/*.pdf');
        }

    })

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
