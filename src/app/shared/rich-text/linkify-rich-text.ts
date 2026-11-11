/**
 * Adresse web dans un texte : commence par http(s):// et s'arrête avant un espace ou une balise.
 * La ponctuation finale (point, virgule, parenthèse…) ne fait pas partie du lien.
 */
const WEB_ADDRESS_PATTERN: RegExp = /https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"»]/g;

/**
 * Transforme en liens cliquables les adresses écrites en texte dans un HTML de texte riche
 * (« https://www.instagram.com/… » collé dans une description). Les liens déjà présents
 * ne sont pas touchés. Les liens s'ouvrent dans un nouvel onglet.
 */
export function linkifyRichTextHtml(richTextHtml: string): string {
  if (!richTextHtml.includes('http')) {
    return richTextHtml;
  }
  const parsedDocument: Document = new DOMParser().parseFromString(
    `<body>${richTextHtml}</body>`,
    'text/html',
  );
  const textNodes: Text[] = collectTextNodesOutsideLinks(parsedDocument.body);
  for (const textNode of textNodes) {
    replaceWebAddressesWithLinks(textNode, parsedDocument);
  }
  return parsedDocument.body.innerHTML;
}

function collectTextNodesOutsideLinks(rootElement: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const treeWalker: TreeWalker = rootElement.ownerDocument.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
  );
  let currentNode: Node | null = treeWalker.nextNode();
  while (currentNode !== null) {
    if (currentNode.parentElement?.closest('a') === null) {
      textNodes.push(currentNode as Text);
    }
    currentNode = treeWalker.nextNode();
  }
  return textNodes;
}

function replaceWebAddressesWithLinks(textNode: Text, parsedDocument: Document): void {
  const text: string = textNode.data;
  const webAddressMatches: RegExpMatchArray[] = [...text.matchAll(WEB_ADDRESS_PATTERN)];
  if (webAddressMatches.length === 0) {
    return;
  }
  const replacement: DocumentFragment = parsedDocument.createDocumentFragment();
  let textIndex: number = 0;
  for (const webAddressMatch of webAddressMatches) {
    const webAddress: string = webAddressMatch[0];
    const matchIndex: number = webAddressMatch.index ?? 0;
    replacement.append(text.slice(textIndex, matchIndex));
    const link: HTMLAnchorElement = parsedDocument.createElement('a');
    link.href = webAddress;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = webAddress;
    replacement.append(link);
    textIndex = matchIndex + webAddress.length;
  }
  replacement.append(text.slice(textIndex));
  textNode.replaceWith(replacement);
}
