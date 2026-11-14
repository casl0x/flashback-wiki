import "server-only";

import { createHash } from "node:crypto";

/**
 * Supprime une image de Cloudinary (API signée). Silencieux en cas d'échec :
 * une image orpheline ne doit jamais bloquer une action de modération.
 * Nécessite CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.
 */
export async function deleteCloudinaryImage(publicId: string | null | undefined): Promise<boolean> {
  if (!publicId || /^https?:\/\//.test(publicId)) return false;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary: CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET manquants, image non supprimée.");
    return false;
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: new URLSearchParams({ public_id: publicId, timestamp, api_key: apiKey, signature }),
    });
    return res.ok;
  } catch (e) {
    console.error("Cloudinary: suppression impossible", e);
    return false;
  }
}
