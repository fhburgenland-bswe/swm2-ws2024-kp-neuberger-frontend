import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the HomeComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should render the welcome title', () => {
    const h1 = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(h1).toBeTruthy();
    expect(h1.textContent).toContain('Willkommen beim Bookmanager');
  });

  it('should render the description paragraph', () => {
    const p = fixture.nativeElement.querySelector('p') as HTMLElement;
    expect(p).toBeTruthy();
    expect(p.textContent).toContain('Verwalte deine Bücher');
  });

  it('should have a button that navigates to /users/create', () => {
    const btnDe = fixture.debugElement.query(By.css('button'));
    expect(btnDe).toBeTruthy();
    expect(btnDe.attributes['ng-reflect-router-link']).toBe('/users/create');
  });
});
