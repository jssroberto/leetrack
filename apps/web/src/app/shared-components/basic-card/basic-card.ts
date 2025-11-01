import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Icon } from './../../../services/icon-registry.service'
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-basic-card',
  imports: [CommonModule],
  templateUrl: './basic-card.html',
  styleUrl: './basic-card.css'
})
export class BasicCard {
  private sanitizer = inject(DomSanitizer);

  @Input() number!: string;
  @Input() title!: string;
  @Input() color!: string;
  @Input() icon!: Icon;

  @Input() size!: string;
  @Input() square: boolean = false;

  sanitizeSvg(svg: string) {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
