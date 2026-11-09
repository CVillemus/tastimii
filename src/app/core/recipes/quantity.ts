/**
 * Quantité d'un ingrédient pour un autre nombre de parts.
 * Exemple : 4 cuisses pour 4 parts → 2 cuisses pour 2 parts.
 */
export function scaleQuantity(
  baseQuantity: number | null,
  baseServings: number,
  wantedServings: number,
): number | null {
  if (baseQuantity === null || baseServings <= 0) {
    return null;
  }
  return (baseQuantity * wantedServings) / baseServings;
}

const smallQuantityFormat: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});
const mediumQuantityFormat: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});
const largeQuantityFormat: Intl.NumberFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

/** Quantité lisible : « 0,25 », « 2,5 », « 375 ». Plus le nombre est grand, moins de décimales. */
export function formatQuantity(quantity: number): string {
  if (quantity < 1) {
    return smallQuantityFormat.format(quantity);
  }
  if (quantity < 10) {
    return mediumQuantityFormat.format(quantity);
  }
  return largeQuantityFormat.format(quantity);
}

/** Quantité et unité ensemble : « 200 g », « 2 », « au goût ». */
export function formatQuantityWithUnit(quantity: number | null, unit: string): string {
  if (quantity === null) {
    return unit.length > 0 ? unit : 'au goût';
  }
  const formattedQuantity: string = formatQuantity(quantity);
  return unit.length > 0 ? `${formattedQuantity} ${unit}` : formattedQuantity;
}

/** Durée lisible : « 45 min », « 1 h 10 ». */
export function formatPreparationTime(preparationMinutes: number): string {
  const hours: number = Math.floor(preparationMinutes / 60);
  const minutes: number = preparationMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${minutes.toString().padStart(2, '0')}`;
}
