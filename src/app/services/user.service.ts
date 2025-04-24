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
   * Interne Methode zum Abfangen und Weiterleiten von HTTP-Fehlern.
   *
   * @param err Das HttpErrorResponse-Objekt mit Details zum Fehler
   * @returns Ein Fehler-Observable, das den ursprünglichen Fehler enthält
   */
  private handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}

