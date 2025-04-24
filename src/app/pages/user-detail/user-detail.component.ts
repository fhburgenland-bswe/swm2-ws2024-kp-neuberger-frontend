import { Component, OnInit }        from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule }          from '@angular/common/http';
import { catchError, of }            from 'rxjs';

import { UserService } from '../../services/user.service';
import { User }        from '../../models/user.model';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
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

  /**
   * @param userService Service zum Abrufen der Benutzerdaten vom Backend
   * @param route ActivatedRoute, um Pfadparameter auszulesen
   * @param fb FormBuilder zum Erstellen des Formulars
   */
  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder
  ) {}

  /**
   * Lifecycle-Hook: Beim Initialisieren werden die Benutzerdaten geladen.
   * Liest die "userId" aus der URL und ruft den Service auf.
   * Bei Fehlern wird "errorMsg" gesetzt.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('userId')!;
    this.userService.getUserById(id)
      .pipe(
        catchError(() => {
          this.errorMsg = 'Benutzerdaten konnten nicht geladen werden.';
          this.loading  = false;
          return of(null);
        })
      )
      .subscribe(u => {
        this.user    = u;
        this.loading = false;
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
}
