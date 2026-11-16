import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  viewChild,
} from '@angular/core';

/**
 * Fenêtre de confirmation aux couleurs de l'app, pour les actions définitives (supprimer…).
 * Remplace le `confirm()` du navigateur. Élément natif `<dialog>` : le fond est bloqué, Échap
 * ferme, le focus reste dans la fenêtre. « Annuler » a le focus par défaut, pour éviter une
 * suppression par réflexe.
 *
 * Usage : `<app-confirmation-dialog #dialog … (confirmed)="…" />` puis `dialog.open()`.
 */
@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialog {
  readonly dialogTitle: InputSignal<string> = input.required<string>();
  readonly message: InputSignal<string> = input.required<string>();
  readonly confirmLabel: InputSignal<string> = input<string>('Supprimer');
  readonly cancelLabel: InputSignal<string> = input<string>('Annuler');

  readonly confirmed: OutputEmitterRef<void> = output<void>();

  private readonly dialogElement: Signal<ElementRef<HTMLDialogElement>> =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialogElement');

  open(): void {
    this.dialogElement().nativeElement.showModal();
  }

  protected cancel(): void {
    this.dialogElement().nativeElement.close();
  }

  protected confirm(): void {
    this.dialogElement().nativeElement.close();
    this.confirmed.emit();
  }

  /** Un clic sur le fond assombri (hors de la fenêtre) annule. */
  protected closeOnBackdropClick(clickEvent: MouseEvent): void {
    if (clickEvent.target === this.dialogElement().nativeElement) {
      this.cancel();
    }
  }
}
