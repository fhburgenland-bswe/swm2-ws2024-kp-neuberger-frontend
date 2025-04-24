import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user.service';

/**
 * Komponente zum Anlegen neuer Benutzer.
 */
@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule
  ],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent {
  form: FormGroup;
  apiError: string | null = null;

  /**
   * @param fb FormBuilder zum Erstellen des Formulars
   * @param userService Service zum Erstellen eines Benutzers im Backend
   * @param router Router für die Navigation nach Erfolg
   */
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name:  ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Versendet das Formular an das Backend und navigiert bei Erfolg.
   */
  onSubmit(): void {
    if (this.form.invalid) return;

    const { name, email } = this.form.value as { name: string; email: string };
    this.apiError = null;

    this.userService.createUser({ name, email }).subscribe({
      next: () => {
        alert('Benutzer angelegt');
        this.router.navigate(['/users']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.form.get('email')?.setErrors({ conflict: true });
        } else {
          this.apiError = 'Ein unerwarteter Fehler ist aufgetreten.';
        }
      }
    });
  }
}
