import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let comp: UserDetailComponent;
  let userService: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: 'abc',
    name: 'Max Mustfrau',
    email: 'max@mustfrau.de',
    books: [
      {
        isbn: '10',
        title: 'Book A',
        authors: [],
        publisher: '',
        publishedDate: '',
        description: '',
        coverUrl: '',
        rating: 5,
        reviews: []
      }
    ]
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUserById', 'updateUser']);
    userServiceSpy.getUserById.and.returnValue(of(mockUser));
    userServiceSpy.updateUser.and.returnValue(of({ ...mockUser, name: 'Updated', email: 'updated@example.com' }));

    await TestBed.configureTestingModule({
      imports: [
        UserDetailComponent,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'abc' } } } },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    comp = fixture.componentInstance;
    fixture.detectChanges(); // trigger ngOnInit and initForm
  });

  it('loading user and books', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(comp.user).toEqual(mockUser);
    expect(comp.loading).toBeFalse();
  }));

  it('should show error message when error occurs', fakeAsync(() => {
    userService.getUserById.and.returnValue(throwError(() => new Error()));
    comp.ngOnInit();
    tick();
    expect(comp.errorMsg).toBe('Benutzerdaten konnten nicht geladen werden.');
    expect(comp.loading).toBeFalse();
  }));

  it('should call updateUser and show success message on save', fakeAsync(() => {
    comp.toggleEdit();
    comp.profileForm.controls['name'].setValue('Updated');
    comp.profileForm.controls['email'].setValue('updated@example.com');

    comp.saveProfile();
    tick();

    expect(userService.updateUser).toHaveBeenCalledWith('abc', {
      name: 'Updated',
      email: 'updated@example.com'
    });
    expect(comp.successMsg).toBe('Profil aktualisiert');
    expect(comp.editing).toBeFalse();
  }));

  it('should handle conflict error on save', fakeAsync(() => {
    userService.updateUser.and.returnValue(throwError(() => ({ status: 409 })));
    comp.toggleEdit();
    comp.profileForm.controls['name'].setValue('Name');
    comp.profileForm.controls['email'].setValue('conflict@example.com');

    comp.saveProfile();
    tick();

    expect(comp.profileForm.controls['email'].hasError('conflict')).toBeTrue();
    expect(comp.successMsg).toBeNull();
  }));

  it('should handle server error on save', fakeAsync(() => {
    userService.updateUser.and.returnValue(throwError(() => ({ status: 500 })));
    comp.toggleEdit();
    comp.profileForm.controls['name'].setValue('Name');
    comp.profileForm.controls['email'].setValue('user@example.com');

    comp.saveProfile();
    tick();

    expect(comp.errorMsg).toBe('Profil konnte nicht aktualisiert werden.');
    expect(comp.successMsg).toBeNull();
  }));
});
