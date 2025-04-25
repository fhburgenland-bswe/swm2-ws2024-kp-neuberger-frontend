import {
  ComponentFixture, TestBed, fakeAsync, tick
} from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute} from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BookDetailComponent } from './book-detail.component';
import { Book }                from '../../models/book.model';

describe('BookDetailComponent', () => {
  let fixture: ComponentFixture<BookDetailComponent>;
  let comp: BookDetailComponent;
  let httpMock: HttpTestingController;

  const mockBook: Book = {
    id: 'b1',
    isbn: '10',
    title: 'Testbuch',
    authors: [],
    publisher: '',
    publishedDate: '',
    description: '',
    coverUrl: '',
    rating: 4,
    reviews: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ BookDetailComponent, HttpClientTestingModule, ReactiveFormsModule ],
      providers: [
        { provide: ActivatedRoute, useValue: {
            snapshot: { paramMap: { get: (key: string) => key === 'userId' ? 'u1' : '10' } }
          }},
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailComponent);
    comp = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads book details and form', fakeAsync(() => {
    const req = httpMock.expectOne('http://localhost:8080/users/u1/books/10');
    req.flush(mockBook);
    tick();
    expect(comp.book).toEqual(mockBook);
    expect(comp.ratingForm.value.rating).toBe(4);
  }));

  it('saves new rating', fakeAsync(() => {
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush(mockBook);
    tick();
    comp.ratingForm.setValue({ rating: 5 });
    comp.saveRating();
    const put = httpMock.expectOne('http://localhost:8080/users/u1/books/10');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ rating: 5 });
    put.flush({ ...mockBook, rating: 5 });
    tick();
    expect(comp.successMsg).toBe('Bewertung gespeichert');
  }));

  it('shows error on invalid rating', fakeAsync(() => {
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush(mockBook);
    tick();
    comp.ratingForm.setValue({ rating: 6 });
    comp.saveRating();
    expect(comp.errorMsg).toBeNull();
    httpMock.expectNone('http://localhost:8080/users/u1/books/10');
  }));
});
