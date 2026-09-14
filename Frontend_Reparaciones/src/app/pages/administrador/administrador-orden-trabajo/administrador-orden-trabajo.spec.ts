import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorOrdenTrabajo } from './administrador-orden-trabajo';

describe('AdministradorOrdenTrabajo', () => {
  let component: AdministradorOrdenTrabajo;
  let fixture: ComponentFixture<AdministradorOrdenTrabajo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorOrdenTrabajo],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorOrdenTrabajo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
