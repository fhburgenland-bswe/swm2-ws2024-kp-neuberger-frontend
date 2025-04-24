import {RouterModule} from '@angular/router';
import { UserCreateComponent } from './components/user-create/user-create.component';
import {NgModule} from '@angular/core';
import {HomeComponent} from './pages/home/home.component';

export const routes = [
  { path: '', component: HomeComponent },
  { path: 'users/create', component: UserCreateComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
