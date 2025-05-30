import { Component, OnInit }        from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule }          from '@angular/common/http';
import {catchError, finalize, of} from 'rxjs';

import { UserService } from '../../services/user.service';
import { User }        from '../../models/user.model';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { BookService } from '../../services/book.srvice';
import {Book, Review} from "../../models/book.model";

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
  deleteSuccess: string | null = null;
  reviewsMap: Record<string, Review[]> = {};
  showReviewsFor: string | null = null;
  reviewsError: string | null = null;
  searchForm!: FormGroup;
  originalBooks: Book[] = [];
  noBooksFound = false;
  ratingFilterForm!: FormGroup;
  filterLoading = false;
  filterForm!: FormGroup;

  /**
   * @param userService Service zum Abrufen der Benutzerdaten vom Backend
   * @param bookService
   * @param route ActifdvatedRoute, um Pfadparameter auszulesen
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
          this.originalBooks = u ? [...u.books] : [];
          this.initIsbnForm();
          this.filterForm = this.fb.group({
            title:  [''],
            author: [''],
            year:   [null],
            rating: ['']
          });
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

  /**
   * Löscht ein Buch basierend auf der angegebenen ISBN aus der Bücherliste des aktuellen Benutzers.
   *
   * Zeigt zunächst einen Bestätigungsdialog an, um sicherzustellen, dass der Benutzer
   * das Buch tatsächlich löschen möchte. Wenn bestätigt, wird die Methode deleteBook
   * des BookService aufgerufen.
   *
   * Bei erfolgreicher Löschung wird das Buch aus der lokalen Bücherliste entfernt,
   * eine Erfolgsmeldung angezeigt und eventuelle vorherige Fehlermeldungen zurückgesetzt.
   * Falls die Löschung fehlschlägt, wird eine entsprechende Fehlermeldung angezeigt.
   *
   * @param bookIsbn Die ISBN des zu löschenden Buches.
   * @returns void
   */
  deleteBook(bookIsbn: string): void {
    if (!this.user) return;
    const confirmed = confirm('Buch wirklich löschen?');
    if (!confirmed) return;
    const userId = this.user.id!;
    this.bookService.deleteBook(userId, bookIsbn)
      .subscribe({
        next: () => {
          this.user!.books = this.user!.books.filter(b => b.isbn !== bookIsbn);
          this.deleteSuccess = 'Buch gelöscht';
          this.addError = null;
          setTimeout(() => this.deleteSuccess = null, 3000);
        },
        error: () => {
          this.addError = 'Löschen fehlgeschlagen';
        }
      });
  }

  /**
   * Lädt die Bücher mit dem ausgewählten Rating neu.
   */
  filterByRating(): void {
    if (!this.user) return;
    this.errorMsg = null;
    this.filterLoading = true;
    this.noBooksFound  = false;

    const rating = this.ratingFilterForm.value.ratingFilter;
    this.bookService.getBooks(this.user.id!, rating ? +rating : undefined)
        .pipe(finalize(() => this.filterLoading = false))
        .subscribe({
          next: books => {
            this.user!.books = books;
            this.noBooksFound = books.length === 0;
          },
          error: () => {
            this.errorMsg = 'Fehler beim Laden der Bücher';
          }
        });
  }

  /**
   * Klappt die Review-Liste für ein Buch auf/zu.
   * Lädt sie einmalig vom Backend.
   */
  toggleReviews(isbn: string): void {
    if (this.showReviewsFor === isbn) {
      this.showReviewsFor = null;
      return;
    }
    this.showReviewsFor = isbn;
    this.reviewsError = null;
    const userId = this.user!.id!;
    this.bookService.getReviews(userId, isbn)
        .pipe(
            catchError(() => {
              this.reviewsError = 'Rezensionen konnten nicht geladen werden.';
              return of([] as Review[]);
            })
        )
        .subscribe(revs => {
          this.reviewsMap[isbn] = revs;
        });
  }

  /**
   * Initialisiert das Suchformular mit leeren Feldern.
   * Setzt zudem den Indikator `noBooksFound` zurück.
   */
  initSearchForm(): void {
    this.searchForm = this.fb.group({
      title:  [''],
      author: [''],
      year:   [null]
    });
    this.noBooksFound = false;
  }

  /**
   * Führt die Buchsuche anhand der aktuellen Formularwerte durch.
   * - Liest Filterkriterien (Titel, Autor, Jahr) aus `searchForm`.
   * - Ruft den `BookService.searchBooks` auf.
   * - Bei HTTP-Fehlern wird `errorMsg` gesetzt und ein leerer Array zurückgegeben.
   * - Bei Erfolg wird die Liste `user.books` auf die Suchergebnisse gesetzt.
   * - `noBooksFound` wird auf true gesetzt, wenn keine Ergebnisse zurückkommen.
   */
  searchBooks(): void {
    if (!this.user) return;
    const { title, author, year } = this.searchForm.value;
    this.bookService.searchBooks(this.user.id!, title, author, year)
        .pipe(
            catchError(() => {
              this.errorMsg = 'Fehler beim Suchen der Bücher';
              return of([]);
            })
        )
        .subscribe(results => {
          this.user!.books = results;
          this.noBooksFound = results.length === 0;
        });
  }

  /**
   * Wendet die Filter auf die Bücherliste des aktuellen Benutzers an.
   *
   * Diese Methode liest die Filterwerte (Titel, Autor, Jahr, Bewertung) aus dem Formular,
   * führt eine Suche nach Büchern anhand der Filterwerte durch und aktualisiert die Bücherliste.
   *
   * Hinweis: Die Bewertung wird nicht direkt bei der Suche, sondern erst nachträglich gefiltert.
   * Falls während der Suche ein Fehler auftritt, wird eine Fehlermeldung angezeigt.
   *
   * Wenn nach dem Anwenden der Filter keine Bücher gefunden werden, wird dies ebenfalls angezeigt.
   */
  applyFilters(): void {
    if (!this.user) return;
    this.errorMsg      = null;
    this.noBooksFound  = false;
    this.filterLoading = true;
    const { title, author, year, rating } = this.filterForm.value;
    const ratingNum = rating ? +rating : undefined;
    this.bookService
        .searchBooks(
            this.user.id!,
            title  || undefined,
            author || undefined,
            year   || undefined
        )
        .pipe(
            finalize(() => this.filterLoading = false),
            catchError(() => {
              this.errorMsg = 'Fehler beim Anwenden der Filter';
              return of([] as Book[]);
            })
        )
        .subscribe(results => {
          const finalList = ratingNum != null
              ? results.filter(b => b.rating === ratingNum)
              : results;

          this.user!.books     = finalList;
          this.noBooksFound    = finalList.length === 0;
        });
  }

  /**
   * Setzt alle angewendeten Filter zurück und stellt den ursprünglichen Zustand der Bücherliste wieder her.
   *
   * Dabei wird das Filterformular geleert und die ursprüngliche Bücherliste erneut geladen.
   * Eventuell vorhandene Fehlermeldungen oder Hinweise über fehlende Ergebnisse werden ebenfalls zurückgesetzt.
   */
  resetFilters(): void {
    this.filterForm.reset({ title:'', author:'', year:null, rating: '' });
    this.user!.books  = [...this.originalBooks];
    this.noBooksFound = false;
    this.errorMsg     = null;
  }

  /**
   * Setzt die Suche zurück:
   * - Formulareingaben werden geleert.
   * - Originalbuchliste (`originalBooks`) wird wiederhergestellt.
   * - `noBooksFound` wird auf false zurückgesetzt.
   */
  resetSearch(): void {
    this.searchForm.reset({ title: '', author: '', year: null });
    this.user!.books = [...this.originalBooks];
    this.noBooksFound = false;
  }
}
