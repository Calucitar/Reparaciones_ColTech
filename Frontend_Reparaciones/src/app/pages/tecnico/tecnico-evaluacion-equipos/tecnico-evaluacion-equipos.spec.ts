import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoEvaluacionEquipos } from './tecnico-evaluacion-equipos';

describe('TecnicoEvaluacionEquipos', () => {
  let component: TecnicoEvaluacionEquipos;
  let fixture: ComponentFixture<TecnicoEvaluacionEquipos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoEvaluacionEquipos],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoEvaluacionEquipos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
