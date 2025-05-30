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
    comp.enableEdit('rating');
    comp.ratingForm.setValue({ rating: 6 });
    comp.saveRating();
    httpMock.expectNone('http://localhost:8080/users/u1/books/10');
    expect(comp.errorMsg).toBeNull();
  }));

  it('submits a new review and adds it to the list', fakeAsync(() => {
    const mockReview = {
      id: 'r1',
      rating: 5,
      reviewText: 'Tolles Buch!'
    };
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush({ ...mockBook });
    tick();
    comp.reviewForm.setValue({ rating: 5, reviewText: 'Tolles Buch!' });
    comp.submitReview();
    const post = httpMock.expectOne('http://localhost:8080/users/u1/books/10/reviews');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ rating: 5, reviewText: 'Tolles Buch!' });

    post.flush(mockReview);
    tick();

    expect(comp.book!.reviews.length).toBe(1);
    expect(comp.book!.reviews[0]).toEqual(mockReview);
    expect(comp.successMsg).toBe('Rezension gespeichert');
  }));

  it('should update a review on saveEditedReview', fakeAsync(() => {
    const originalReview = { id: 'r1', rating: 3, reviewText: 'Alte Meinung' };
    const reqGet = httpMock.expectOne('http://localhost:8080/users/u1/books/10');
    reqGet.flush({ ...mockBook, reviews: [ originalReview ] });
    tick();
    comp.startEditReview(originalReview.id!, originalReview.rating, originalReview.reviewText);
    comp.editReviewForm.setValue({ rating: 5, reviewText: 'Neue Meinung' });
    comp.saveEditedReview();
    const reqPut = httpMock.expectOne('http://localhost:8080/users/u1/books/10/reviews/r1');
    expect(reqPut.request.method).toBe('PUT');
    expect(reqPut.request.body).toEqual({ rating: 5, reviewText: 'Neue Meinung' });
    reqPut.flush({ id: 'r1', rating: 5, reviewText: 'Neue Meinung' });
    tick();
    expect(comp.book!.reviews[0]).toEqual({ id: 'r1', rating: 5, reviewText: 'Neue Meinung' });
  }));

  it('should delete a review when confirmed', fakeAsync(() => {
    const bookWithReview = {
      ...mockBook,
      reviews: [{ id: 'r1', rating: 5, reviewText: 'Testrezension' }]
    };
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush(bookWithReview);
    tick();
    spyOn(window, 'confirm').and.returnValue(true);
    comp.deleteReview('r1');
    const deleteReq = httpMock.expectOne('http://localhost:8080/users/u1/books/10/reviews/r1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null, { status: 204, statusText: 'No Content' });
    tick();
    expect(comp.book!.reviews.length).toBe(0);
  }));

  it('should not delete a review when confirmation is dismissed', fakeAsync(() => {
    const bookWithReview = {
      ...mockBook,
      reviews: [{ id: 'r1', rating: 5, reviewText: 'Testrezension' }]
    };
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush(bookWithReview);
    tick();
    spyOn(window, 'confirm').and.returnValue(false);
    comp.deleteReview('r1');
    httpMock.expectNone('http://localhost:8080/users/u1/books/10/reviews/r1');
    expect(comp.book!.reviews.length).toBe(1);
  }));

  it('should update book details when saveBookDetails is called', fakeAsync(() => {
    // Buch laden
    httpMock.expectOne('http://localhost:8080/users/u1/books/10').flush(mockBook);
    tick();

    // Enable Details-Bearbeitung und Formular vorbereiten
    comp.enableEdit('details');
    comp.detailsForm.setValue({
      title: 'Geändertes Buch',
      authors: 'Autor A, Autor B',
      description: 'Neue Beschreibung',
      coverUrl: 'https://neues-cover.de/bild.jpg'
    });

    comp.saveBookDetails();

    const req = httpMock.expectOne('http://localhost:8080/users/u1/books/10/details');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      title: 'Geändertes Buch',
      authors: ['Autor A', 'Autor B'],
      description: 'Neue Beschreibung',
      coverUrl: 'https://neues-cover.de/bild.jpg'
    });

    const updatedBook = {
      ...mockBook,
      title: 'Geändertes Buch',
      authors: ['Autor A', 'Autor B'],
      description: 'Neue Beschreibung',
      coverUrl: 'https://neues-cover.de/bild.jpg'
    };

    req.flush(updatedBook);
    tick();

    expect(comp.book!.title).toBe('Geändertes Buch');
    expect(comp.book!.authors).toEqual(['Autor A', 'Autor B']);
    expect(comp.editingDetails).toBeFalse();
    expect(comp.successMsg).toBe('Buchdetails erfolgreich gespeichert');
  }));
});
