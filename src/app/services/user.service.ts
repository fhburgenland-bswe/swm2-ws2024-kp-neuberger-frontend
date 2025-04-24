import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from '../models/user.model';

/**
 * Service zur Verwaltung von Benutzer-Operationen.
 *
 * Dieser Service stellt Methoden zum Erstellen neuer Benutzer bereit
 * und kapselt dabei die Kommunikation mit dem Backend über HTTP.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  /**
   * Basis-URL für alle API-Aufrufe dieses Services.
   * Sollte idealerweise aus einer Konfigurationsdatei geladen werden.
   */
  private backendUrl = 'http://localhost:8080';

  /**
   * Konstruktor, der den HttpClient für HTTP-Anfragen injiziert.
   *
   * @param http Angular HttpClient zum Senden von Requests
   */
  constructor(private http: HttpClient) {}

  /**
   * Legt einen neuen Benutzer im Backend an.
   *
   * Sendet eine POST-Anfrage an den Endpoint `/users` mit den Nutzerdaten.
   * Fängt auftretende HTTP-Fehler ab und leitet sie weiter.
   *
   * @param payload Objekt mit den benötigten Feldern `name` und `email`
   * @returns Ein Observable, das das angelegte User-Objekt enthält
   */
  createUser(payload: { name: string; email: string }): Observable<User> {
    return this.http
      .post<User>(`${this.backendUrl}/users`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Ruft alle registrierten Benutzer vom Server ab.
   * @returns Ein Observable-Array aller User-Objekte
   * @throws HttpErrorResponse im Fehlerfall (z. B. 500er)
   */
  getAllUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.backendUrl}/users`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Ruft die Details eines einzelnen Benutzers ab.
   * @param userId ID des gewünschten Benutzers
   * @returns Ein Observable mit dem kompletten User-Objekt
   */
  getUserById(userId: string): Observable<User> {
    return this.http
      .get<User>(`${this.backendUrl}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Aktualisiert Name und E-Mail eines Benutzers.
   * @param userId ID des Benutzers
   * @param payload Objekt mit neuen Feldern name und email
   * @returns Das aktualisierte User-Objekt
   */
  updateUser(userId: string, payload: { name: string; email: string }) {
    return this.http
      .put<User>(`${this.backendUrl}/users/${userId}`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Löscht einen Benutzer anhand seiner ID.
   * @param userId Die eindeutige ID des zu löschenden Benutzers
   * @returns Ein Observable, das bei erfolgreichem Löschen `void` emittiert
   * @throws HttpErrorResponse im Fehlerfall (z. B. 404 oder 500)
   */
  deleteUser(userId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.backendUrl}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Interne Methode zum Abfangen und Weiterleiten von HTTP-Fehlern.
   *
   * @param err Das HttpErrorResponse-Objekt mit Details zum Fehler
   * @returns Ein Fehler-Observable, das den ursprünglichen Fehler enthält
   */
  private handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}

