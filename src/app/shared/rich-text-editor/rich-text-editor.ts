import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  InputSignal,
  model,
  ModelSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { ChainedCommands, Editor } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';

/** Les mises en forme proposées dans la barre d'outils. */
type RichTextFormat = 'bold' | 'italic' | 'underline' | 'heading' | 'bulletList' | 'orderedList';

type RichTextToolbarButton = {
  format: RichTextFormat;
  label: string;
  symbol: string;
};

const TOOLBAR_BUTTONS: readonly RichTextToolbarButton[] = [
  { format: 'bold', label: 'Gras', symbol: 'G' },
  { format: 'italic', label: 'Italique', symbol: 'I' },
  { format: 'underline', label: 'Souligné', symbol: 'S' },
  { format: 'heading', label: 'Intertitre', symbol: 'T' },
  { format: 'bulletList', label: 'Liste à puces', symbol: '•' },
  { format: 'orderedList', label: 'Liste numérotée', symbol: '1.' },
];

const NO_ACTIVE_FORMAT: Record<RichTextFormat, boolean> = {
  bold: false,
  italic: false,
  underline: false,
  heading: false,
  bulletList: false,
  orderedList: false,
};

/**
 * Éditeur de texte riche (Tiptap) : gras, italique, souligné, intertitres et listes.
 * La valeur est du HTML ; un texte vide vaut ''. S'utilise avec `[formField]` ou `[(value)]`.
 */
@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextEditor implements FormValueControl<string> {
  readonly value: ModelSignal<string> = model<string>('');
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly editorLabel: InputSignal<string> = input<string>('Texte');
  readonly touch: OutputEmitterRef<void> = output<void>();

  protected readonly toolbarButtons: readonly RichTextToolbarButton[] = TOOLBAR_BUTTONS;

  private readonly activeFormatsState: WritableSignal<Record<RichTextFormat, boolean>> =
    signal(NO_ACTIVE_FORMAT);
  protected readonly activeFormats: Signal<Record<RichTextFormat, boolean>> =
    this.activeFormatsState.asReadonly();

  private readonly editorHost: Signal<ElementRef<HTMLDivElement>> =
    viewChild.required<ElementRef<HTMLDivElement>>('editorHost');

  private editor: Editor | null = null;
  /** Dernier HTML produit par l'éditeur, pour ne pas le réinjecter quand il revient par `value`. */
  private lastEditorHtml: string = '';

  constructor() {
    afterNextRender(() => this.createEditor());

    // Valeur changée de l'extérieur (formulaire rempli en mode modification, annulation…).
    effect(() => {
      const externalHtml: string = this.value();
      if (this.editor !== null && externalHtml !== this.lastEditorHtml) {
        this.lastEditorHtml = externalHtml;
        this.editor.commands.setContent(externalHtml, { emitUpdate: false });
      }
    });

    inject(DestroyRef).onDestroy(() => this.editor?.destroy());
  }

  focus(): void {
    this.editor?.commands.focus();
  }

  protected applyFormat(format: RichTextFormat): void {
    if (this.editor === null) {
      return;
    }
    const chain: ChainedCommands = this.editor.chain().focus();
    switch (format) {
      case 'bold':
        chain.toggleBold().run();
        break;
      case 'italic':
        chain.toggleItalic().run();
        break;
      case 'underline':
        chain.toggleUnderline().run();
        break;
      case 'heading':
        chain.toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        chain.toggleBulletList().run();
        break;
      case 'orderedList':
        chain.toggleOrderedList().run();
        break;
    }
  }

  private createEditor(): void {
    this.lastEditorHtml = this.value();
    this.editor = new Editor({
      element: this.editorHost().nativeElement,
      content: this.value(),
      extensions: [
        StarterKit.configure({
          heading: { levels: [3] },
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          link: false,
          trailingNode: false,
        }),
        Placeholder.configure({ placeholder: this.placeholder() }),
      ],
      editorProps: {
        attributes: {
          class: 'rich-text rich-text-editor__content',
          role: 'textbox',
          'aria-multiline': 'true',
          'aria-label': this.editorLabel(),
        },
      },
      onUpdate: ({ editor }: { editor: Editor }) => {
        const editorHtml: string = editor.isEmpty ? '' : editor.getHTML();
        this.lastEditorHtml = editorHtml;
        this.value.set(editorHtml);
      },
      onTransaction: ({ editor }: { editor: Editor }) => this.refreshActiveFormats(editor),
      onBlur: () => this.touch.emit(),
    });
  }

  private refreshActiveFormats(editor: Editor): void {
    this.activeFormatsState.set({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      heading: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
    });
  }
}
