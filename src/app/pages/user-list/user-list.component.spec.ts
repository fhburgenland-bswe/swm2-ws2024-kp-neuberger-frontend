import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserListComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads users on init', fakeAsync(() => {
    const mockUsers = [{ id: '1', name: 'A', email: 'a@b' }];
    component.ngOnInit();
    const req = httpMock.expectOne('http://localhost:8080/users');
    req.flush(mockUsers);
    tick();
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBeFalse();
  }));

  it('shows error on GET failure', fakeAsync(() => {
    component.ngOnInit();
    const req = httpMock.expectOne('http://localhost:8080/users');
    req.flush('error', { status: 500, statusText: 'Server Error' });
    tick();
    expect(component.errorMsg).toBe('Daten konnten nicht geladen werden.');
    expect(component.loading).toBeFalse();
  }));

  it('deletes user when confirmed', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.users = [{ id: '1', name: 'A', email: 'a@b' }];
    component.delete(component.users[0]);
    const req = httpMock.expectOne('http://localhost:8080/users/1');
    req.flush({});
    tick();
    expect(component.users.length).toBe(0);
  }));

  it('cancels delete when not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.users = [{ id: '1', name: 'A', email: 'a@b' }];
    component.delete(component.users[0]);
    httpMock.expectNone('http://localhost:8080/users/1');
    expect(component.users.length).toBe(1);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
