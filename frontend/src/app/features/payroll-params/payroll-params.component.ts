import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface ParamRow {
  id: string;
  kljuc: string;
  vrednost: string;
  opis: string;
  veljavno_od: string;
  veljavno_do: string | null;
}

@Component({
  selector: 'app-payroll-params',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-xl font-semibold text-gray-900">Parametri obračuna</h1>
        <p class="text-sm text-gray-500 mt-0.5">
          Zakonske stopnje, pragovi in olajšave. Spremembe veljajo za prihodnje obračune.
        </p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-16 text-gray-400">Nalaganje...</div>

      <!-- Error -->
      <div *ngIf="error()" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
        {{ error() }}
      </div>

      <!-- Success -->
      <div *ngIf="saved()" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
        Parameter shranjen.
      </div>

      <!-- Table -->
      <div *ngIf="!loading() && params().length > 0" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-56">Ključ</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Opis</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 w-36">Vrednost</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 w-28">Velja od</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 w-28">Velja do</th>
              <th class="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let p of params()">
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2 font-mono text-xs text-indigo-700 font-medium">{{ p.kljuc }}</td>
                <td class="px-4 py-2 text-gray-600 text-xs">{{ p.opis }}</td>

                <!-- Vrednost: edit mode or display -->
                <td class="px-4 py-2 text-center">
                  <ng-container *ngIf="editing()?.id === p.id; else displayVal">
                    <input type="text" [(ngModel)]="editValue"
                           class="w-full text-center border border-indigo-300 rounded px-2 py-1 text-sm
                                  focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </ng-container>
                  <ng-template #displayVal>
                    <span class="font-mono text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded">
                      {{ isJson(p.vrednost) ? '[JSON]' : p.vrednost }}
                    </span>
                  </ng-template>
                </td>

                <td class="px-4 py-2 text-center text-xs text-gray-500">
                  {{ p.veljavno_od | date:'d. M. yyyy' }}
                </td>
                <td class="px-4 py-2 text-center text-xs text-gray-400">
                  {{ p.veljavno_do ? (p.veljavno_do | date:'d. M. yyyy') : '—' }}
                </td>

                <td class="px-4 py-2 text-right">
                  <ng-container *ngIf="editing()?.id === p.id; else editBtn">
                    <div class="flex gap-1 justify-end">
                      <button (click)="save(p)" [disabled]="saving()"
                              class="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700
                                     disabled:opacity-50 transition-colors">
                        {{ saving() ? '...' : 'Shrani' }}
                      </button>
                      <button (click)="cancelEdit()"
                              class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded">
                        Prekliči
                      </button>
                    </div>
                  </ng-container>
                  <ng-template #editBtn>
                    <button (click)="startEdit(p)"
                            class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                      Uredi
                    </button>
                  </ng-template>
                </td>
              </tr>

              <!-- JSON detail row -->
              <tr *ngIf="isJson(p.vrednost)" class="bg-gray-50 border-t border-gray-100">
                <td colspan="6" class="px-4 py-2">
                  <details class="text-xs text-gray-500">
                    <summary class="cursor-pointer text-indigo-500 hover:text-indigo-700">
                      Prikaži JSON vrednost ({{ p.kljuc }})
                    </summary>
                    <pre class="mt-2 bg-white border border-gray-200 rounded p-3 overflow-x-auto text-xs text-gray-700">{{ formatJson(p.vrednost) }}</pre>
                  </details>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>

        <div class="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          {{ params().length }} parametrov &nbsp;·&nbsp;
          Spremembe shranijo novo verzijo z datumom veljavnosti (stare vrednosti se ohranijo).
        </div>
      </div>
    </div>
  `,
})
export class PayrollParamsComponent implements OnInit {
  loading = signal(false);
  saving  = signal(false);
  saved   = signal(false);
  error   = signal('');
  params  = signal<ParamRow[]>([]);
  editing = signal<ParamRow | null>(null);
  editValue = '';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<ParamRow[]>(`${API}/payroll-params`).subscribe({
      next: (data) => { this.params.set(data); this.loading.set(false); },
      error: () => { this.error.set('Napaka pri nalaganju parametrov.'); this.loading.set(false); },
    });
  }

  startEdit(p: ParamRow) {
    this.editing.set(p);
    this.editValue = p.vrednost;
    this.saved.set(false);
    this.error.set('');
  }

  cancelEdit() {
    this.editing.set(null);
    this.editValue = '';
  }

  save(p: ParamRow) {
    if (!this.editValue.trim()) return;
    this.saving.set(true);
    this.http.put(`${API}/payroll-params/${encodeURIComponent(p.kljuc)}`, {
      vrednost: this.editValue.trim(),
      opis: p.opis,
      veljavno_od: new Date().toISOString().split('T')[0],
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Napaka pri shranjevanju. Preverite format vrednosti.');
      },
    });
  }

  isJson(val: string): boolean {
    try { JSON.parse(val); return true; } catch { return false; }
  }

  formatJson(val: string): string {
    try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
  }
}
