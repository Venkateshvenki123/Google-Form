import { Request, Response } from 'express';

export async function uploadSingleFile(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file was uploaded.' });
    return;
  }

  const file = req.file;
  // Return file metadata and public URL
  const fileUrl = `/uploads/${file.filename}`;

  res.json({
    success: true,
    file: {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
      url: fileUrl,
    },
  });
}
