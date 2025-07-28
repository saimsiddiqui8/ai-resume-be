import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';



class UploadManager {
    constructor() {
        if (!UploadManager.instance) {
            UploadManager.instance = this;
        }
        return UploadManager.instance;
    }

    async upload({ key, fileReference, contentType = 'application/octet-stream', acl = 'public-read', fileName, shouldChangeFileName = true }) {
        return new Promise(async (resolve, reject) => {
            const hostAddress = `${process.env.SERVICE_URL}/`;

            console.log(`fileName`,fileName)

            const uploadAddress = hostAddress + "uploads/";
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
                // ACL: acl
            };
            let s3;
            let isEnabled = true;
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: 'US East (Ohio) us-east-2',
                    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE || false
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
                    // console.log(fileReference, "FILEREF ++++++++++++++++++++");
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





    async delete(filesUrls) {
        return new Promise(async (resolve, reject) => {
            // Ensure the input is an array of URLs
            if (!Array.isArray(filesUrls)) {
                return reject(new Error('Input must be an array of URLs'));
            }
    
            let s3;
            let isEnabled = process.env.CDN_TYPE === 'aws';
            if (isEnabled) {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: 'US East (Ohio) us-east-2',
                    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE || false
                });
            }
    
            try {
                const results = [];
                for (const fileUrl of filesUrls) {
                    if (typeof fileUrl !== 'string') {
                        results.push({ url: fileUrl, status: 'error', message: 'fileUrl is not a string' });
                        continue;
                    }
                    const parts = fileUrl.split('/');
                    const key = parts.slice(-2).join('/');
    
                    if (isEnabled) {
                        const deleteParams = {
                            Bucket: process.env.CDN_BUCKET_NAME,
                            Key: key
                        };
                        try {
                            await s3.deleteObject(deleteParams).promise();
                            results.push({ url: fileUrl, status: 'success', message: 'File deleted successfully' });
                        } catch (err) {
                            console.error('Error deleting file:', err);
                            results.push({ url: fileUrl, status: 'error', message: 'Error deleting file' });
                        }
                    } else {
                        // Split the URL by '/'
                        const urlParts = fileUrl.split('/');
                        // Remove the protocol and empty element
                        const pathParts = urlParts.slice(3);
                        // Join the path parts back into a string
                        const formattedPath = pathParts.join(`\\`);
                        const temp = path.join(__dirname, '..');
                        const temp2 = path.join(temp, formattedPath);
    
                        try {
                            await fs.promises.unlink(temp2);
                            results.push({ url: fileUrl, status: 'success', message: 'File deleted successfully' });
                        } catch (err) {
                            console.error('Error deleting file:', err);
                            results.push({ url: fileUrl, status: 'error', message: 'Error deleting file' });
                        }
                    }
                }
                resolve(results);
            } catch (err) {
                reject(err);
            }
        });
    }
    

    async update(fileUrls) {
        return new Promise(async (resolve, reject) => {
            let s3;
            let isEnabled = true;
    
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: 'us-east-2',
                    s3ForcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE || false
                });
            } else {
                isEnabled = false;
                return reject({ message: 'CDN_TYPE is not AWS' });
            }
    
            if (isEnabled) {
                try {
                    const updatePromises = fileUrls.map(async (file) => {
                        const { oldUrl, newUrl, metadata } = file;
    
                        // Parse URLs to get the keys
                        const oldParts = oldUrl.split('/');
                        const oldKey = oldParts.slice(-1)[0]; // Extract filename from oldUrl
    
                        // Delete the old object
                        const deleteParams = {
                            Bucket: process.env.CDN_BUCKET_NAME,
                            Key: oldKey
                        };
                        await s3.deleteObject(deleteParams).promise();
    
                        // Upload the new file
                        const newParts = newUrl.split('/');
                        const newKey = newParts.slice(-1)[0]; // Extract filename from newUrl
                        const uploadParams = {
                            Bucket: process.env.CDN_BUCKET_NAME,
                            Key: newKey,
                            Metadata: metadata
                        };
                        await s3.upload(uploadParams).promise();
                    });
    
                    await Promise.all(updatePromises);
                    resolve({ message: 'Files updated successfully' });
                } catch (err) {
                    console.error('Error updating files:', err);
                    reject(false);
                }
            }
        });
    }
    
    

    async testCDN() {
        console.log({
            type: process.env.CDN_TYPE,
            region:'US East (Ohio) us-east-2',
            bucket_name: process.env.CDN_BUCKET_NAME,
            endpoint: process.env.CDN_ENDPOINT,
            cdn_key: process.env.CDN_KEY,
            cdn_secret: process.env.CDN_SECRET,
        });
        return new Promise(async (resolve, reject) => {
            if (!process.env.CDN_TYPE) {
                reject("CDN is not enabled. Test aborted");
                return;
            }
            console.log("Please wait while your CDN test is completed");
            let s3;
            if (process.env.CDN_TYPE === 'aws') {
                s3 = new AWS.S3({
                    endpoint: new AWS.Endpoint(process.env.CDN_ENDPOINT),
                    accessKeyId: process.env.CDN_KEY,
                    secretAccessKey: process.env.CDN_SECRET,
                    region: 'US East (Ohio) us-east-2',
                    //: process.env.AWS_S3_FORCE_PATH_STYLE || false
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
                // ACL: 'public-read'
            };
            s3.upload(uploadParams, (err, data) => {
                if (err) {
                    reject(`CDN Test failed: ${err.code}`);
                } else {
                    s3.deleteObject({ Bucket: process.env.CDN_BUCKET_NAME, Key: uploadKey }, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                cdn_bucket_name: process.env.CDN_BUCKET_NAME,
                                cdn_type: process.env.CDN_TYPE,
                            });
                        }
                    });
                }
            });
        });
    }

}

export default  new UploadManager();
