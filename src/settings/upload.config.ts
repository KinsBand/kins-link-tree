/** Keep multipart uploads below the Vercel Function request-body ceiling. */
export const fanUploadConfig = {
  minBytes: 1024,
  maxBytes: 4 * 1024 * 1024,
  maxRequestBytes: 4_400_000,
  sizeLabel: '4 MB',
  sizeError: 'File must be between 1 KB and 4 MB. Please choose a smaller file.',
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm'],
};
