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
    const userServiceSpy = jasmine.createSpyObj<UserService>(
        'UserService',
        ['getUserById', 'updateUser']
    );
    userServiceSpy.getUserById.and.callFake(() => {
      const userClone = {
        ...mockUser,
        books: mockUser.books.map(b => ({ ...b }))
      };
      return of(userClone);
    });
    userServiceSpy.updateUser.and.returnValue(of({
      ...mockUser,
      name: 'Updated',
      email: 'updated@example.com'
    }));
    bookServiceSpy = jasmine.createSpyObj<BookService>(
        'BookService',
        ['addBookByIsbn', 'deleteBook', 'getReviews', 'searchBooks','getBooks' ]
    );

    await TestBed.configureTestingModule({
      imports: [ UserDetailComponent, HttpClientTestingModule, ReactiveFormsModule ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: BookService, useValue: bookServiceSpy },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ userId: 'abc' })) } },
        FormBuilder
      ]
    }).compileComponents();

    fixture     = TestBed.createComponent(UserDetailComponent);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    comp        = fixture.componentInstance;
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
    comp.user = {
      id: 'abc',
      name: 'Test User',
      email: 'test@example.com',
      books: [
        {
          isbn: '123',
          title: 'Test Book',
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

  it('should load reviews on first toggle', fakeAsync(() => {
    const mockReviews = [
      { id: 'r1', rating: 4, reviewText: 'Great!' },
      { id: 'r2', rating: 3, reviewText: 'Good' }
    ];
    bookServiceSpy.getReviews.and.returnValue(of(mockReviews));
    expect(comp.reviewsMap['10']).toBeUndefined();
    expect(comp.showReviewsFor).toBeNull();
    comp.toggleReviews('10');
    tick();
    expect(bookServiceSpy.getReviews).toHaveBeenCalledWith('abc', '10');
    expect(comp.reviewsMap['10']).toBe(mockReviews);
    expect(comp.showReviewsFor).toBe('10');
  }));

  it('should collapse reviews when toggled again', () => {
    comp.showReviewsFor = '10';
    comp.toggleReviews('10');
    expect(comp.showReviewsFor).toBeNull();
  });

  it('should show error message when reviews fail to load', fakeAsync(() => {
    bookServiceSpy.getReviews.and.returnValue(throwError(() => ({ status: 500 })));

    comp.toggleReviews('10');
    tick();

    expect(bookServiceSpy.getReviews).toHaveBeenCalled();
    expect(comp.reviewsMap['10']).toEqual([]);  // you probably clear to empty on error
    expect(comp.reviewsError).toBe('Rezensionen konnten nicht geladen werden.');
  }));

  it('should call searchBooks and update the list', fakeAsync(() => {
    const filtered: Book[] = [
      {
        isbn: '123',
        title: 'Gefiltertes Buch',
        authors: [],
        publisher: '',
        publishedDate: '',
        description: '',
        coverUrl: '',
        rating: 4,
        reviews: []
      }
    ];
    bookServiceSpy.searchBooks.and.returnValue(of(filtered));

    comp.user = mockUser;
    comp.initSearchForm();
    comp.searchForm.setValue({ title: 'A', author: '', year: null });

    comp.searchBooks();
    tick();

    // @ts-expect-error: spying on overloaded method
    expect(bookServiceSpy.searchBooks).toHaveBeenCalledWith('abc', 'A', '', null);
    expect(comp.user!.books).toEqual(filtered);
    expect(comp.noBooksFound).toBeFalse();
  }));


  it('should set noBooksFound when search returns empty', fakeAsync(() => {
    bookServiceSpy.searchBooks.and.returnValue(of([]));

    comp.user = mockUser;
    comp.initSearchForm();
    comp.searchForm.setValue({ title: 'ZZZ', author: '', year: null });

    comp.searchBooks();
    tick();

    expect(comp.user!.books).toEqual([]);
    expect(comp.noBooksFound).toBeTrue();
  }));

  it('should reset filters and restore original list', fakeAsync(() => {
    comp.user = { ...mockUser, books: [ /* evtl schon gefiltert */ ] };
    comp.originalBooks = [...mockUser.books];
    comp.initSearchForm();
    comp.searchForm.setValue({ title: 'X', author: 'Y', year: 2020 });
    comp.resetSearch();
    tick();
    expect(comp.user!.books).toEqual(mockUser.books);
    expect(comp.searchForm.value).toEqual({ title: '', author: '', year: null });
    expect(comp.noBooksFound).toBeFalse();
  }));

  it('should fetch and display books matching selected rating', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
    const filtered = [{ ...mockUser.books[0], rating: 3 }];
    bookServiceSpy.getBooks.and.returnValue(of(filtered));
    comp.user = { ...mockUser, books: mockUser.books };
    comp.originalBooks = [...mockUser.books];
    comp.ratingFilterForm = fb.group({ ratingFilter: [''] });
    comp.ratingFilterForm.setValue({ ratingFilter: 3 });
    comp.filterByRating();
    tick();
    expect(bookServiceSpy.getBooks).toHaveBeenCalledWith('abc', 3);
    expect(comp.user!.books).toEqual(filtered);
    expect(comp.noBooksFound).toBeFalse();
  }));

  it('should show "no books found" message when filter returns empty', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
    bookServiceSpy.getBooks.and.returnValue(of([]));
    comp.user = { ...mockUser, books: mockUser.books };
    comp.originalBooks = [...mockUser.books];
    comp.ratingFilterForm = fb.group({ ratingFilter: [''] });
    comp.ratingFilterForm.setValue({ ratingFilter: 5});
    comp.filterByRating();
    tick();
    expect(bookServiceSpy.getBooks).toHaveBeenCalledWith('abc', 5);
    expect(comp.user!.books).toEqual([]);
    expect(comp.noBooksFound).toBeTrue();
  }));

  it('should search by text and then locally filter results by rating', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
    comp.user = { ...mockUser, books: [...mockUser.books] };
    const serverResult: Book[] = [
      { ...mockBook, isbn: 'a', rating: 2 },
      { ...mockBook, isbn: 'b', rating: 4 },
      { ...mockBook, isbn: 'c', rating: 4 }
    ];
    bookServiceSpy.searchBooks.and.returnValue(of(serverResult));
    comp.filterForm = fb.group({
      title:  ['Suchtext'],
      author: ['X'],
      year:   [2022],
      rating: [4]
    });
    comp.applyFilters();
    tick();
    expect(bookServiceSpy.searchBooks).toHaveBeenCalledWith(
        'abc', 'Suchtext', 'X', 2022
    );
    expect(comp.user!.books).toEqual([ serverResult[1], serverResult[2] ]);
    expect(comp.noBooksFound).toBeFalse();
  }));
});
