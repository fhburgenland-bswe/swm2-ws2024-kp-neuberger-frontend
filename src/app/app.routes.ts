import {RouterModule} from '@angular/router';
import { UserCreateComponent } from './pages/user-create/user-create.component';
import {NgModule} from '@angular/core';
import {HomeComponent} from './pages/home/home.component';
import {UserListComponent} from './pages/user-list/user-list.component';
import {UserDetailComponent} from './pages/user-detail/user-detail.component';
import {BookDetailComponent} from './pages/book-detail/book-detail.component';

export const routes = [
  { path: '', component: HomeComponent },
  { path: 'users/create', component: UserCreateComponent },
  { path: 'users',        component: UserListComponent },
  { path: 'users/:userId',component: UserDetailComponent, data: { renderMode: 'default' },},
  { path: 'users/:userId/books/:isbn', component: BookDetailComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
