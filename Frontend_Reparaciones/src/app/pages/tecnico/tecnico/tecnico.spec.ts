import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tecnico } from './tecnico';

describe('Tecnico', () => {
  let component: Tecnico;
  let fixture: ComponentFixture<Tecnico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tecnico],
    }).compileComponents();

    fixture = TestBed.createComponent(Tecnico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
