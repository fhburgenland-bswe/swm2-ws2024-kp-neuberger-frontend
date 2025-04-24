import {RouterModule} from '@angular/router';
import { UserCreateComponent } from './pages/user-create/user-create.component';
import {NgModule} from '@angular/core';
import {HomeComponent} from './pages/home/home.component';
import {UserListComponent} from './pages/user-list/user-list.component';

export const routes = [
  { path: '', component: HomeComponent },
  { path: 'users/create', component: UserCreateComponent },
  { path: 'users',        component: UserListComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
