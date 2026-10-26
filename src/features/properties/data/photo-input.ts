export const propertyPhotoMimeTypes: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const propertyPhotoMaxBytes = 5_242_880;

export function isValidPropertyPhoto(file: { type: string; size: number }) {
  return (
    propertyPhotoMimeTypes.includes(file.type) &&
    file.size > 0 &&
    file.size <= propertyPhotoMaxBytes
  );
}
