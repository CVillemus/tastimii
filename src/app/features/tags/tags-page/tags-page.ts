import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ResourceRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  groupTagsByCategory,
  normalizeTagName,
  RecipeTag,
  TAG_CATEGORIES,
  TagCategory,
  TagCategoryDefinition,
  TagCategoryGroup,
} from '../../../core/tags/tag.model';
import { TagsApi } from '../../../core/tags/tags-api';

/** Ce que la page charge : les tags et le nombre de recettes de chacun. */
type TagCatalog = {
  tags: RecipeTag[];
  usageCountsByTagId: Map<string, number>;
};

/** Brouillon du tag en cours de modification (un seul à la fois). */
type TagDraft = {
  tagId: string;
  name: string;
  category: TagCategory;
};

/** Gestion des tags : les renommer, changer leur catégorie, les supprimer, en ajouter. */
@Component({
  selector: 'app-tags-page',
  imports: [RouterLink],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsPage {
  private readonly tagsApi: TagsApi = inject(TagsApi);

  protected readonly tagCatalogResource: ResourceRef<TagCatalog | undefined> = resource({
    loader: async (): Promise<TagCatalog> => {
      const [tags, usageCountsByTagId] = await Promise.all([
        this.tagsApi.fetchTags(),
        this.tagsApi.fetchTagUsageCounts(),
      ]);
      return { tags, usageCountsByTagId };
    },
  });

  /** Toutes les catégories, même vides : on doit pouvoir y ajouter un tag. */
  protected readonly tagCategoryGroups: Signal<TagCategoryGroup[]> = computed(() =>
    groupTagsByCategory(
      this.tagCatalogResource.hasValue() ? this.tagCatalogResource.value().tags : [],
      true,
    ),
  );

  protected readonly tagCategories: readonly TagCategoryDefinition[] = TAG_CATEGORIES;

  private readonly tagDraftState: WritableSignal<TagDraft | null> = signal(null);
  protected readonly tagDraft: Signal<TagDraft | null> = this.tagDraftState.asReadonly();

  /** Nom tapé dans le champ « Ajouter » de chaque catégorie. */
  private readonly newTagNamesState: WritableSignal<Partial<Record<TagCategory, string>>> = signal(
    {},
  );
  protected readonly newTagNames: Signal<Partial<Record<TagCategory, string>>> =
    this.newTagNamesState.asReadonly();

  private readonly errorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly errorMessage: Signal<string | null> = this.errorMessageState.asReadonly();

  protected usageCountOf(tag: RecipeTag): number {
    return this.tagCatalogResource.hasValue()
      ? (this.tagCatalogResource.value().usageCountsByTagId.get(tag.id) ?? 0)
      : 0;
  }

  protected startEditingTag(tag: RecipeTag): void {
    this.errorMessageState.set(null);
    this.tagDraftState.set({ tagId: tag.id, name: tag.name, category: tag.category });
  }

  protected cancelEditingTag(): void {
    this.tagDraftState.set(null);
  }

  protected updateDraftName(inputEvent: Event): void {
    const name: string = (inputEvent.target as HTMLInputElement).value;
    this.tagDraftState.update((tagDraft: TagDraft | null) =>
      tagDraft === null ? null : { ...tagDraft, name },
    );
  }

  protected updateDraftCategory(changeEvent: Event): void {
    const category: TagCategory = (changeEvent.target as HTMLSelectElement).value as TagCategory;
    this.tagDraftState.update((tagDraft: TagDraft | null) =>
      tagDraft === null ? null : { ...tagDraft, category },
    );
  }

  protected async saveTagDraft(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    const tagDraft: TagDraft | null = this.tagDraft();
    if (tagDraft === null) {
      return;
    }
    if (tagDraft.name.trim().length === 0) {
      this.errorMessageState.set('Donnez un nom au tag.');
      return;
    }
    if (this.isTagNameTaken(tagDraft.name, tagDraft.tagId)) {
      this.errorMessageState.set(`Un tag « ${tagDraft.name.trim()} » existe déjà.`);
      return;
    }
    const isSaved: boolean = await this.runTagAction(
      () => this.tagsApi.updateTag(tagDraft.tagId, tagDraft.name, tagDraft.category),
      "Le tag n'a pas pu être modifié.",
    );
    if (isSaved) {
      this.tagDraftState.set(null);
    }
  }

  protected updateNewTagName(category: TagCategory, inputEvent: Event): void {
    const name: string = (inputEvent.target as HTMLInputElement).value;
    this.newTagNamesState.update((newTagNames: Partial<Record<TagCategory, string>>) => ({
      ...newTagNames,
      [category]: name,
    }));
  }

  protected async addTag(category: TagCategory, submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    const tagName: string = (this.newTagNames()[category] ?? '').trim();
    if (tagName.length === 0) {
      return;
    }
    if (this.isTagNameTaken(tagName, null)) {
      this.errorMessageState.set(`Un tag « ${tagName} » existe déjà.`);
      return;
    }
    const isSaved: boolean = await this.runTagAction(
      () => this.tagsApi.createTag(tagName, category),
      "Le tag n'a pas pu être ajouté.",
    );
    if (isSaved) {
      this.newTagNamesState.update((newTagNames: Partial<Record<TagCategory, string>>) => ({
        ...newTagNames,
        [category]: '',
      }));
    }
  }

  protected async deleteTag(tag: RecipeTag): Promise<void> {
    const usageCount: number = this.usageCountOf(tag);
    const consequence: string =
      usageCount === 0
        ? "Il n'est sur aucune recette."
        : `Il sera retiré de ${usageCount} recette${usageCount > 1 ? 's' : ''}.`;
    if (!confirm(`Supprimer le tag « ${tag.name} » ? ${consequence}`)) {
      return;
    }
    await this.runTagAction(
      () => this.tagsApi.deleteTag(tag.id),
      `Le tag « ${tag.name} » n'a pas pu être supprimé.`,
    );
  }

  /** Vrai si un autre tag porte déjà ce nom (sans tenir compte des majuscules). */
  private isTagNameTaken(tagName: string, ignoredTagId: string | null): boolean {
    const tags: RecipeTag[] = this.tagCatalogResource.hasValue()
      ? this.tagCatalogResource.value().tags
      : [];
    return tags.some(
      (tag: RecipeTag) =>
        tag.id !== ignoredTagId && normalizeTagName(tag.name) === normalizeTagName(tagName),
    );
  }

  /** Lance une modification, affiche `failureMessage` si elle échoue, puis recharge les tags. */
  private async runTagAction(
    tagAction: () => Promise<unknown>,
    failureMessage: string,
  ): Promise<boolean> {
    this.errorMessageState.set(null);
    let isSuccessful: boolean = true;
    try {
      await tagAction();
    } catch {
      this.errorMessageState.set(failureMessage);
      isSuccessful = false;
    }
    this.tagCatalogResource.reload();
    return isSuccessful;
  }
}
