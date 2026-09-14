import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteNotificacion } from './cliente-notificacion';

describe('ClienteNotificacion', () => {
  let component: ClienteNotificacion;
  let fixture: ComponentFixture<ClienteNotificacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteNotificacion],
    }).compileComponents();

    fixture = TestBed.createComponent(ClienteNotificacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
