import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-contact',
  imports: [PageHeader],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {}
