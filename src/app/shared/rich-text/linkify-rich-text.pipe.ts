import { Pipe, PipeTransform } from '@angular/core';
import { linkifyRichTextHtml } from './linkify-rich-text';

/** `[innerHTML]="html | linkifyRichText"` : les adresses web deviennent des liens cliquables. */
@Pipe({ name: 'linkifyRichText' })
export class LinkifyRichTextPipe implements PipeTransform {
  transform(richTextHtml: string): string {
    return linkifyRichTextHtml(richTextHtml);
  }
}
