import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteCotizacion } from './cliente-cotizacion';

describe('ClienteCotizacion', () => {
  let component: ClienteCotizacion;
  let fixture: ComponentFixture<ClienteCotizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteCotizacion],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteCotizacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
