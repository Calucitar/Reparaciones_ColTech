import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdministradorCotizaciones } from './administrador-cotizaciones';

describe('AdministradorCotizaciones', () => {
  let component: AdministradorCotizaciones;
  let fixture: ComponentFixture<AdministradorCotizaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministradorCotizaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministradorCotizaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});