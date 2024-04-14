const extWhitelist = new Set([
  // videos
  'gif',
  'mp4',
  'webm',
  'mkv',
  'mov',
  'avi',

  // images
  'bmp',
  'jpg',
  'jpeg',
  'png',
  'tif',
  'webp',

  // audio
  'mp3',
  'aac',
  'wav',
  'flac',
  'opus',
  'ogg',
]);

export const getFileExt = (url: string, { strict = true } = {}) => {
  const parts = url.split('.');
  const ext = (parts.length > 1 ? parts[parts.length - 1] : '').trim().toLowerCase();

  if (!strict || extWhitelist.has(ext)) {
    return ext;
  }
  return 'raw'; // default if no extension found or not in whitelist
};
