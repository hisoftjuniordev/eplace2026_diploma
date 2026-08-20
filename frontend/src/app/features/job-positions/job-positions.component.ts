import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface JobPosition {
  id: string;
  naziv_delovnega_mesta: string;
  tarifni_razred: number;
  zahtevana_izobrazba: string | null;
  aktivno: boolean;
}

@Component({
  selector: 'app-job-positions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900">Delovna mesta</h1>
          <p class="text-sm text-gray-500 mt-0.5">Upravljanje delovnih mest in tarifnih razredov</p>
        </div>
        <button (click)="showForm.set(!showForm())"
                class="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          {{ showForm() ? 'Zapri' : '+ Novo delovno mesto' }}
        </button>
      </div>

      <!-- Add form -->
      <div *ngIf="showForm()" class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-base font-semibold text-gray-800 mb-4">Novo delovno mesto</h3>
        <form [formGroup]="form" (ngSubmit)="add()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Naziv delovnega mesta *</label>
              <input formControlName="naziv_delovnega_mesta" type="text"
                class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="npr. Razvijalec programske opreme" />
              <p *ngIf="form.get('naziv_delovnega_mesta')?.invalid && form.get('naziv_delovnega_mesta')?.touched"
                 class="text-red-500 text-xs mt-1">Naziv je obvezen.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tarifni razred * (1–9)</label>
              <input formControlName="tarifni_razred" type="number" min="1" max="9"
                class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Zahtevana izobrazba</label>
              <input formControlName="zahtevana_izobrazba" type="text"
                class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="npr. Visokošolska izobrazba" />
            </div>
          </div>
          <div *ngIf="addError()" class="text-red-500 text-sm">{{ addError() }}</div>
          <div class="flex justify-end gap-3">
            <button type="button" (click)="showForm.set(false)"
                    class="px-4 py-2 text-sm border rounded-md text-gray-600 hover:bg-gray-50">Prekliči</button>
            <button type="submit" [disabled]="form.invalid || adding()"
                    class="bg-blue-600 text-white px-5 py-2 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
              {{ adding() ? 'Shranjujem...' : 'Dodaj' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="text-center py-12 text-gray-400">Nalaganje...</div>

      <!-- Empty -->
      <div *ngIf="!loading() && positions().length === 0"
           class="text-center py-12 text-gray-400">
        Ni delovnih mest. Dodajte prvo delovno mesto.
      </div>

      <!-- Table -->
      <div *ngIf="!loading() && positions().length > 0"
           class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Naziv</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 w-28">Tarifni razred</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Izobrazba</th>
              <th class="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of positions()" class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-800">{{ p.naziv_delovnega_mesta }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded">
                  R{{ p.tarifni_razred }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ p.zahtevana_izobrazba ?? '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button (click)="remove(p.id)"
                        class="text-xs text-red-500 hover:text-red-700 transition-colors">
                  Izbriši
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class JobPositionsComponent implements OnInit {
  loading   = signal(false);
  adding    = signal(false);
  showForm  = signal(false);
  positions = signal<JobPosition[]>([]);
  addError  = signal('');

  form = this.fb.group({
    naziv_delovnega_mesta: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    tarifni_razred:        [1, [Validators.required, Validators.min(1), Validators.max(9)]],
    zahtevana_izobrazba:   [''],
  });

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<JobPosition[]>(`${API}/job-positions`).subscribe({
      next: (data) => { this.positions.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  add() {
    if (this.form.invalid) return;
    this.adding.set(true);
    this.addError.set('');
    const { naziv_delovnega_mesta, tarifni_razred, zahtevana_izobrazba } = this.form.value;
    const body = {
      naziv_delovnega_mesta,
      tarifni_razred: Number(tarifni_razred),
      zahtevana_izobrazba: zahtevana_izobrazba || undefined,
    };
    this.http.post<JobPosition>(`${API}/job-positions`, body).subscribe({
      next: (p) => {
        this.positions.update(ps => [...ps, p]);
        this.form.reset({ tarifni_razred: 1 });
        this.showForm.set(false);
        this.adding.set(false);
      },
      error: (err) => {
        this.addError.set(err?.error?.error ?? 'Napaka pri dodajanju');
        this.adding.set(false);
      },
    });
  }

  remove(id: string) {
    this.http.delete(`${API}/job-positions/${id}`).subscribe({
      next: () => this.positions.update(ps => ps.filter(p => p.id !== id)),
    });
  }
}
