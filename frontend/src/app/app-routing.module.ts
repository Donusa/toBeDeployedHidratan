import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../components/home/home.component';
import { LoginComponent } from '../components/login/login.component';
import { DeliveryViewComponent } from '../components/delivery-view/delivery-view.component';
import { StockManagementComponent } from '../components/stock-management/stock-management.component';
import { DeliveryManagementComponent} from '../components/delivery-management/delivery-management.component';
import { ClientManagementComponent } from '../components/client-management/client-management.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ProfileComponent } from 'src/components/profile/profile.component';
import { ForgotPasswordComponent } from 'src/components/forgot-password/forgot-password.component';

const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'login',component: LoginComponent},
  {path: 'home',component: HomeComponent, canActivate: [AuthGuardService]},
  {path: 'delivery-view', component: DeliveryViewComponent, canActivate: [AuthGuardService], data: { roles: ['ROLE_ADMIN', 'ROLE_DELIVERY'] }},
  {path: 'stock-management', component: StockManagementComponent, canActivate: [AuthGuardService], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'delivery-management', component: DeliveryManagementComponent, canActivate: [AuthGuardService], data: { roles: ['ROLE_ADMIN'] }},
  {path: 'client-management', component: ClientManagementComponent, canActivate: [AuthGuardService], data: { roles: ['ROLE_ADMIN', 'ROLE_WORKER'] }},
  {path: 'profile', component: ProfileComponent, canActivate: [AuthGuardService]},
  {path: 'forgot-password', component: ForgotPasswordComponent},
  {path: '**', redirectTo: 'login'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
