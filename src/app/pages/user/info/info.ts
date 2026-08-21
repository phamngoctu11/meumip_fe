import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({ selector: 'app-info-page', imports: [RouterLink], templateUrl: './info.html', styleUrl: './info.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class InfoPage {}
