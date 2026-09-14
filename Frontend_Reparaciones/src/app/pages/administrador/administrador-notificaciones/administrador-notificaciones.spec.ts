import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorNotificaciones } from './administrador-notificaciones';

describe('AdministradorNotificaciones', () => {
  let component: AdministradorNotificaciones;
  let fixture: ComponentFixture<AdministradorNotificaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorNotificaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorNotificaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
