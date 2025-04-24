import { Component, OnInit }        from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule }          from '@angular/common/http';
import { catchError, of }            from 'rxjs';

import { UserService } from '../../services/user.service';
import { User }        from '../../models/user.model';
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
    NgFor
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: [ './user-detail.component.css' ]
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  loading = true;
  errorMsg: string | null = null;

  /**
   * @param userService Service zum Abrufen der Benutzerdaten vom Backend
   * @param route ActivatedRoute, um Pfadparameter auszulesen
   */
  constructor(
    private readonly userService: UserService,
    private readonly route: ActivatedRoute
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
}
