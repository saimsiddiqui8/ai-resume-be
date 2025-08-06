import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',

        // Documents
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/plain', // .txt
        'application/rtf', // .rtf

        // Presentations
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

        // Spreadsheets
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv',

        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG are allowed.'));
    }
};
const createMulter = (limit = 50 * 1024 * 1024) => {
  return multer({
    storage, limits: {
      fileSize: limit ?? 30 * 1024 * 1024, // 30 MB
    }, fileFilter
  });
};

export { createMulter };
