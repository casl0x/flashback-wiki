// Images Cloudinary (utilisable côté client comme côté serveur).
export function cloudinaryUrl(imageUrl: string, transform: string): string {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${imageUrl}`;
}

export function initials(nom: string): string {
  const words = nom.replace(/[«»"“”]/g, " ").split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "?";
  const last = words.length > 1 ? words.at(-1)![0] : "";
  return (first + last).toUpperCase();
}
