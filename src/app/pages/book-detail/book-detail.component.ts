import { Component, OnInit } from '@angular/core';
import { CommonModule} from '@angular/common';
import {
  ActivatedRoute,
  RouterModule,
  Router
} from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { BookService } from '../../services/book.srvice';
import { Book } from '../../models/book.model';

/**
 * Komponente zur Anzeige der Buchdetails und
 * Speicherung Bewertung
 */
@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  errorMsg: string | null = null;
  public ratingForm!: FormGroup;
  successMsg: string | null = null;

  /**
   * Konstruktor: Initialisiert benötigte Services
   * @param bs Service zum Abrufen und Aktualisieren von Buchdaten
   * @param route Zugriff auf aktuelle Routenparameter
   * @param router Ermöglicht Navigation innerhalb der App
   * @param fb FormBuilder zur Erstellung von Formularen
   */
  constructor(
    private readonly bs: BookService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {}

  /**
   * Lifecycle-Methode: Wird beim Initialisieren der Komponente aufgerufen.
   * Holt Buchdetails basierend auf URL-Parametern und initialisiert das Bewertungsformular.
   */
  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId')!;
    const isbn   = this.route.snapshot.paramMap.get('isbn')!;
    this.bs.getBookDetails(userId, isbn)
      .pipe(catchError(() => {
        this.errorMsg = 'Buchdaten konnten nicht geladen werden.';
        this.loading  = false;
        return of(null);
      }))
      .subscribe(b => {
        this.book    = b;
        this.loading = false;
        if (b) this.initForm(b.rating);
      });
  }

  /**
   * Initialisiert das Bewertungsformular mit einer bestehenden Bewertung oder Default-Wert.
   * @param rating Bewertung, die vorausgefüllt werden soll (optional)
   */
  private initForm(rating: number | null | undefined): void {
    this.ratingForm = this.fb.group({
      rating: [
        rating ?? 1,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ]
    });
  }

  /**
   * Speichert die aktuelle Bewertung, sofern das Formular gültig ist.
   * Aktualisiert das Buch-Objekt und zeigt entsprechende Rückmeldung an.
   */
  saveRating(): void {
    if (!this.book || this.ratingForm.invalid) return;
    this.errorMsg   = null;
    this.successMsg = null;
    const userId = this.route.snapshot.paramMap.get('userId')!;
    const isbn   = this.route.snapshot.paramMap.get('isbn')!;
    const rating = this.ratingForm.value.rating;
    this.bs.updateBookRating(userId, isbn, rating)
      .pipe(catchError(err => {
        this.errorMsg = err.status === 400
          ? 'Ungültige Bewertung'
          : 'Fehler beim Speichern der Bewertung';
        return of(null);
      }))
      .subscribe(updated => {
        if (updated) {
          this.book       = updated;
          this.successMsg = 'Bewertung gespeichert';
        }
      });
  }

  /**
   * Navigiert zurück zur User-Detail-Seite basierend auf dem userId aus der URL.
   */
  backToUser(): void {
    const userId = this.route.snapshot.paramMap.get('userId')!;
    this.router.navigate(['/users', userId]);
  }
}
