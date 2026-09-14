import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteGenerarSolicitud } from './cliente-generar-solicitud';

describe('ClienteGenerarSolicitud', () => {
  let component: ClienteGenerarSolicitud;
  let fixture: ComponentFixture<ClienteGenerarSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteGenerarSolicitud],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteGenerarSolicitud);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
