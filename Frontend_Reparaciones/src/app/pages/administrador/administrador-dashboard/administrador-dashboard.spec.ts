import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorDashboard } from './administrador-dashboard';

describe('AdministradorDashboard', () => {
  let component: AdministradorDashboard;
  let fixture: ComponentFixture<AdministradorDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
