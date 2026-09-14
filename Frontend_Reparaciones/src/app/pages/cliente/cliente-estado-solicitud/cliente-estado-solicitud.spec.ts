import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteEstadoSolicitud } from './cliente-estado-solicitud';

describe('ClienteEstadoSolicitud', () => {
  let component: ClienteEstadoSolicitud;
  let fixture: ComponentFixture<ClienteEstadoSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteEstadoSolicitud],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteEstadoSolicitud);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
