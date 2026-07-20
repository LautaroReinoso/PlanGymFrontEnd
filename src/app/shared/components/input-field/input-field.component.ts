// ─────────────────────────────────────────────
//  GymPlan — InputFieldComponent
//  Label flotante animado + ControlValueAccessor
//  Compatible con ReactiveForms y NgModel.
//  Tipos: text | email | password | number | tel
// ─────────────────────────────────────────────

import {
  Component,
  input,
  signal,
  computed,
  forwardRef,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'search';

@Component({
  selector: 'gp-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true,
    },
  ],
})
export class InputFieldComponent implements ControlValueAccessor {

  // ── Inputs ────────────────────────────────────
  readonly label       = input.required<string>();
  readonly type        = input<InputType>('text');
  readonly placeholder = input<string>('');
  readonly errorMsg    = input<string | null>(null);
  readonly hint        = input<string | null>(null);
  readonly disabled    = input<boolean>(false);
  readonly autocomplete = input<string>('off');

  // Referencia al input nativo
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  // ── Estado interno ────────────────────────────
  readonly value       = signal<string>('');
  readonly isFocused   = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  // Label flota cuando hay foco O cuando hay valor
  readonly isFloating = computed(() =>
    this.isFocused() || this.value().length > 0
  );

  readonly inputType = computed(() => {
    if (this.type() === 'password') {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  });

  readonly hasError = computed(() => !!this.errorMsg());

  // ── ControlValueAccessor ──────────────────────
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // El disabled lo maneja el input nativo vía [disabled]
  }

  // ── Handlers ──────────────────────────────────
  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  // Expone foco programático
  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }
}