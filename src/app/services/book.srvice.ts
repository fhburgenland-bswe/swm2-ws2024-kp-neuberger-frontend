import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Book } from '../models/book.model';

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
}
