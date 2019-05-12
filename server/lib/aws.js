const AWS = require('aws-sdk');


const s3 = new AWS.S3({
    accessKeyId: 'AKIAVL4NHKFF56MJX5HE',               //process.env.AWS_ACCESS_KEY,
    secretAccessKey:'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'                  //process.env.AWS_SECRET_KEY,
});



module.exports = {
    S3:s3
}



