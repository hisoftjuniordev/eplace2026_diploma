import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6">
      <div class="mb-5">
        <a routerLink="/employees" class="text-sm text-blue-600 hover:underline">← Nazaj na seznam</a>
        <h1 class="text-xl font-semibold text-gray-900 mt-2">
          {{ isEdit ? 'Uredi delavca' : 'Nov delavec' }}
        </h1>

      </div>

      <div *ngIf="serverError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
        {{ serverError }}
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-lg shadow p-6 space-y-4 max-w-2xl">

          <div class="grid grid-cols-2 gap-4">
            <!-- IME -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ime *</label>
              <input formControlName="ime" type="text"
                class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="f['ime'].invalid && f['ime'].touched" />
              <div *ngIf="f['ime'].invalid && f['ime'].touched" class="text-red-600 text-xs mt-1">
                Ime je obvezno (najmanj 2 znaka)
              </div>
            </div>

            <!-- PRIIMEK -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priimek *</label>
              <input formControlName="priimek" type="text"
                class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                [class.border-red-500]="f['priimek'].invalid && f['priimek'].touched" />
              <div *ngIf="f['priimek'].invalid && f['priimek'].touched" class="text-red-600 text-xs mt-1">
                Priimek je obvezen (najmanj 2 znaka)
              </div>
            </div>
          </div>

          <!-- DAVČNA ŠTEVILKA -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Davčna številka *</label>
            <input formControlName="davcna_stevilka" type="text" maxlength="8"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              [class.border-red-500]="f['davcna_stevilka'].invalid && f['davcna_stevilka'].touched"
              placeholder="12345678" />
            <div *ngIf="f['davcna_stevilka'].invalid && f['davcna_stevilka'].touched" class="text-red-600 text-xs mt-1">
              Davčna mora imeti natanko 8 številk
            </div>
          </div>

          <!-- EMŠO — H2 DOKAZ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">EMŠO *</label>
            <input formControlName="emso" type="text" maxlength="13"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              [class.border-red-500]="f['emso'].invalid && f['emso'].touched"
              placeholder="0101990500006" />
            <div *ngIf="f['emso'].invalid && f['emso'].touched" class="text-red-600 text-xs mt-1">
              EMŠO mora imeti natanko 13 številk
            </div>
          </div>

          <!-- TRR / IBAN -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">TRR (IBAN) *</label>
            <input formControlName="trr" type="text" maxlength="19"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              [class.border-red-500]="f['trr'].invalid && f['trr'].touched"
              placeholder="SI5601000000000100" />
            <div *ngIf="f['trr'].invalid && f['trr'].touched" class="text-red-600 text-xs mt-1">
              IBAN mora biti v obliki SI56 + 15 cifer
            </div>
          </div>

          <!-- NAČIN OBRAČUNA -->
          <div class="pt-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">Način obračuna *</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" [checked]="nacin === 'fiksni'" (change)="setNacin('fiksni')" class="text-blue-600" />
                Fiksni bruto
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" [checked]="nacin === 'urni'" (change)="setNacin('urni')" class="text-blue-600" />
                Urna postavka
              </label>
            </div>
          </div>

          <!-- BRUTO OSNOVA (Mode A) -->
          <div *ngIf="nacin === 'fiksni'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Bruto osnova (€) *</label>
            <input formControlName="bruto_osnova" type="number" step="0.01" min="0.01"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="f['bruto_osnova'].invalid && f['bruto_osnova'].touched"
              placeholder="2000.00" />
            <div *ngIf="f['bruto_osnova'].invalid && f['bruto_osnova'].touched" class="text-red-600 text-xs mt-1">
              Bruto mora biti večje od 0
            </div>
          </div>

          <!-- URNA POSTAVKA (Mode B) -->
          <div *ngIf="nacin === 'urni'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Urna postavka (€/h) *</label>
            <input formControlName="urna_postavka" type="number" step="0.01" min="8.56"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="f['urna_postavka'].invalid && f['urna_postavka'].touched"
              placeholder="10.00" />
            <div *ngIf="f['urna_postavka'].invalid && f['urna_postavka'].touched" class="text-red-600 text-xs mt-1">
              Urna postavka mora biti ≥ 8,56 € (minimalna 2026)
            </div>
            <p class="text-xs text-gray-400 mt-1">Bruto se izračuna iz opravljenih ur (redno × 100 %, dopust × 100 %, bolniška × 80 %)</p>
          </div>

          <!-- OLAJŠAVA VZDRŽEVANO -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Olajšava vzdrževani (€)</label>
            <input formControlName="olajsava_vzdrzevani_znesek" type="number" step="0.01" min="0"
              class="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              [class.border-red-500]="f['olajsava_vzdrzevani_znesek'].invalid && f['olajsava_vzdrzevani_znesek'].touched"
              placeholder="0.00" />
            <div *ngIf="f['olajsava_vzdrzevani_znesek'].invalid && f['olajsava_vzdrzevani_znesek'].touched" class="text-red-600 text-xs mt-1">
              Ne sme biti negativno
            </div>
          </div>

          <!-- Checkboxes -->
          <div class="grid grid-cols-2 gap-4 pt-2">
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input formControlName="a031_zavezanec_ozp" type="checkbox" class="rounded" />
              Zavezanec OZP (35€)
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input formControlName="glavni_delodajalec" type="checkbox" class="rounded" />
              Glavni delodajalec (splošna olajšava)
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input formControlName="aktivno" type="checkbox" class="rounded" />
              Aktiven (vključen v obračun)
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <a routerLink="/employees"
               class="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-50">
              Prekliči
            </a>
            <!-- H2 DOKAZ: disabled dokler form.invalid -->
            <button type="submit"
              [disabled]="form.invalid || loading"
              class="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {{ loading ? 'Shranjevanje...' : 'Shrani' }}
            </button>
          </div>

          <p class="text-xs text-gray-400 text-center" *ngIf="form.invalid">
            Izpolnite vsa obvezna polja pravilno za aktiviranje gumba Shrani
          </p>
      </form>
    </div>
  `,
})
export class EmployeeFormComponent implements OnInit {
  nacin: 'fiksni' | 'urni' = 'fiksni';

  form = this.fb.group({
    ime:                         [null as string | null, [Validators.required, Validators.minLength(2)]],
    priimek:                     [null as string | null, [Validators.required, Validators.minLength(2)]],
    davcna_stevilka:             [null as string | null, [Validators.required, Validators.pattern(/^\d{8}$/)]],
    emso:                        [null as string | null, [Validators.required, Validators.pattern(/^\d{13}$/)]],
    trr:                         [null as string | null, [Validators.required, Validators.pattern(/^SI56\d{15}$/)]],
    bruto_osnova:                [null as number | null, [Validators.min(0)]],
    urna_postavka:               [null as number | null, [Validators.min(8.56)]],
    olajsava_vzdrzevani_znesek:  [0, [Validators.required, Validators.min(0)]],
    a031_zavezanec_ozp:          [true],
    glavni_delodajalec:          [true],
    aktivno:                     [true],
  });

  get f() { return this.form.controls; }

  isEdit = false;
  loading = false;
  serverError = '';
  private empId?: string;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  setNacin(n: 'fiksni' | 'urni') {
    this.nacin = n;
    if (n === 'fiksni') {
      this.form.patchValue({ urna_postavka: null });
      this.f['bruto_osnova'].setValidators([Validators.required, Validators.min(0.01)]);
      this.f['urna_postavka'].clearValidators();
    } else {
      this.form.patchValue({ bruto_osnova: 0 });
      this.f['urna_postavka'].setValidators([Validators.required, Validators.min(8.56)]);
      this.f['bruto_osnova'].clearValidators();
    }
    this.f['bruto_osnova'].updateValueAndValidity();
    this.f['urna_postavka'].updateValueAndValidity();
  }

  ngOnInit() {
    this.setNacin('fiksni');
    this.empId = this.route.snapshot.params['id'];
    this.isEdit = !!this.empId;
    if (this.isEdit) {
      this.http.get<any>(`${API}/employees/${this.empId}`).subscribe({
        next: (emp) => {
          this.nacin = emp.urna_postavka ? 'urni' : 'fiksni';
          this.setNacin(this.nacin);
          this.form.patchValue(emp);
        },
        error: () => this.router.navigate(['/employees']),
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.serverError = '';

    const body = { ...this.form.value };
    if (this.nacin === 'fiksni') {
      body['urna_postavka'] = null;
    } else {
      body['bruto_osnova'] = 0;
    }

    const req$ = this.isEdit
      ? this.http.put(`${API}/employees/${this.empId}`, body)
      : this.http.post(`${API}/employees`, body);

    req$.subscribe({
      next: () => this.router.navigate(['/employees']),
      error: (err) => {
        this.serverError = err?.error?.error ?? 'Napaka pri shranjevanju';
        this.loading = false;
      },
    });
  }
}
