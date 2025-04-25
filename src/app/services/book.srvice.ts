import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {Book, Review} from '../models/book.model';

/**
 * Service zur Verwaltung von Buch-Operationen für Benutzer.
 *
 * Dieser Service stellt eine Methode bereit, um ein Buch anhand seiner ISBN
 * einem Benutzerprofil hinzuzufügen.
 */
@Injectable({
  providedIn: 'root',
})
export class BookService {
  /**
   * Basis-URL für alle API-Aufrufe dieses Services.
   * Sollte idealerweise aus einer Umgebungsvariable stammen.
   */
  private backendUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  /**
   * Fügt dem angegebenen Benutzer ein Buch anhand der ISBN hinzu.
   *
   * @param userId Die ID des Benutzers, dem das Buch hinzugefügt werden soll
   * @param isbn Die ISBN des hinzuzufügenden Buchs
   * @returns Ein Observable mit dem erzeugten Book-Objekt
   */
  addBookByIsbn(userId: string, isbn: string): Observable<Book> {
    return this.http
      .post<Book>(`${this.backendUrl}/users/${userId}/books`, { isbn })
      .pipe(catchError(this.handleError));
  }

  /**
   * Fehlerbehandlung für HTTP-Anfragen.
   *
   * @param err Das HttpErrorResponse-Objekt mit Fehlerdetails
   * @returns Ein Error-Observable zur Weiterleitung des Fehlers
   */
  private handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }

  /**
   * Ruft die Details eines bestimmten Buchs für einen Benutzer ab.
   *
   * @param userId Die ID des Benutzers
   * @param isbn Die ISBN des Buchs, dessen Details geladen werden sollen
   * @returns Ein Observable mit dem Book-Objekt
   */
  getBookDetails(userId: string, isbn: string): Observable<Book> {
    return this.http.get<Book>(`${this.backendUrl}/users/${userId}/books/${isbn}`);
  }

  /**
   * Aktualisiert die Bewertung eines Buchs für einen bestimmten Benutzer.
   *
   * @param userId Die ID des Benutzers
   * @param isbn Die ISBN des Buchs
   * @param rating Die neue Bewertung
   * @returns Ein Observable mit dem aktualisierten Book-Objekt
   */
  updateBookRating(
    userId: string,
    isbn: string,
    rating: number
  ): Observable<Book> {
    return this.http.put<Book>(
      `${this.backendUrl}/users/${userId}/books/${isbn}`,
      { rating }
    );
  }


  /**
   * Sendet eine neue Rezension an das Backend.
   *
   * @param userId Die ID des Benutzers
   * @param isbn Die ISBN des Buchs
   * @param review Ein Objekt mit Bewertung und Text
   * @returns Ein Observable mit dem erzeugten Review-Objekt
   */
  submitReview(userId: string, isbn: string, review: { rating: number; reviewText: string }): Observable<Review> {
    return this.http.post<Review>(
      `${this.backendUrl}/users/${userId}/books/${isbn}/reviews`,
      review
    );
  }

  /**
   * Sucht Bücher eines Benutzers anhand optionaler Kriterien.
   */
  searchBooks(userId: string, title?: string, author?: string, year?: number) {
    const params: Record<string,string> = {};
    if (title) params['title']  = title;
    if (author) params['author'] = author;
    if (year) params['year']   = year.toString();

    return this.http
        .get<Book[]>(`${this.backendUrl}/users/${userId}/books/search`, { params })
        .pipe(catchError(this.handleError));
  }

  /**
   * Ruft die Bücher eines Benutzers optional nach Bewertung gefiltert ab.
   *
   * @param userId ID des Benutzers
   * @param rating (Optional) Bewertung von 1–5
   * @returns Ein Observable mit der Liste der Bücher
   */
  getBooks(userId: string, rating?: number): Observable<Book[]> {
    let params = new HttpParams();
    if (rating != null) {
      params = params.set('rating', rating.toString());
    }
    return this.http
        .get<Book[]>(`${this.backendUrl}/users/${userId}/books`, { params })
        .pipe(catchError(this.handleError));
  }

  /**
   * Aktualisiert Titel, Autoren, Beschreibung oder Cover-URL eines Buchs.
   */
  updateBookDetails(
      userId: string,
      isbn: string,
      details: { title: string; authors: string[]; description: string; coverUrl: string }
  ): Observable<Book> {
    return this.http
        .put<Book>(`${this.backendUrl}/users/${userId}/books/${isbn}/details`, details)
        .pipe(catchError(this.handleError));
  }

  /**
   * Holt alle Rezensionen zu einem Buch für einen Benutzer.
   *
   * @param userId ID des Benutzers
   * @param isbn   ISBN des Buchs
   * @returns       Ein Observable mit dem Array von Review-Objekten
   */
  getReviews(userId: string, isbn: string): Observable<Review[]> {
    return this.http
        .get<Review[]>(`${this.backendUrl}/users/${userId}/books/${isbn}/reviews`)
        .pipe(catchError(this.handleError));
  }

  /**
   * Aktualisiert eine vorhandene Rezension eines Buchs.
   *
   * @param userId    ID des Benutzers
   * @param isbn      ISBN des Buchs
   * @param reviewId  ID der zu aktualisierenden Rezension
   * @param payload   Objekt mit neuem Rating und Text
   */
  updateReview(
      userId: string,
      isbn: string,
      reviewId: string,
      payload: { rating: number; reviewText: string }
  ): Observable<Review> {
    return this.http
        .put<Review>(
            `${this.backendUrl}/users/${userId}/books/${isbn}/reviews/${reviewId}`,
            payload
        )
        .pipe(catchError(this.handleError));
  }

  /**
   * Löscht eine Rezension eines Buchs für einen Benutzer.
   *
   * @param userId    ID des Benutzers
   * @param isbn      ISBN des Buchs
   * @param reviewId  ID der zu löschenden Rezension
   * @returns Ein Observable, das den Abschluss der Löschung signalisiert
   */
  deleteReview(
      userId: string,
      isbn: string,
      reviewId: string
  ): Observable<void> {
    return this.http
        .delete<void>(`${this.backendUrl}/users/${userId}/books/${isbn}/reviews/${reviewId}`)
        .pipe(catchError(this.handleError));
  }

  /**
   * Löscht ein Buch aus der Sammlung eines Benutzers.
   *
   * @param userId Die ID des Benutzers
   * @param isbn Die ISBN des Buchs, das gelöscht werden soll
   * @returns Ein Observable, das den Abschluss der Löschung signalisiert
   */
  deleteBook(userId: string, isbn: string) {
    return this.http.delete<void>(`${this.backendUrl}/users/${userId}/books/${isbn}`);
  }
}
