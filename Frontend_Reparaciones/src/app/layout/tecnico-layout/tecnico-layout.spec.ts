import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TecnicoLayout } from './tecnico-layout';

describe('TecnicoLayout', () => {
  let component: TecnicoLayout;
  let fixture: ComponentFixture<TecnicoLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TecnicoLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(TecnicoLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
