import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.xlsx', '.csv'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Aceito apenas .xlsx e .csv'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

export default upload;
