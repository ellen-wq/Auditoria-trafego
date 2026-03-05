import { getStreamAsBuffer } from 'get-stream';

/**
 * Obtém o buffer do arquivo enviado pelo multer.
 * Compatível com multer 1.x (file.buffer) e 2.x (file.stream).
 */
export async function getFileBuffer(file: Express.Multer.File | undefined): Promise<Buffer | null> {
  if (!file) return null;
  const f = file as { buffer?: Buffer; stream?: NodeJS.ReadableStream };
  if (Buffer.isBuffer(f.buffer)) return f.buffer;
  if (f.stream) {
    try {
      const buffer = await getStreamAsBuffer(f.stream);
      return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    } catch {
      return null;
    }
  }
  return null;
}
