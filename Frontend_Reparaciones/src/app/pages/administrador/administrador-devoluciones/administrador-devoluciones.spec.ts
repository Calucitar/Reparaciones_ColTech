import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorDevoluciones } from './administrador-devoluciones';

describe('AdministradorDevoluciones', () => {
  let component: AdministradorDevoluciones;
  let fixture: ComponentFixture<AdministradorDevoluciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorDevoluciones],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorDevoluciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
