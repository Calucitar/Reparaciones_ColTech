import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reparaciones } from './reparaciones';

describe('Reparaciones', () => {
  let component: Reparaciones;
  let fixture: ComponentFixture<Reparaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reparaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Reparaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
