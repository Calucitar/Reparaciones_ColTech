import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoCotizaciones } from './tecnico-cotizaciones';

describe('TecnicoCotizaciones', () => {
  let component: TecnicoCotizaciones;
  let fixture: ComponentFixture<TecnicoCotizaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoCotizaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoCotizaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
