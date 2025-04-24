// src/app/components/user-create/user-create.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserCreateComponent } from './user-create.component';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

describe('UserCreateComponent', () => {
  let component: UserCreateComponent;
  let fixture: ComponentFixture<UserCreateComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['createUser']);
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        UserCreateComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserCreateComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('submits and navigates on success', fakeAsync(() => {
    const userData = { name: 'Max Mustermann', email: 'max@example.com' };
    component.form.setValue(userData);
    userService.createUser.and.returnValue(of({ id: '1', ...userData }));

    spyOn(window, 'alert');
    component.onSubmit();
    tick();

    expect(userService.createUser).toHaveBeenCalledWith(userData);
    expect(window.alert).toHaveBeenCalledWith('Benutzer angelegt');
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
  }));

  it('shows conflict error on 409', fakeAsync(() => {
    component.form.setValue({ name: 'Anna', email: 'anna@example.com' });
    const conflictError = new HttpErrorResponse({ status: 409 });
    userService.createUser.and.returnValue(throwError(() => conflictError));

    component.onSubmit();
    tick();

    expect(component.form.get('email')?.hasError('conflict')).toBeTrue();
  }));

  it('shows generic error on 500', fakeAsync(() => {
    component.form.setValue({ name: 'Test', email: 'test@example.com' });
    const serverError = new HttpErrorResponse({ status: 500 });
    userService.createUser.and.returnValue(throwError(() => serverError));

    component.onSubmit();
    tick();

    expect(component.apiError).toBe('Ein unerwarteter Fehler ist aufgetreten.');
  }));
});
