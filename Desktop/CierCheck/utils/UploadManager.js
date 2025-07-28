const { v4: uuid } = require('uuid');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

class UploadManager {
    constructor() {
        this.s3 = new S3Client({
            region: process.env.S3_REGION || 'us-east-2',
            credentials: {
                accessKeyId: process.env.S3_ACCESS,
                secretAccessKey: process.env.S3_SECRET,
            },
            // requestHandler: new NodeHttpHandler({
            //     connectionTimeout: 5000, // 5 seconds to establish connection
            //     socketTimeout: 120000, // 2 minutes for data to transfer
            // }),
        });
        this.bucketName = process.env.S3_BUCKET_NAME || 'cier-check';
    }

    static getInstance() {
        if (!UploadManager.instance) {
            UploadManager.instance = new UploadManager();
        }
        return UploadManager.instance;
    }

    async uploadSingleImage(file) {
        const fileKey = `${Date.now()}-uuid-${file.originalname}`;

        await this.s3.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            }),
        );
        return `https://cier-check.s3.us-east-2.amazonaws.com/${fileKey}`;
    }

    async deleteFileFromBucket(fileUrl) {
        let fileKey = fileUrl;

        // If full URL, extract key
        if (fileUrl.startsWith('https://')) {
            const urlParts = fileUrl.split('/');
            fileKey = urlParts.slice(3).join('/'); // everything after domain
        }

        await this.s3.send(
            new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            }),
        );

        return true;
    }

    // public async uploadMultipleImages(files: {
    //     [fieldname: string]: Express.Multer.File[];
    // }): Promise<{ [fieldname: string]: string | string[] }> {
    //     const result: { [fieldname: string]: string | string[] } = {};

    //     await Promise.all(
    //         Object.entries(files).map(async ([fieldname, fileArray]) => {
    //             const links = await Promise.all(
    //                 fileArray.map((file) => this.uploadSingleImage(file)),
    //             );
    //             if (['interiorImages', 'exteriorImages', 'images'].includes(fieldname)) {
    //                 result[fieldname] = links;
    //             } else {
    //                 result[fieldname] = links[0];
    //             }
    //         }),
    //     );

    //     return result;
    // }
}

module.exports = UploadManager;
