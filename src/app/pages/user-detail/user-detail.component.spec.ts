import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserDetailComponent } from './user-detail.component';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

describe('UserDetailComponent', () => {
  let fixture: ComponentFixture<UserDetailComponent>;
  let comp: UserDetailComponent;
  let userService: jasmine.SpyObj<UserService>;

  const mockUser: User = {
    id: 'abc',
    name: 'Max Mustfrau',
    email: 'max@mustfrau.de',
    books: [
      {
        isbn: '10',
        title: 'Book A',
        authors: [],
        publisher: '',
        publishedDate: '',
        description: '',
        coverUrl: '',
        rating: 5,
        reviews: []
      }
    ]
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj<UserService>('UserService', ['getUserById']);
    userServiceSpy.getUserById.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [ UserDetailComponent, HttpClientTestingModule ],
      providers: [
        { provide: UserService,    useValue: userServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'abc' } } } }
      ]
    }).compileComponents();

    fixture     = TestBed.createComponent(UserDetailComponent);
    comp        = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('lädt User und Bücher', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(comp.user).toEqual(mockUser);
    expect(comp.loading).toBeFalse();
  }));

  it('zeigt Fehlermeldung bei Fehler', fakeAsync(() => {
    userService.getUserById.and.returnValue(throwError(() => new Error()));
    fixture.detectChanges();
    tick();
    expect(comp.errorMsg).toBe('Benutzerdaten konnten nicht geladen werden.');
  }));
});
