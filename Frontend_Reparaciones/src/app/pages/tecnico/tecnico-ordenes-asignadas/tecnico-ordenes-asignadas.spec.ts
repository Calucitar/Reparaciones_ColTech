import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoOrdenesAsignadas } from './tecnico-ordenes-asignadas';

describe('TecnicoOrdenesAsignadas', () => {
  let component: TecnicoOrdenesAsignadas;
  let fixture: ComponentFixture<TecnicoOrdenesAsignadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoOrdenesAsignadas],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoOrdenesAsignadas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
