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
import {Book, Review} from '../../models/book.model';

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
  public reviewForm!: FormGroup;
  public showReviewForm = false;

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
        if (b) {
          this.initRatingForm(b.rating);
          this.initReviewForm();
        }
      });
  }

  private initRatingForm(rating: number | null | undefined): void {
    this.ratingForm = this.fb.group({
      rating: [
        rating ?? 1,
        [Validators.required, Validators.min(1), Validators.max(5)]
      ]
    });
  }

  private initReviewForm(): void {
    this.reviewForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      reviewText: ['', Validators.required]
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
   * Sendet eine neue Rezension für das aktuell angezeigte Buch an das Backend.
   *
   * Voraussetzungen:
   * - Das Buchobjekt muss vorhanden sein.
   * - Das Formular muss gültige Eingaben enthalten.
   *
   * Ablauf:
   * - Holt die `userId` und `isbn` aus der aktuellen Route.
   * - Sendet die Bewertung und den Rezensionstext per POST an die API.
   * - Bei Erfolg wird die neue Rezension zur lokalen Buchliste hinzugefügt,
   *   das Formular zurückgesetzt und das Eingabefeld ausgeblendet.
   * - Bei Fehler wird eine Fehlermeldung angezeigt.
   */
  submitReview(): void {
    if (!this.book || this.reviewForm.invalid) return;
    const userId = this.route.snapshot.paramMap.get('userId')!;
    const isbn   = this.route.snapshot.paramMap.get('isbn')!;
    const { rating, reviewText } = this.reviewForm.value;

    this.bs.submitReview(userId, isbn, { rating, reviewText })
      .pipe(catchError(() => {
        this.errorMsg = 'Fehler beim Speichern der Rezension';
        return of(null);
      }))
      .subscribe((review: Review | null) => {
        if (review && this.book) {
          this.book.reviews.push(review);
          this.successMsg = 'Rezension gespeichert';
          this.reviewForm.reset();
          this.showReviewForm = false;
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
