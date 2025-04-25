import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ActivatedRoute, convertToParamMap} from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Book} from '../../models/book.model';
import {BookService} from '../../services/book.srvice';

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let comp: UserDetailComponent;
  let userService: jasmine.SpyObj<UserService>;
  let bookServiceSpy: jasmine.SpyObj<BookService>;

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
  const mockBook: Book = {
    id: 'b1',
    isbn: '123',
    title: 'Test Book',
    authors: [],
    publisher: '',
    publishedDate: '',
    description: '',
    coverUrl: '',
    rating: null,
    reviews: []
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUserById', 'updateUser']);
    userServiceSpy.getUserById.and.returnValue(of(mockUser));
    userServiceSpy.updateUser.and.returnValue(of({ ...mockUser, name: 'Updated', email: 'updated@example.com' }));
    bookServiceSpy = jasmine.createSpyObj<BookService>('BookService', ['addBookByIsbn', 'deleteBook']);
    await TestBed.configureTestingModule({
      imports: [
        UserDetailComponent,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: BookService, useValue: bookServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ userId: 'abc' }))
          }
        },
        FormBuilder,
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(UserDetailComponent);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    comp = fixture.componentInstance;
    fixture.detectChanges();
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

  it('should add a book on valid ISBN', fakeAsync(() => {
    bookServiceSpy.addBookByIsbn.and.returnValue(of(mockBook));
    fixture.detectChanges();
    tick();
    comp.isbnForm.setValue({ isbn: '1' });
    comp.addBook();
    tick();
    expect(bookServiceSpy.addBookByIsbn).toHaveBeenCalledWith('abc', '1');
    expect(comp.user!.books).toContain(mockBook);
    expect(comp.addError).toBeNull();
    expect(comp.isbnForm.value.isbn).toBeNull();
  }));

  it('should show error message on book add failure (500)', fakeAsync(() => {
    bookServiceSpy.addBookByIsbn.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    tick();
    comp.isbnForm.setValue({ isbn: '999' });
    comp.addBook();
    tick();
    expect(bookServiceSpy.addBookByIsbn).toHaveBeenCalled();
    expect(comp.addError).toBe('Fehler beim Abrufen der Buchdaten');
  }));

  it('should show validation error on empty ISBN', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    comp.isbnForm.setValue({ isbn: '' });
    comp.addBook();
    expect(bookServiceSpy.addBookByIsbn).not.toHaveBeenCalled();
    expect(comp.addError).toBeNull();
  }));

  it('should delete a book after confirmation and show success message', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    bookServiceSpy.deleteBook.and.returnValue(of(void 0));
    const initialCount = comp.user!.books.length;
    const isbnToDelete = comp.user!.books[0].isbn;
    comp.deleteBook(isbnToDelete);
    tick();
    expect(bookServiceSpy.deleteBook).toHaveBeenCalledWith('abc', isbnToDelete);
    expect(comp.user!.books.length).toBe(initialCount - 1);
    expect(comp.user!.books.some(b => b.isbn === isbnToDelete)).toBeFalse();
    expect(comp.deleteSuccess).toBe('Buch gelöscht');
    expect(comp.addError).toBeNull();
  }));

  it('should show error message if delete fails', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    bookServiceSpy.deleteBook.and.returnValue(throwError(() => ({ status: 500 })));
    comp.user = {
      id: 'abc',
      name: 'Test User',
      email: 'test@example.com',
      books: [
        {
          isbn: '123',
          title: 'Book',
          authors: [],
          publisher: '',
          publishedDate: '',
          description: '',
          coverUrl: '',
          rating: 4,
          reviews: []
        }
      ]
    };
    const isbn = comp.user.books[0].isbn;
    comp.deleteBook(isbn);
    tick();
    expect(bookServiceSpy.deleteBook).toHaveBeenCalled();
    expect(comp.addError).toBe('Löschen fehlgeschlagen');
  }));
});
