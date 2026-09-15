import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppBackground } from './shared/app-background/app-background';
import { ThemePicker } from './shared/theme-picker/theme-picker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppBackground, ThemePicker],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
