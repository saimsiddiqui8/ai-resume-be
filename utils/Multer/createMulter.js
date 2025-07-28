import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const createMulter = (destination, video = true, limit = 50 * 1024 * 1024) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        video && fileExtension === '.mp4'
          ? cb(null, './uploads/videos/')
          : cb(null, destination);
      },
      filename: (req, file, cb) => {
        const uuid = uuidv4();
        const uniqueSuffix = uuid + path.extname(file.originalname);
        cb(null, uniqueSuffix);
      },
    }),
    limits: { fileSize: limit },
  });
};

export { createMulter };
