import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoReparacionesCurso } from './tecnico-reparaciones-curso';

describe('TecnicoReparacionesCurso', () => {
  let component: TecnicoReparacionesCurso;
  let fixture: ComponentFixture<TecnicoReparacionesCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoReparacionesCurso],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoReparacionesCurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
