import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface PayrollLine {
  id: string;
  employee_id: string;
  ime: string;
  priimek: string;
  davcna_stevilka: string;
  trr: string;
  bruto_1: number;
  boniteta_b014: number;
  a071_piz_del: number;
  a072_zz_del: number;
  a072a_ozp_del: number;
  a072b_do_del: number;
  a073_star_del: number;
  a074_zap_del: number;
  davcna_osnova: number;
  dohodnina: number;
  neto_pred_ozp: number;
  neto_po_ozp: number;
  m07_prehrana: number;
  m07_prevoz: number;
  odtegljaji_kredit: number;
  koncno_izplacilo_trr: number;
  a081_piz_del_adr: number;
  a082_do_del_adr: number;
  a083_zz_del_adr: number;
  a084_zap_del_adr: number;
  a085_star_del_adr: number;
  a086_posk_del_adr: number;
  bruto_2_strosek: number;
  m01_redno_znesek: number | null;
  m04_dopust_znesek: number | null;
  m05_bolniska_znesek: number | null;
}

interface PayrollRun {
  id: string;
  leto: number;
  mesec: number;
  datum_izplacila: string;
}

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
    }
  `],
  template: `
    <!-- Print controls — hidden when printing -->
    <div class="no-print p-4 flex gap-3 items-center border-b bg-white sticky top-0 z-10">
      <a [routerLink]="['/payroll', runId, 'progress']"
         class="text-sm text-blue-600 hover:underline">← Nazaj</a>
      <button (click)="print()"
              class="ml-auto bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700">
        🖨️ Natisni / Shrani PDF
      </button>
    </div>

    <div *ngIf="loading()" class="text-center py-16 text-gray-400">Nalaganje plačilne liste...</div>

    <div *ngIf="!loading() && !line()" class="text-center py-16 text-red-500">
      Plačilna lista ne obstaja.
    </div>

    <!-- PAYSLIP — printable area -->
    <div *ngIf="line()" class="max-w-2xl mx-auto p-8 bg-white my-4 shadow print:shadow-none print:my-0">

      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">PLAČILNA LISTA</h2>
          <p class="text-gray-500 mt-1">{{ run()?.mesec }}/{{ run()?.leto }} &nbsp;·&nbsp; Datum izplačila: {{ run()?.datum_izplacila | date:'d. M. yyyy' }}</p>
        </div>
        <div class="text-right text-sm text-gray-500">
          <div class="font-semibold text-gray-700">ePlače 2026</div>
          <div>Obračun plač</div>
        </div>
      </div>

      <!-- Employee -->
      <div class="bg-gray-50 rounded p-4 mb-6">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Delavec:</span>
            <span class="font-semibold ml-2">{{ line()!.priimek }} {{ line()!.ime }}</span>
          </div>
          <div>
            <span class="text-gray-500">Davčna:</span>
            <span class="font-mono ml-2">{{ line()!.davcna_stevilka }}</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500">TRR za nakazilo:</span>
            <span class="font-mono ml-2">{{ line()!.trr }}</span>
          </div>
        </div>
      </div>

      <!-- Calculation table -->
      <table class="w-full text-sm mb-6">
        <tbody>
          <!-- Mode B: parametrična razčlenitev nad BRUTO 1 -->
          <ng-container *ngIf="line()!.m01_redno_znesek !== null">
            <tr class="text-gray-500 text-xs border-b border-dashed border-gray-200">
              <td class="py-1 pl-4 italic">Redno delo</td>
              <td class="py-1 text-right font-mono">{{ line()!.m01_redno_znesek | number:'1.2-2' }} €</td>
            </tr>
            <tr *ngIf="(line()!.m04_dopust_znesek ?? 0) > 0" class="text-gray-500 text-xs">
              <td class="py-1 pl-4 italic">Dopust (100 %)</td>
              <td class="py-1 text-right font-mono">{{ line()!.m04_dopust_znesek | number:'1.2-2' }} €</td>
            </tr>
            <tr *ngIf="(line()!.m05_bolniska_znesek ?? 0) > 0" class="text-gray-500 text-xs">
              <td class="py-1 pl-4 italic">Bolniška del. (80 %)</td>
              <td class="py-1 text-right font-mono">{{ line()!.m05_bolniska_znesek | number:'1.2-2' }} €</td>
            </tr>
          </ng-container>
          <tr class="border-b-2 border-gray-300">
            <td class="py-1.5 font-semibold text-gray-800">BRUTO 1 (osnova)</td>
            <td class="py-1.5 text-right font-mono font-semibold">{{ line()!.bruto_1 | number:'1.2-2' }} €</td>
          </tr>
          <tr *ngIf="line()!.boniteta_b014 > 0" class="text-gray-600">
            <td class="py-1 pl-4">Boniteta vozila</td>
            <td class="py-1 text-right font-mono">{{ line()!.boniteta_b014 | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">PIZ delojemalec (15,50 %)</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a071_piz_del | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">ZZ delojemalec (6,36 %)</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a072_zz_del | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">ZAP delojemalec (0,14 %)</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a074_zap_del | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">STAR delojemalec (0,10 %)</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a073_star_del | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">DO delojemalec (1,00 %)</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a072b_do_del | number:'1.2-2' }} €</td>
          </tr>
          <tr class="border-t border-gray-200 text-gray-500 text-xs">
            <td class="py-1 pl-4 italic">Davčna osnova</td>
            <td class="py-1 text-right font-mono">{{ line()!.davcna_osnova | number:'1.2-2' }} €</td>
          </tr>
          <tr class="text-red-700">
            <td class="py-1 pl-4">Akontacija dohodnine</td>
            <td class="py-1 text-right font-mono">−{{ line()!.dohodnina | number:'1.2-2' }} €</td>
          </tr>
          <tr *ngIf="line()!.a072a_ozp_del > 0" class="text-red-700">
            <td class="py-1 pl-4">OZP odtegljaj</td>
            <td class="py-1 text-right font-mono">−{{ line()!.a072a_ozp_del | number:'1.2-2' }} €</td>
          </tr>
          <tr *ngIf="line()!.odtegljaji_kredit > 0" class="text-red-700">
            <td class="py-1 pl-4">Odtegljaji / krediti</td>
            <td class="py-1 text-right font-mono">−{{ line()!.odtegljaji_kredit | number:'1.2-2' }} €</td>
          </tr>
          <tr class="border-t border-gray-200 font-medium">
            <td class="py-1.5">NETO PLAČA</td>
            <td class="py-1.5 text-right font-mono">{{ line()!.neto_po_ozp | number:'1.2-2' }} €</td>
          </tr>
          <tr *ngIf="line()!.m07_prehrana > 0" class="text-green-700">
            <td class="py-1 pl-4">+ Povračilo prehrane</td>
            <td class="py-1 text-right font-mono">{{ line()!.m07_prehrana | number:'1.2-2' }} €</td>
          </tr>
          <tr *ngIf="line()!.m07_prevoz > 0" class="text-green-700">
            <td class="py-1 pl-4">+ Povračilo prevoza</td>
            <td class="py-1 text-right font-mono">{{ line()!.m07_prevoz | number:'1.2-2' }} €</td>
          </tr>
          <tr class="border-t-2 border-gray-900 bg-green-50">
            <td class="py-2 font-bold text-lg text-gray-900">SKUPAJ ZA NAKAZILO</td>
            <td class="py-2 text-right font-mono font-bold text-lg text-green-700">
              {{ line()!.koncno_izplacilo_trr | number:'1.2-2' }} €
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Employer contributions -->
      <div class="border-t border-gray-200 pt-4">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prispevki delodajalca (informativno)</p>
        <table class="w-full text-xs text-gray-600">
          <tbody>
            <tr><td>PIZ delodajalec (8,85 %)</td><td class="text-right font-mono">{{ line()!.a081_piz_del_adr | number:'1.2-2' }} €</td></tr>
            <tr><td>ZZ delodajalec (6,56 %)</td><td class="text-right font-mono">{{ line()!.a083_zz_del_adr | number:'1.2-2' }} €</td></tr>
            <tr><td>ZAP delodajalec (0,06 %)</td><td class="text-right font-mono">{{ line()!.a084_zap_del_adr | number:'1.2-2' }} €</td></tr>
            <tr><td>STAR delodajalec (0,10 %)</td><td class="text-right font-mono">{{ line()!.a085_star_del_adr | number:'1.2-2' }} €</td></tr>
            <tr><td>Poškodbe pri delu (0,53 %)</td><td class="text-right font-mono">{{ line()!.a086_posk_del_adr | number:'1.2-2' }} €</td></tr>
            <tr><td>DO delodajalec (1,00 %)</td><td class="text-right font-mono">{{ line()!.a082_do_del_adr | number:'1.2-2' }} €</td></tr>
            <tr class="border-t border-gray-200 font-semibold">
              <td class="pt-1">Skupni strošek delodajalca (Bruto 2)</td>
              <td class="pt-1 text-right font-mono">{{ line()!.bruto_2_strosek | number:'1.2-2' }} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        Generiral: ePlače 2026 &nbsp;·&nbsp; {{ today | date:'d. M. yyyy' }}
      </div>
    </div>
  `,
})
export class PayslipComponent implements OnInit {
  line    = signal<PayrollLine | null>(null);
  run     = signal<PayrollRun | null>(null);
  loading = signal(true);
  today   = new Date();

  runId = '';
  employeeId = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.runId     = this.route.snapshot.params['id'];
    this.employeeId = this.route.snapshot.params['empId'];

    this.http.get<PayrollRun>(`${API}/payroll/runs/${this.runId}`).subscribe({
      next: (r) => this.run.set(r),
    });

    this.http.get<PayrollLine[]>(`${API}/payroll/runs/${this.runId}/lines`).subscribe({
      next: (lines) => {
        const found = lines.find(l => l.employee_id === this.employeeId) ?? null;
        this.line.set(found);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  print() { window.print(); }
}
