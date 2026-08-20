import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface HoursRow {
  employee_id: string;
  ime: string;
  priimek: string;
  bruto_osnova: number;
  urna_postavka: number | null;
  hours_id: string | null;
  m01_redno_ure: number;
  m02_refund_ure: number;
  m03_nadure_ure: number;
  m04_dopust_ure: number;
  m05_bolniske_ure: number;
  m06_odsot_ure: number;
  m07_preh_dnevi: number;
  m07_prevoz_km: number;
  odtegljaji_kred: number;
  // UI state
  saving?: boolean;
  saved?: boolean;
  error?: string;
}

@Component({
  selector: 'app-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Mesečne ure</h1>
          <p class="text-sm text-gray-500 mt-0.5">Vnos ur, prehrane in prevoza po delavcu</p>
        </div>

        <!-- Mesec/leto izbirnik -->
        <div class="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
          <label class="text-sm text-gray-600 font-medium">Mesec:</label>
          <select [(ngModel)]="selectedMesec" (ngModelChange)="load()"
                  class="text-sm border-0 outline-none text-gray-800 bg-transparent">
            <option *ngFor="let m of meseci" [ngValue]="m.value">{{ m.label }}</option>
          </select>
          <label class="text-sm text-gray-600 font-medium ml-2">Leto:</label>
          <select [(ngModel)]="selectedLeto" (ngModelChange)="load()"
                  class="text-sm border-0 outline-none text-gray-800 bg-transparent">
            <option *ngFor="let l of leta" [ngValue]="l">{{ l }}</option>
          </select>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading()" class="text-center py-16 text-gray-400">Nalaganje...</div>

      <!-- Empty state -->
      <div *ngIf="!loading() && rows().length === 0"
           class="text-center py-16 text-gray-400">
        Ni delavcev. Dodajte delavce v razdelku Delavci.
      </div>

      <!-- Tabela ur -->
      <div *ngIf="!loading() && rows().length > 0"
           class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600 min-w-[140px]">Delavec</th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-20">
                Redno<br><span class="font-normal text-xs text-gray-400">(ure)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-20">
                Refundacija<br><span class="font-normal text-xs text-gray-400">(ure, ZZZS)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-20">
                Nadure<br><span class="font-normal text-xs text-gray-400">(ure)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-blue-600 w-20">
                Dopust<br><span class="font-normal text-xs text-blue-400">(ure)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-blue-600 w-20">
                Bolniška del.<br><span class="font-normal text-xs text-blue-400">(ure, 80 %)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-20">
                Odsotnost<br><span class="font-normal text-xs text-gray-400">(ure)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-20">
                Prehrana<br><span class="font-normal text-xs text-gray-400">(dni)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-24">
                Prevoz<br><span class="font-normal text-xs text-gray-400">(km/dan)</span>
              </th>
              <th class="text-center px-3 py-3 font-medium text-gray-600 w-24">
                Odtegljaj<br><span class="font-normal text-xs text-gray-400">(€)</span>
              </th>
              <th class="px-3 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows()" class="border-t border-gray-100 hover:bg-gray-50">

              <!-- Ime delavca -->
              <td class="px-4 py-2">
                <div class="font-medium text-gray-800">{{ row.priimek }} {{ row.ime }}</div>
                <div class="text-xs text-gray-400">
                  <ng-container *ngIf="row.urna_postavka; else fiksniLabel">
                    {{ row.urna_postavka | number:'1.4-4' }} €/h (urni)
                  </ng-container>
                  <ng-template #fiksniLabel>{{ row.bruto_osnova | number:'1.2-2' }} € bruto</ng-template>
                </div>
              </td>

              <!-- m01 redno ure -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m01_redno_ure" min="0" max="250"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m02 bolniška -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m02_refund_ure" min="0" max="250"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m03 nadure -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m03_nadure_ure" min="0" max="100"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m04 dopust (Mode B) -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m04_dopust_ure" min="0" max="250"
                  [class.opacity-30]="!row.urna_postavka"
                  [title]="row.urna_postavka ? 'Ure letnega dopusta (100 %)' : 'Velja le za urne delavce'"
                  class="w-full text-center border border-blue-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m05 bolniška (Mode B) -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m05_bolniske_ure" min="0" max="250"
                  [class.opacity-30]="!row.urna_postavka"
                  [title]="row.urna_postavka ? 'Ure bolniške odsotnosti (80 %, breme delodajalca, dnevi 1–30)' : 'Velja le za urne delavce'"
                  class="w-full text-center border border-blue-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m06 odsotnost -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m06_odsot_ure" min="0" max="250"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m07 prehrana -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m07_preh_dnevi" min="0" max="31"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- m07 prevoz km -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.m07_prevoz_km" min="0" max="999" step="0.1"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- odtegljaji -->
              <td class="px-3 py-2">
                <input type="number" [(ngModel)]="row.odtegljaji_kred" min="0" step="0.01"
                  class="w-full text-center border border-gray-200 rounded px-2 py-1 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" />
              </td>

              <!-- Gumb Shrani -->
              <td class="px-3 py-2 text-right">
                <div class="flex items-center justify-end gap-2">
                  <span *ngIf="row.saved" class="text-xs text-green-600">✓ Shranjeno</span>
                  <span *ngIf="row.error" class="text-xs text-red-500">Napaka!</span>
                  <button (click)="save(row)"
                          [disabled]="row.saving"
                          class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded
                                 hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
                    {{ row.saving ? '...' : 'Shrani' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Footer: Shrani vse -->
        <div class="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <span class="text-xs text-gray-400">
            {{ rows().length }} delavcev za {{ selectedMesec }}/{{ selectedLeto }}
          </span>
          <button (click)="saveAll()"
                  [disabled]="savingAll()"
                  class="bg-green-600 text-white text-sm px-5 py-2 rounded-md
                         hover:bg-green-700 disabled:opacity-50 transition-colors font-medium">
            {{ savingAll() ? 'Shranjujem...' : 'Shrani vse' }}
          </button>
        </div>
      </div>

      <!-- Legenda -->
      <div class="mt-4 text-xs text-gray-400 space-y-0.5">
        <p>Prehrana: 7,96 €/dan &nbsp;|&nbsp; Prevoz: 0,21 €/km &nbsp;|&nbsp; Redno: tipično 174 ur/mesec</p>
        <p><span class="text-blue-400">Dopust</span> in <span class="text-blue-400">Bolniška</span> (modri stolpci) so aktivni le za urne delavce — dopust se plača 100 %, bolniška 80 % (ZDR-1, dnevi 1–30).</p>
        <p>Po shranjevanju sprožite obračun v razdelku Obračun plač.</p>
      </div>
    </div>
  `,
})
export class HoursComponent implements OnInit {
  loading   = signal(false);
  savingAll = signal(false);
  rows      = signal<HoursRow[]>([]);

  selectedMesec = new Date().getMonth() + 1;
  selectedLeto  = new Date().getFullYear();

  meseci = [
    { value: 1,  label: 'Januar'   },
    { value: 2,  label: 'Februar'  },
    { value: 3,  label: 'Marec'    },
    { value: 4,  label: 'April'    },
    { value: 5,  label: 'Maj'      },
    { value: 6,  label: 'Junij'    },
    { value: 7,  label: 'Julij'    },
    { value: 8,  label: 'Avgust'   },
    { value: 9,  label: 'September'},
    { value: 10, label: 'Oktober'  },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  get leta() {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<{ leto: number; mesec: number; employees: HoursRow[] }>(
      `${API}/hours?leto=${this.selectedLeto}&mesec=${this.selectedMesec}`
    ).subscribe({
      next: (res) => {
        this.rows.set(res.employees.map(r => ({
          ...r,
          m04_dopust_ure:   r.m04_dopust_ure   ?? 0,
          m05_bolniske_ure: r.m05_bolniske_ure ?? 0,
          saving: false, saved: false, error: '',
        })));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  private patchRow(id: string, patch: Partial<HoursRow>): void {
    this.rows.update(rows => rows.map(r => r.employee_id === id ? { ...r, ...patch } : r));
  }

  private buildBody(row: HoursRow) {
    return {
      employee_id:      row.employee_id,
      leto:             this.selectedLeto,
      mesec:            this.selectedMesec,
      m01_redno_ure:    row.m01_redno_ure,
      m02_refund_ure:   row.m02_refund_ure,
      m03_nadure_ure:   row.m03_nadure_ure,
      m04_dopust_ure:   row.m04_dopust_ure,
      m05_bolniske_ure: row.m05_bolniske_ure,
      m06_odsot_ure:    row.m06_odsot_ure,
      m07_preh_dnevi:   row.m07_preh_dnevi,
      m07_prevoz_km:    row.m07_prevoz_km,
      odtegljaji_kred:  row.odtegljaji_kred,
    };
  }

  save(row: HoursRow) {
    const id = row.employee_id;
    this.patchRow(id, { saving: true, saved: false, error: '' });
    this.http.post(`${API}/hours`, this.buildBody(row)).subscribe({
      next: () => {
        this.patchRow(id, { saving: false, saved: true });
        setTimeout(() => this.patchRow(id, { saved: false }), 3000);
      },
      error: () => this.patchRow(id, { saving: false, error: 'Napaka!' }),
    });
  }

  saveAll() {
    this.savingAll.set(true);
    const all = this.rows();
    if (all.length === 0) { this.savingAll.set(false); return; }
    this.rows.update(rows => rows.map(r => ({ ...r, saving: true, saved: false, error: '' })));
    let done = 0;
    for (const row of all) {
      const id = row.employee_id;
      this.http.post(`${API}/hours`, this.buildBody(row)).subscribe({
        next: () => {
          this.patchRow(id, { saving: false, saved: true });
          setTimeout(() => this.patchRow(id, { saved: false }), 3000);
          if (++done === all.length) this.savingAll.set(false);
        },
        error: () => {
          this.patchRow(id, { saving: false, error: 'Napaka!' });
          if (++done === all.length) this.savingAll.set(false);
        },
      });
    }
  }
}
