import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (['.xlsx', '.csv'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Aceito apenas .xlsx e .csv'));
  }
};

// Multer 2.x: sem storage = stream em memória (req.file.stream). 4 MB para serverless (ex.: Vercel).
const upload = multer({ fileFilter, limits: { fileSize: 4 * 1024 * 1024 } });

export default upload;
