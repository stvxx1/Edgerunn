import { GIFEncoder, quantize, applyPalette } from 'gifenc';

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read a frame.'));
    img.src = url;
  });

// Stitches storyboard frames into a looping GIF in the browser. 256 colours per frame, so it is
// a little grainier than the originals; `maxWidth` keeps the file a sensible size.
export const makeGif = async (urls: string[], opts: { frameMs?: number; maxWidth?: number } = {}): Promise<Blob> => {
  const frameMs = opts.frameMs ?? 1100;
  const maxWidth = opts.maxWidth ?? 512;
  const images = await Promise.all(urls.map(loadImage));
  const scale = Math.min(1, maxWidth / images[0].naturalWidth);
  const width = Math.round(images[0].naturalWidth * scale);
  const height = Math.round(images[0].naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  const gif = GIFEncoder();
  for (const img of images) {
    ctx.drawImage(img, 0, 0, width, height);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 256);
    gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay: frameMs });
  }
  gif.finish();
  return new Blob([gif.bytesView()], { type: 'image/gif' });
};
