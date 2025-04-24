import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from '@angular/router';

/**
 * Startseiten-Komponente der Anwendung.
 *
 * Zeigt eine Begrüßung, eine kurze Beschreibung des Bookmanagers
 * und einen Button zum Anlegen neuer Benutzer.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {}
