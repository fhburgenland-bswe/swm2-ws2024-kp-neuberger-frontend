# BookmanagerFrontend

Dies ist das Frontend einer Angular-Anwendung zur Verwaltung von Benutzern, Büchern und Buchrezensionen. Die Anwendung erlaubt es dir, Benutzer anzulegen, Bücher zu deren Sammlung hinzuzufügen, Informationen zu Büchern zu bearbeiten sowie Bewertungen und Rezensionen zu verfassen.

## Funktionen im Überblick

### Startseite (`/`)
- Einstiegspunkt der Anwendung mit Begrüßung.
- Zwei Buttons führen zu:
  - Benutzer anlegen
  - Benutzerübersicht anzeigen

### Benutzerverwaltung

#### Benutzer anlegen (`/users/create`)
- Formular zur Eingabe von Name und E-Mail.
- Validierung (Pflichtfelder, E-Mail-Format, Konfliktprüfung).

#### Benutzerliste anzeigen (`/users`)
- Alle registrierten Benutzer im Überblick.
- Möglichkeit zur Navigation zu einzelnen Benutzerdetails.
- Benutzer löschen mit Bestätigungsdialog.

#### Benutzerdetails (`/users/:id`)
- Profilbearbeitung (Name, E-Mail).
- Bücher per ISBN hinzufügen.
- Bücher suchen & filtern nach Titel, Autor, Jahr und Bewertung.
- Rezensionen je Buch anzeigen.
- Bücher löschen.

### Buchdetails (`/users/:userId/books/:isbn`)

#### Allgemein
- Anzeigen aller Buchinformationen (Titel, Autor, Beschreibung, etc.).
- Bewertung anzeigen und bearbeiten (1-5 Sterne).

#### Bearbeiten
- "Buchinformationen bearbeiten" aktiviert Eingabe für Titel, Autoren, Beschreibung und Cover-URL.
- "Bewertung bearbeiten" erlaubt Änderung der Sternebewertung.
- "Abbrechen" schaltet Felder wieder schreibgeschützt.

#### Rezensionen
- Neue Rezension erstellen (mit Sternebewertung und Text).
- Vorhandene Rezensionen bearbeiten oder löschen.

## Lokale Entwicklung

### Entwicklung starten
```bash
ng serve
```
Anwendung unter `http://localhost:4200/` aufrufen. Bei Dateiänderungen erfolgt ein automatischer Reload.

### Anwendung bauen
```bash
ng build
```
Die kompilierte App liegt danach im Verzeichnis `dist/`. Diese ist optimiert für Produktion.

### Unit Tests ausführen
```bash
ng test
```
Tests werden mit Karma ausgeführt. Ergebnis erscheint im Browser.

### End-to-End Tests (optional)
```bash
ng e2e
```
Hinweis: Angular CLI bringt kein Framework dafür mit. Du kannst z. B. Cypress oder Playwright integrieren.

## Entwickler-Tipps

### Neue Komponenten generieren
```bash
ng generate component komponenten-name
```
Mehr Infos unter:
```bash
ng generate --help
```

## Technologien
- Angular 19
- Reactive Forms
- Routing
- HTTP Client
- OpenAPI (Backend-Schnittstelle)

---

Viel Spaß beim Verwalten deiner Bücherwelt!

