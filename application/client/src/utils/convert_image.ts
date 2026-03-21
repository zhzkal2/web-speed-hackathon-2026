import { ImageIFD, load } from "piexifjs";

interface Options {
  extension: "avif" | "jpg";
}

const MAX_IMAGE_DIMENSION = 1280;
const AVIF_QUALITY = 50;
const JPEG_QUALITY = 75;

export interface ConvertedImage {
  alt: string;
  blob: Blob;
}

function getOutputSettings(extension: Options["extension"]) {
  if (extension === "avif") {
    return {
      mimeType: "image/avif",
      quality: AVIF_QUALITY / 100,
    };
  }

  return {
    mimeType: "image/jpeg",
    quality: JPEG_QUALITY / 100,
  };
}

function decodeExifString(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes).replace(/\0+$/u, "");
}

function extractAltFromTiff(buffer: ArrayBuffer): string {
  const view = new DataView(buffer);
  if (view.byteLength < 8) {
    return "";
  }

  const byteOrder = String.fromCharCode(view.getUint8(0), view.getUint8(1));
  const littleEndian = byteOrder === "II";
  if (!littleEndian && byteOrder !== "MM") {
    return "";
  }

  const readUint16 = (offset: number) => view.getUint16(offset, littleEndian);
  const readUint32 = (offset: number) => view.getUint32(offset, littleEndian);

  if (readUint16(2) !== 42) {
    return "";
  }

  const ifdOffset = readUint32(4);
  if (ifdOffset + 2 > view.byteLength) {
    return "";
  }

  const entryCount = readUint16(ifdOffset);
  const decoder = new TextDecoder();

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) {
      break;
    }

    const tag = readUint16(entryOffset);
    if (tag !== 0x010e) {
      continue;
    }

    const type = readUint16(entryOffset + 2);
    const count = readUint32(entryOffset + 4);
    if (type !== 2 || count === 0) {
      return "";
    }

    let bytes: Uint8Array;
    if (count <= 4) {
      bytes = new Uint8Array(buffer.slice(entryOffset + 8, entryOffset + 8 + count));
    } else {
      const valueOffset = readUint32(entryOffset + 8);
      if (valueOffset + count > view.byteLength) {
        return "";
      }
      bytes = new Uint8Array(buffer.slice(valueOffset, valueOffset + count));
    }

    return decoder.decode(bytes).replace(/\0+$/u, "");
  }

  return "";
}

async function extractAlt(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    if (file.type === "image/tiff" || file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff")) {
      const tiffAlt = extractAltFromTiff(buffer);
      if (tiffAlt.length > 0) {
        return tiffAlt;
      }
    }

    const binary = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    const exif = load(binary);
    const value = exif["0th"]?.[ImageIFD.ImageDescription];
    return decodeExifString(value);
  } catch {
    return "";
  }
}

async function convertImageWithCanvas(file: File, options: Options): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxDimension = Math.max(bitmap.width, bitmap.height);
  const scale = maxDimension > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / maxDimension : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const { mimeType, quality } = getOutputSettings(options.extension);

  if (
    scale === 1 &&
    ((options.extension === "jpg" && file.type === "image/jpeg") ||
      (options.extension === "avif" && file.type === "image/avif"))
  ) {
    bitmap.close();
    return file.slice(0, file.size, mimeType);
  }

  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    if (context == null) {
      throw new Error("Failed to create 2d context");
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return await canvas.convertToBlob({ quality, type: mimeType });
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (context == null) {
    bitmap.close();
    throw new Error("Failed to create 2d context");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob == null) {
          reject(new Error("Failed to convert image"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function convertImageWithImageMagick(file: File, options: Options): Promise<Blob> {
  const [{ ImageMagick, MagickFormat, initializeImageMagick }, { default: magickWasm }] =
    await Promise.all([
      import(/* webpackChunkName: "feature-image-tools-magick" */ "@imagemagick/magick-wasm"),
      import(
        /* webpackChunkName: "feature-image-tools-magick" */ "@imagemagick/magick-wasm/magick.wasm?binary"
      ),
    ]);
  await initializeImageMagick(magickWasm);

  const byteArray = new Uint8Array(await file.arrayBuffer());

  return await new Promise((resolve) => {
    ImageMagick.read(byteArray, (img) => {
      img.format = options.extension === "avif" ? MagickFormat.Avif : MagickFormat.Jpg;
      const maxDimension = Math.max(img.width, img.height);
      if (maxDimension > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / maxDimension;
        img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
      }
      img.quality = options.extension === "avif" ? AVIF_QUALITY : JPEG_QUALITY;

      img.write((output) => {
        resolve(new Blob([output as Uint8Array<ArrayBuffer>]));
      });
    });
  });
}

export async function convertImage(file: File, options: Options): Promise<ConvertedImage> {
  const alt = await extractAlt(file);

  try {
    const blob = await convertImageWithCanvas(file, options);
    return { alt, blob };
  } catch {
    const blob = await convertImageWithImageMagick(file, options);
    return { alt, blob };
  }
}
