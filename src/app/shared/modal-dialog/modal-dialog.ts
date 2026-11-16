import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';

/** Fenêtre centrée, ou panneau qui monte du bas de l'écran. */
export type ModalDialogPlacement = 'center' | 'bottom-sheet';

/**
 * Fenêtre par-dessus la page (élément natif `<dialog>`) : un titre, un bouton de fermeture et le
 * contenu projeté. Échap, la croix ou un clic sur le fond assombri ferment la fenêtre.
 *
 * Usage : `<app-modal-dialog #dialog dialogTitle="…">`, puis `dialog.open()`. Pour que le contenu
 * ne soit créé (et ses données chargées) que fenêtre ouverte, l'entourer côté parent de
 * `@if (dialog.isOpen()) { … }` : un `@if` dans la fenêtre ne suffit pas avec `<ng-content>`.
 *
 * `placement="bottom-sheet"` : panneau qui monte du bas de l'écran (filtres sur téléphone).
 * Un élément marqué `dialogFooter` se place dans un pied fixe, sous le contenu qui défile.
 */
@Component({
  selector: 'app-modal-dialog',
  templateUrl: './modal-dialog.html',
  styleUrl: './modal-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDialog {
  readonly dialogTitle: InputSignal<string> = input.required<string>();

  readonly placement: InputSignal<ModalDialogPlacement> = input<ModalDialogPlacement>('center');

  readonly closed: OutputEmitterRef<void> = output<void>();

  private readonly isOpenState: WritableSignal<boolean> = signal(false);
  readonly isOpen: Signal<boolean> = this.isOpenState.asReadonly();

  private readonly dialogElement: Signal<ElementRef<HTMLDialogElement>> =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialogElement');

  open(): void {
    this.isOpenState.set(true);
    this.dialogElement().nativeElement.showModal();
  }

  close(): void {
    this.dialogElement().nativeElement.close();
  }

  /** Fermeture, quelle qu'en soit la cause (croix, Échap, fond) : on retire le contenu. */
  protected onDialogClosed(): void {
    this.isOpenState.set(false);
    this.closed.emit();
  }

  protected closeOnBackdropClick(clickEvent: MouseEvent): void {
    if (clickEvent.target === this.dialogElement().nativeElement) {
      this.close();
    }
  }
}
