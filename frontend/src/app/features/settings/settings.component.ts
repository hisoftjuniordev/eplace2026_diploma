import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-2xl">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-900">Nastavitve podjetja</h1>
        <p class="text-sm text-gray-500 mt-0.5">Podatki podjetja za SEPA plačila in izpise</p>
      </div>

      <div *ngIf="loading()" class="text-gray-400 py-8 text-center">Nalaganje...</div>

      <form *ngIf="!loading()" [formGroup]="form" (ngSubmit)="save()"
            class="bg-white rounded-lg shadow p-6 space-y-4">

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Naziv podjetja *</label>
          <input formControlName="naziv_podjetja" type="text"
            class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            [class.border-red-500]="f['naziv_podjetja'].invalid && f['naziv_podjetja'].touched" />
          <div *ngIf="f['naziv_podjetja'].invalid && f['naziv_podjetja'].touched"
               class="text-red-600 text-xs mt-1">Naziv je obvezen.</div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Davčna številka</label>
            <input formControlName="davcna_stevilka" type="text" readonly
              class="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono" />
            <p class="text-xs text-gray-400 mt-0.5">Ni spremenljivo</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Matična številka</label>
            <input formControlName="maticna_stevilka" type="text" readonly
              class="w-full border rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">IBAN podjetja (za SEPA plačnik)</label>
          <input formControlName="iban" type="text" maxlength="34"
            class="w-full border rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
            placeholder="SI5601000000000100" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Naslov</label>
          <input formControlName="naslov" type="text"
            class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ulica 1" />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Kraj</label>
            <input formControlName="kraj" type="text"
              class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Ljubljana" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pošta</label>
            <input formControlName="posta" type="text" maxlength="10"
              class="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="1000" />
          </div>
        </div>

        <div *ngIf="error()" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {{ error() }}
        </div>

        <div *ngIf="saved()" class="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
          ✅ Podatki shranjeni.
        </div>

        <div class="flex justify-end pt-2">
          <button type="submit" [disabled]="form.invalid || saving()"
                  class="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            {{ saving() ? 'Shranjujem...' : 'Shrani spremembe' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  saving  = signal(false);
  saved   = signal(false);
  error   = signal('');

  form = this.fb.group({
    naziv_podjetja:   ['', [Validators.required, Validators.minLength(2)]],
    davcna_stevilka:  [{ value: '', disabled: true }],
    maticna_stevilka: [{ value: '', disabled: true }],
    iban:             [''],
    naslov:           [''],
    kraj:             [''],
    posta:            [''],
  });

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(`${API}/settings/me`).subscribe({
      next: (t) => { this.form.patchValue(t); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    this.http.put(`${API}/settings/me`, this.form.getRawValue()).subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); },
      error: (err) => { this.error.set(err?.error?.error ?? 'Napaka'); this.saving.set(false); },
    });
  }
}
