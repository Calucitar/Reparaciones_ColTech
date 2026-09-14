import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientePago } from './cliente-pago';

describe('ClientePago', () => {
  let component: ClientePago;
  let fixture: ComponentFixture<ClientePago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientePago],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientePago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
