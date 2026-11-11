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

/** Une quantité dans l'unité la plus lisible pour l'affichage. */
type ReadableQuantity = {
  quantity: number;
  unit: string;
};

const GRAMS_PER_KILOGRAM: number = 1000;
const MILLILITERS_PER_LITER: number = 1000;
const MILLILITERS_PER_CENTILITER: number = 10;

/**
 * Les quantités sont stockées en g et en ml ; on les affiche dans l'unité la plus lisible :
 * 1500 g → 1,5 kg ; 1000 ml → 1 l ; 250 ml → 25 cl ; 5 ml reste 5 ml.
 */
export function toReadableQuantity(quantity: number, unit: string): ReadableQuantity {
  const normalizedUnit: string = unit.trim().toLowerCase();
  if (normalizedUnit === 'g' && quantity >= GRAMS_PER_KILOGRAM) {
    return { quantity: quantity / GRAMS_PER_KILOGRAM, unit: 'kg' };
  }
  if (normalizedUnit === 'ml' && quantity >= MILLILITERS_PER_LITER) {
    return { quantity: quantity / MILLILITERS_PER_LITER, unit: 'l' };
  }
  if (normalizedUnit === 'ml' && quantity >= MILLILITERS_PER_CENTILITER) {
    return { quantity: quantity / MILLILITERS_PER_CENTILITER, unit: 'cl' };
  }
  return { quantity, unit: unit.trim() };
}

/** Quantité et unité ensemble : « 200 g », « 1 l », « 2 », « au goût ». */
export function formatQuantityWithUnit(quantity: number | null, unit: string): string {
  if (quantity === null) {
    return unit.length > 0 ? unit : 'au goût';
  }
  const readableQuantity: ReadableQuantity = toReadableQuantity(quantity, unit);
  const formattedQuantity: string = formatQuantity(readableQuantity.quantity);
  return readableQuantity.unit.length > 0
    ? `${formattedQuantity} ${readableQuantity.unit}`
    : formattedQuantity;
}

/**
 * Aide affichée dans le formulaire, quand l'unité lisible diffère de la saisie :
 * « 1 l » pour 1000 ml. `null` sinon.
 */
export function formatReadableQuantityHint(quantity: number | null, unit: string): string | null {
  if (quantity === null || quantity <= 0) {
    return null;
  }
  const readableQuantity: ReadableQuantity = toReadableQuantity(quantity, unit);
  return readableQuantity.unit === unit.trim() ? null : formatQuantityWithUnit(quantity, unit);
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
