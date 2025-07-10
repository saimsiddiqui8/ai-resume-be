const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class UploadManager {
    constructor() {
        if (!UploadManager.instance) {
            UploadManager.instance = this;
        }
        return UploadManager.instance;
    }

    async upload({
        key,
        fileReference,
        contentType = 'application/octet-stream',
        acl = 'public-read',
        fileName,
        shouldChangeFileName = true,
    }) {
        return new Promise(async (resolve, reject) => {
            const hostAddress = `${process.env.SERVICE_URL}`;

            const uploadAddress = hostAddress + '/uploads/';
            const uuid = uuidv4();
            const fileExtension = path.extname(fileReference);
            let uploadKey;
            if (fileName && !shouldChangeFileName) {
                uploadKey = key ? `${key}/${fileName}` : fileName;
            } else {
                uploadKey = key ? `${key}/${uuid}${fileExtension}` : `${uuid}${fileExtension}`;
            }
            const uploadParams = {
                Bucket: process.env.CDN_BUCKET_NAME,
                Key: uploadKey,
                Body: fs.createReadStream(fileReference),
                ContentType: contentType,
                ACL: acl,
            };
            let s3;
            let isEnabled = true;
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: process.env.CDN_REGION,
                    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE || false,
                });
            } else {
                isEnabled = false;
                resolve({
                    Key: key,
                    Location: `${uploadAddress}${key}/${fileName}`,
                });
            }
            if (isEnabled) {
                try {
                    const response = await s3.upload(uploadParams).promise();
                    await fs.promises.unlink(fileReference);

                    if (response.Location && !response.Location.startsWith('https')) {
                        response.Location = 'https://' + response.Location;
                    }
                    resolve(response);
                } catch (err) {
                    console.error('Error uploading file:', err);
                    reject(false);
                }
            }
        });
    }

    async delete(fileUrl) {
        return new Promise(async (resolve, reject) => {
            const parts = fileUrl.split('/');

            // Get the last part of the URL
            const key = parts.slice(-2).join('/');
            const deleteParams = {
                Bucket: process.env.CDN_BUCKET_NAME,
                Key: key, // Provide the key for the file you want to delete
            };
            let s3;
            let isEnabled = true;
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: process.env.CDN_REGION,
                    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE || false,
                });
            } else {
                isEnabled = false;

                // Split the URL by '/'
                const urlParts = fileUrl.split('/');

                // Remove the protocol and empty element
                const pathParts = urlParts.slice(3);

                // Join the path parts back into a string
                const formattedPath = pathParts.join(`\\`);
                const temp = path.join(__dirname, '..');
                const temp2 = path.join(temp, formattedPath);
                await fs.promises.unlink(temp2);
                resolve({ message: 'File deleted successfully' });
            }
            if (isEnabled) {
                try {
                    await s3.deleteObject(deleteParams).promise();
                    resolve({ message: 'File deleted successfully' });
                } catch (err) {
                    console.error('Error deleting file:', err);
                    reject(false);
                }
            }
        });
    }

    async testCDN() {
        return new Promise(async (resolve, reject) => {
            if (!process.env.CDN_TYPE) {
                reject('CDN is not enabled. Test aborted');
                return;
            }
            let s3;
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: process.env.CDN_REGION,
                });
            }
            const uuid = uuidv4();
            const fileExtension = '.txt';
            const uploadKey = `${uuid}${fileExtension}`;
            const uploadParams = {
                Bucket: process.env.CDN_BUCKET_NAME,
                Key: uploadKey,
                Body: '',
                ContentType: 'text/plain',
                ACL: 'public-read',
            };
            s3.upload(uploadParams, (err, data) => {
                if (err) {
                    reject(`CDN Test failed: ${err.code}`);
                } else {
                    s3.deleteObject(
                        { Bucket: process.env.CDN_BUCKET_NAME, Key: uploadKey },
                        (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    cdn_bucket_name: process.env.CDN_BUCKET_NAME,
                                    cdn_type: process.env.CDN_TYPE,
                                });
                            }
                        },
                    );
                }
            });
        });
    }
}

module.exports = new UploadManager();
