import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorTickets } from './administrador-tickets';

describe('AdministradorTickets', () => {
  let component: AdministradorTickets;
  let fixture: ComponentFixture<AdministradorTickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorTickets],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorTickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
