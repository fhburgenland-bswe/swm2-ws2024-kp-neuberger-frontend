import { Component, OnInit }        from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule }          from '@angular/common/http';
import { catchError, of }            from 'rxjs';

import { UserService } from '../../services/user.service';
import { User }        from '../../models/user.model';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { BookService } from '../../services/book.srvice';

/**
 * Komponente zur Anzeige von Benutzerdetails.
 */
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    NgIf,
    NgFor,
    ReactiveFormsModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: [ './user-detail.component.css' ]
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  errorMsg: string | null = null;
  editing = false;
  profileForm!: FormGroup;
  successMsg: string | null = null;
  isbnForm!: FormGroup;
  addError: string | null = null;


  /**
   * @param userService Service zum Abrufen der Benutzerdaten vom Backend
   * @param bookService
   * @param route ActivatedRoute, um Pfadparameter auszulesen
   * @param fb FormBuilder zum Erstellen des Formulars
   */
  constructor(
    private readonly userService: UserService,
    private readonly bookService: BookService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder
  ) {}

  /**
   * Lifecycle-Hook: Beim Initialisieren werden die Benutzerdaten geladen.
   * Liest die "userId" aus der URL und ruft den Service auf.
   * Bei Fehlern wird "errorMsg" gesetzt.
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('userId');
      if (!id) {
        this.errorMsg = 'Keine Benutzer-ID gefunden.';
        this.loading = false;
        return;
      }

      this.userService.getUserById(id)
        .pipe(
          catchError(() => {
            this.errorMsg = 'Benutzerdaten konnten nicht geladen werden.';
            this.loading = false;
            return of(null);
          })
        )
        .subscribe(u => {
          this.user = u;
          this.loading = false;
          this.initIsbnForm();
        });
    });
  }

  /**
   * Initialisiert das Profilformular mit den aktuellen Benutzerdaten.
   */
  private initForm(user: User): void {
    this.profileForm = this.fb.group({
      name:  [user.name, [Validators.required, Validators.minLength(2)]],
      email: [user.email, [Validators.required, Validators.email]]
    });
  }

  /**
   * Schaltet den Bearbeitungsmodus um (anzeigen/verstecken des Formulars).
   */
  toggleEdit(): void {
    this.editing  = !this.editing;
    this.errorMsg = null;
    this.successMsg = null;
    if (this.editing && this.user) this.initForm(this.user);
  }

  /**
   * Speichert die geänderten Profildaten via PUT-Request.
   */
  saveProfile(): void {
    if (!this.user || this.profileForm.invalid) return;
    const id = this.user.id!;
    this.errorMsg   = null;
    this.successMsg = null;
    const { name, email } = this.profileForm.value;

    this.userService.updateUser(id, { name, email })
      .pipe(
        catchError(err => {
          if (err.status === 409) {
            this.profileForm.get('email')?.setErrors({ conflict: true });
          } else {
            this.errorMsg = 'Profil konnte nicht aktualisiert werden.';
          }
          return of(null);
        })
      )
      .subscribe(updated => {
        if (updated) {
          this.user       = updated;
          this.successMsg = 'Profil aktualisiert';
          this.editing    = false;
        }
      });
  }

  /**
   * Fügt dem aktuellen Benutzer ein neues Buch anhand der eingegebenen ISBN hinzu.
   *
   * Liest die ISBN aus `isbnForm`, validiert das Formular und
   * ruft den BookService auf. Bei HTTP-Status 400 wird eine
   * Fehlermeldung "Ungültige ISBN" angezeigt, bei anderen Fehlern
   * "Fehler beim Abrufen der Buchdaten". Erfolgreich erstellte
   * Bücher werden an die vorhandene `user.books`-Liste angehängt
   * und das Formular zurückgesetzt.
   */
  private initIsbnForm(): void {
    this.isbnForm = this.fb.group({
      isbn: ['', [Validators.required]]
    });
    this.addError = null;
  }

  /**
   * Fügt dem aktuellen Benutzer ein neues Buch anhand der eingegebenen ISBN hinzu.
   *
   * Liest die ISBN aus `isbnForm`, validiert das Formular und
   * ruft den BookService auf. Bei HTTP-Status 400 wird eine
   * Fehlermeldung "Ungültige ISBN" angezeigt, bei anderen Fehlern
   * "Fehler beim Abrufen der Buchdaten". Erfolgreich erstellte
   * Bücher werden an die vorhandene `user.books`-Liste angehängt
   * und das Formular zurückgesetzt.
   */
  addBook(): void {
    if (!this.user || this.isbnForm.invalid) return;

    const isbn = this.isbnForm.value.isbn.trim();
    const userId = this.user.id!;
    this.addError = null;

    // ➕ NEU: Prüfung auf bereits vorhandene ISBN
    const alreadyExists = this.user.books.some(book => book.isbn === isbn);
    if (alreadyExists) {
      this.addError = 'Dieses Buch ist bereits in Ihrer Liste.';
      return;
    }

    this.bookService.addBookByIsbn(userId, isbn)
      .pipe(
        catchError(err => {
          if (err.status === 400) {
            this.addError = 'Ungültige ISBN';
          } else {
            this.addError = 'Fehler beim Abrufen der Buchdaten';
          }
          return of(null);
        })
      )
      .subscribe(book => {
        if (book) {
          this.user!.books.push(book);
          this.isbnForm.reset();
        }
      });
  }
}
