import { describe, expect, it } from 'vitest';
import { linkifyRichTextHtml } from './linkify-rich-text';

describe('liens cliquables dans le texte riche', () => {
  it('transforme une adresse écrite en texte en lien qui s’ouvre dans un nouvel onglet', () => {
    expect(linkifyRichTextHtml('<p>Vu sur https://www.instagram.com/reel/abc/ hier</p>')).toBe(
      '<p>Vu sur <a href="https://www.instagram.com/reel/abc/" target="_blank" ' +
        'rel="noopener noreferrer">https://www.instagram.com/reel/abc/</a> hier</p>',
    );
  });

  it('laisse la ponctuation finale hors du lien', () => {
    expect(linkifyRichTextHtml('<p>Voir https://exemple.fr/recette.</p>')).toContain(
      '>https://exemple.fr/recette</a>.</p>',
    );
  });

  it('ne touche pas aux liens existants ni au texte sans adresse', () => {
    const existingLinkHtml: string = '<p><a href="https://exemple.fr">https://exemple.fr</a></p>';
    expect(linkifyRichTextHtml(existingLinkHtml)).toBe(existingLinkHtml);
    expect(linkifyRichTextHtml('<p>Cuire 35 minutes</p>')).toBe('<p>Cuire 35 minutes</p>');
  });
});
