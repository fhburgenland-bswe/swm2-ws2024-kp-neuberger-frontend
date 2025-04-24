import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { UserService } from '../../services/user.service';
import { User }        from '../../models/user.model';

/**
 * Komponente zum Holen aller Benutzer und zum Löschen eines spezifischen Benutzers.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ CommonModule, HttpClientModule, RouterModule, NgIf ],
  templateUrl: './user-list.component.html',
  styleUrls: [ './user-list.component.css' ]
})
export class UserListComponent implements OnInit {
  users: User[]        = [];
  loading = true;
  errorMsg: string | null = null;

  /**
   * Erzeugt eine Instanz der Komponente.
   * @param userService Service zum Laden und Löschen von Benutzern
   */
  constructor(
    private userService: UserService,
  ) {}

  /**
   * Initialisiert die Komponente.
   * Führt einen HTTP-GET aus, um alle Benutzer zu laden.
   * Bei einem Fehler wird eine Fehlermeldung gesetzt.
   */
  ngOnInit(): void {
    this.userService.getAllUsers()
      .pipe(
        catchError(() => {
          this.errorMsg = 'Daten konnten nicht geladen werden.';
          this.loading  = false;
          return of([]);
        })
      )
      .subscribe(list => {
        this.users   = list;
        this.loading = false;
      });
  }

  /**
   * Löscht einen ausgewählten Benutzer.
   * Öffnet zunächst eine Bestätigung und führt bei Zustimmung einen HTTP-DELETE aus.
   * Bei einem Fehler wird eine entsprechende Meldung angezeigt.
   * @param u Das User-Objekt, das gelöscht werden soll
   */
  delete(u: User) {
    if (!confirm(`Benutzer ${u.name} wirklich löschen?`)) return;
    this.userService.deleteUser(u.id!)
      .pipe(
        catchError(() => {
          this.errorMsg = 'Löschen fehlgeschlagen.';
          return of(null);
        })
      )
      .subscribe(() => {
        this.users = this.users.filter(x => x.id !== u.id);
      });
  }
}
