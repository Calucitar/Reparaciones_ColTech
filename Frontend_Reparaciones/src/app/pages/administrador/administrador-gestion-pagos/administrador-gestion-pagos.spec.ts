import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorGestionPagos } from './administrador-gestion-pagos';

describe('AdministradorGestionPagos', () => {
  let component: AdministradorGestionPagos;
  let fixture: ComponentFixture<AdministradorGestionPagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorGestionPagos],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorGestionPagos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
