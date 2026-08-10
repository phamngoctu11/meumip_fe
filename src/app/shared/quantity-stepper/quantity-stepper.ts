import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-quantity-stepper',
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QuantityStepper),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityStepper implements ControlValueAccessor {
  readonly min = input(1);
  readonly max = input(10);
  readonly disabled = input(false);
  readonly value = signal(1);
  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  decrease(): void {
    this.setValue(Math.max(this.min(), this.value() - 1));
  }

  increase(): void {
    this.setValue(Math.min(this.max(), this.value() + 1));
  }

  writeValue(value: number | null): void {
    this.value.set(Math.max(this.min(), Math.min(this.max(), value ?? this.min())));
  }

  registerOnChange(onChange: (value: number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }

  private setValue(value: number): void {
    if (this.isDisabled()) {
      return;
    }
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
