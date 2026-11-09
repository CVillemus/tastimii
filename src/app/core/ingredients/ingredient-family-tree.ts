import { Ingredient, IngredientFamily, IngredientFamilyTreeEntry } from './ingredient.model';

/**
 * Chemin d'une famille, du rayon jusqu'à elle : [Viande, Poulet].
 * Protégé contre un éventuel cycle dans les données.
 */
export function buildFamilyPath(
  familyId: string,
  familiesById: ReadonlyMap<string, IngredientFamily>,
): IngredientFamily[] {
  const familyPath: IngredientFamily[] = [];
  const visitedFamilyIds: Set<string> = new Set<string>();
  let currentFamily: IngredientFamily | undefined = familiesById.get(familyId);

  while (currentFamily !== undefined && !visitedFamilyIds.has(currentFamily.id)) {
    visitedFamilyIds.add(currentFamily.id);
    familyPath.unshift(currentFamily);
    currentFamily =
      currentFamily.parentFamilyId === null
        ? undefined
        : familiesById.get(currentFamily.parentFamilyId);
  }

  return familyPath;
}

/** Rayon d'une famille : la famille tout en haut de son arbre. */
export function findAisleFamily(
  familyId: string,
  familiesById: ReadonlyMap<string, IngredientFamily>,
): IngredientFamily | undefined {
  const familyPath: IngredientFamily[] = buildFamilyPath(familyId, familiesById);
  return familyPath.length > 0 ? familyPath[0] : undefined;
}

/** Libellé lisible d'une famille : « Viande › Poulet ». */
export function formatFamilyPath(
  familyId: string,
  familiesById: ReadonlyMap<string, IngredientFamily>,
): string {
  return buildFamilyPath(familyId, familiesById)
    .map((family: IngredientFamily) => family.name)
    .join(' › ');
}

/**
 * Arbre des familles mis à plat dans l'ordre d'affichage (un parent, puis ses enfants),
 * chaque famille avec ses ingrédients triés par nom.
 */
export function buildFamilyTree(
  families: readonly IngredientFamily[],
  ingredients: readonly Ingredient[],
): IngredientFamilyTreeEntry[] {
  const knownFamilyIds: Set<string> = new Set(
    families.map((family: IngredientFamily) => family.id),
  );
  const visitedFamilyIds: Set<string> = new Set<string>();
  const familyTree: IngredientFamilyTreeEntry[] = [];

  const addFamilyWithChildren = (family: IngredientFamily, depth: number): void => {
    if (visitedFamilyIds.has(family.id)) {
      return;
    }
    visitedFamilyIds.add(family.id);
    familyTree.push({
      family,
      depth,
      ingredients: ingredients
        .filter((ingredient: Ingredient) => ingredient.familyId === family.id)
        .sort(compareByFrenchName),
    });
    families
      .filter((childFamily: IngredientFamily) => childFamily.parentFamilyId === family.id)
      .sort(compareByFrenchName)
      .forEach((childFamily: IngredientFamily) => addFamilyWithChildren(childFamily, depth + 1));
  };

  families
    .filter(
      (family: IngredientFamily) =>
        family.parentFamilyId === null || !knownFamilyIds.has(family.parentFamilyId),
    )
    .sort(compareByFrenchName)
    .forEach((aisleFamily: IngredientFamily) => addFamilyWithChildren(aisleFamily, 0));

  return familyTree;
}

export function compareByFrenchName(first: { name: string }, second: { name: string }): number {
  return first.name.localeCompare(second.name, 'fr');
}
