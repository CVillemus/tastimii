/** Plus grand côté d'une photo envoyée : assez pour un grand écran, léger pour la 4G. */
export const RECIPE_PHOTO_MAX_SIDE_PX: number = 1600;
const RECIPE_PHOTO_JPEG_QUALITY: number = 0.82;

export type PhotoDimensions = {
  width: number;
  height: number;
};

/** Taille réduite qui garde les proportions ; une photo déjà petite n'est pas agrandie. */
export function computeResizedPhotoDimensions(
  originalDimensions: PhotoDimensions,
  maxSide: number,
): PhotoDimensions {
  const longestSide: number = Math.max(originalDimensions.width, originalDimensions.height);
  if (longestSide <= maxSide) {
    return originalDimensions;
  }
  const scale: number = maxSide / longestSide;
  return {
    width: Math.round(originalDimensions.width * scale),
    height: Math.round(originalDimensions.height * scale),
  };
}

/**
 * Réduit une photo du téléphone (3 à 5 Mo) en JPEG d'environ 200 à 400 Ko.
 * Le navigateur applique l'orientation EXIF : la photo reste à l'endroit.
 */
export async function resizeRecipePhoto(photoFile: File): Promise<Blob> {
  const photoBitmap: ImageBitmap = await createImageBitmap(photoFile, {
    imageOrientation: 'from-image',
  });
  const resizedDimensions: PhotoDimensions = computeResizedPhotoDimensions(
    { width: photoBitmap.width, height: photoBitmap.height },
    RECIPE_PHOTO_MAX_SIDE_PX,
  );
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  canvas.width = resizedDimensions.width;
  canvas.height = resizedDimensions.height;
  const canvasContext: CanvasRenderingContext2D | null = canvas.getContext('2d');
  if (canvasContext === null) {
    throw new Error('Le navigateur ne sait pas redimensionner les images.');
  }
  canvasContext.drawImage(photoBitmap, 0, 0, resizedDimensions.width, resizedDimensions.height);
  photoBitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resizedPhoto: Blob | null) =>
        resizedPhoto === null
          ? reject(new Error("La photo n'a pas pu être convertie."))
          : resolve(resizedPhoto),
      'image/jpeg',
      RECIPE_PHOTO_JPEG_QUALITY,
    );
  });
}
