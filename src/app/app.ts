import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppBackground } from './shared/app-background/app-background';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppBackground],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
