import sharp from "sharp";

/** Downscale a screenshot to max 1400px and JPEG it. Returns null if not an image. */
export async function shrinkImage(file: File | null): Promise<{ mime: string; data: Buffer } | null> {
  if (!file || typeof file === "string" || !file.size) return null;
  if (!file.type.startsWith("image/")) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  const out = await sharp(buf).rotate().resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return { mime: "image/jpeg", data: out };
}
