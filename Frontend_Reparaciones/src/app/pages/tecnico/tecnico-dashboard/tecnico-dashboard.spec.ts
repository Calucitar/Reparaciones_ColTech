import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoDashboard } from './tecnico-dashboard';

describe('TecnicoDashboard', () => {
  let component: TecnicoDashboard;
  let fixture: ComponentFixture<TecnicoDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
