import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoPruebasFuncionamiento } from './tecnico-pruebas-funcionamiento';

describe('TecnicoPruebasFuncionamiento', () => {
  let component: TecnicoPruebasFuncionamiento;
  let fixture: ComponentFixture<TecnicoPruebasFuncionamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoPruebasFuncionamiento],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoPruebasFuncionamiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
