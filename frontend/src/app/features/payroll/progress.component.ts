import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription, switchMap, takeWhile, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface PayrollRun {
  id: string;
  leto: number;
  mesec: number;
  datum_izplacila: string;
  status_obracuna: 'Osnutek' | 'Procesiranje' | 'Zakljucen' | 'Napaka';
  progress_procent: number;
  napaka_opis: string | null;
}

interface PayrollLine {
  id: string;
  employee_id: string;
  ime: string;
  priimek: string;
  bruto_1: number;
  dohodnina: number;
  neto_po_ozp: number;
  m07_prehrana: number;
  m07_prevoz: number;
  koncno_izplacilo_trr: number;
  bruto_2_strosek: number;
}

@Component({
  selector: 'app-payroll-progress',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-5">
        <a routerLink="/payroll" class="text-sm text-blue-600 hover:underline">← Nov obračun</a>
        <h1 class="text-xl font-semibold text-gray-900 mt-2">Napredek obračuna</h1>
      </div>

      <div class="max-w-xl">
        <div class="bg-white rounded-lg shadow p-8 text-center">

          <!-- H1 DOKAZ: server je vrnil 202, tukaj vidimo asinhroni progress -->
          <div *ngIf="run()">
            <h2 class="text-xl font-semibold text-gray-800 mb-1">
              Obračun plač {{ run()!.mesec }}/{{ run()!.leto }}
            </h2>
            <p class="text-sm text-gray-500 mb-6">ID: {{ run()!.id.slice(0, 8) }}...</p>

            <!-- Progress bar -->
            <div class="w-full bg-gray-200 rounded-full h-4 mb-3">
              <div
                class="h-4 rounded-full transition-all duration-500"
                [class.bg-blue-600]="run()!.status_obracuna === 'Procesiranje'"
                [class.bg-green-600]="run()!.status_obracuna === 'Zakljucen'"
                [class.bg-red-600]="run()!.status_obracuna === 'Napaka'"
                [style.width.%]="run()!.progress_procent">
              </div>
            </div>

            <p class="text-2xl font-bold mb-2"
               [class.text-blue-600]="run()!.status_obracuna === 'Procesiranje'"
               [class.text-green-600]="run()!.status_obracuna === 'Zakljucen'"
               [class.text-red-600]="run()!.status_obracuna === 'Napaka'">
              {{ run()!.progress_procent }}%
            </p>

            <p class="text-gray-600 mb-2">Status: <strong>{{ run()!.status_obracuna }}</strong></p>

            <div *ngIf="run()!.status_obracuna === 'Procesiranje'" class="text-sm text-gray-500 mb-6">
              Obračun poteka v ozadju. Stran se posodablja vsakih 500ms.
            </div>

            <div *ngIf="run()!.status_obracuna === 'Zakljucen'" class="mt-6">
              <p class="text-green-700 font-medium mb-4">✅ Obračun uspešno zaključen!</p>
              <div class="flex justify-center gap-3 flex-wrap">
                <button (click)="download('sepa')"
                   class="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 font-medium">
                  Izvozi SEPA XML
                </button>
                <button (click)="download('vod')"
                   class="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm hover:bg-indigo-700 font-medium">
                  Izvozi VOD XML
                </button>
                <button (click)="download('rek')"
                   class="bg-emerald-600 text-white px-5 py-2 rounded-md text-sm hover:bg-emerald-700 font-medium">
                  Izvozi REK-O XML
                </button>
              </div>
              <div class="mt-4">
                <button (click)="loadLines()" class="text-sm text-blue-600 hover:underline">
                  Prikaži plačilne liste
                </button>
              </div>
            </div>

            <div *ngIf="run()!.status_obracuna === 'Napaka'" class="mt-4">
              <p class="text-red-700 font-medium">❌ Napaka pri obračunu.</p>
              <p *ngIf="run()!.napaka_opis" class="text-sm text-red-600 mt-1 font-mono">{{ run()!.napaka_opis }}</p>
              <a routerLink="/payroll" class="text-sm text-blue-600 hover:underline mt-2 block">Poskusi znova</a>
            </div>
          </div>

          <div *ngIf="!run()" class="py-8 text-gray-400">Nalaganje...</div>
        </div>

        <!-- Plačilne liste -->
        <div *ngIf="lines().length > 0" class="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h3 class="font-semibold text-gray-800">Plačilne liste</h3>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-2 font-medium text-gray-600">Delavec</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Bruto 1</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Dohodnina</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Neto izplačilo</th>
                <th class="text-right px-4 py-2 font-medium text-gray-600">Skupni strošek</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of lines()" class="border-t hover:bg-gray-50">
                <td class="px-4 py-2">{{ l.priimek }} {{ l.ime }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ l.bruto_1 | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono text-orange-600">{{ l.dohodnina | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono font-medium text-green-700">{{ l.koncno_izplacilo_trr | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono text-gray-600">{{ l.bruto_2_strosek | number:'1.2-2' }} €</td>
                <td class="px-4 py-2">
                  <a [routerLink]="['/payroll', runId, 'payslip', l.employee_id]"
                     class="text-xs text-blue-600 hover:underline whitespace-nowrap">Plačilna lista →</a>
                </td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <tr>
                <td class="px-4 py-2 text-gray-700">Skupaj ({{ lines().length }})</td>
                <td class="px-4 py-2 text-right font-mono">{{ totalBruto() | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono text-orange-600">{{ totalDohodnina() | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono text-green-700">{{ totalKoncno() | number:'1.2-2' }} €</td>
                <td class="px-4 py-2 text-right font-mono text-gray-600">{{ totalStrosek() | number:'1.2-2' }} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class PayrollProgressComponent implements OnInit, OnDestroy {
  run   = signal<PayrollRun | null>(null);
  lines = signal<PayrollLine[]>([]);

  totalBruto    = computed(() => this.lines().reduce((s, l) => s + l.bruto_1, 0));
  totalDohodnina = computed(() => this.lines().reduce((s, l) => s + l.dohodnina, 0));
  totalKoncno   = computed(() => this.lines().reduce((s, l) => s + l.koncno_izplacilo_trr, 0));
  totalStrosek  = computed(() => this.lines().reduce((s, l) => s + l.bruto_2_strosek, 0));

  runId = '';
  private sub?: Subscription;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit() {
    this.runId = this.route.snapshot.params['id'];
    this.startPolling();
  }

  startPolling() {
    // H1 DOKAZ: polling vsakih 500ms, progress narašča do 100
    this.sub = interval(500).pipe(
      switchMap(() => this.http.get<PayrollRun>(`${API}/payroll/runs/${this.runId}`)),
      tap((r) => this.run.set(r)),
      takeWhile((r) => r.status_obracuna === 'Procesiranje', true)
    ).subscribe({
      next: (r) => {
        if (r.status_obracuna === 'Zakljucen') this.loadLines();
      },
      error: () => console.error('[Progress] Polling error'),
    });
  }

  loadLines() {
    this.http.get<any[]>(`${API}/payroll/runs/${this.runId}/lines`).subscribe({
      next: (data) => this.lines.set(data),
    });
  }

  download(type: 'sepa' | 'vod' | 'rek') {
    this.http.get(`${API}/export/${type}/${this.runId}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${this.runId.slice(0, 8)}.xml`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => console.error(`[Export] ${type} failed`, err),
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
