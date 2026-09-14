import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdministradorUsuarios } from './administrador-usuarios';

describe('AdministradorUsuarios', () => {
  let component: AdministradorUsuarios;
  let fixture: ComponentFixture<AdministradorUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorUsuarios],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorUsuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
