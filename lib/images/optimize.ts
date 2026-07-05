// Optimizes an uploaded tenant photo before it is stored: crops to a square,
// resizes to a sensible avatar size, and re-encodes as JPEG. Keeps blob storage
// small instead of persisting large raw camera images. Uses Jimp (pure JS), so
// it runs unchanged under Electron's bundled Node.

const AVATAR_SIZE = 512;
const JPEG_QUALITY = 78;

export async function optimizeAvatar(input: Buffer): Promise<Buffer> {
  const { Jimp } = await import("jimp");
  const image = await Jimp.read(input);
  // Square center-crop + resize to AVATAR_SIZE.
  image.cover({ w: AVATAR_SIZE, h: AVATAR_SIZE });
  const out = await image.getBuffer("image/jpeg", { quality: JPEG_QUALITY });
  return Buffer.from(out);
}
