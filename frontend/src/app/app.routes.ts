import { Routes } from '@angular/router';
import { LoginComponent } from './components/features/pages/login/login.component';
import { HomeComponent } from './components/features/pages/home/home.component';
import { AuthGuardService } from './services/auth-guard.service';
import { ClientComponent } from './components/features/pages/client/client.component';
import { DelivererComponent } from './components/features/pages/deliverer/deliverer.component';
import { ProductComponent } from './components/features/pages/product/product.component';
import { VisitComponent } from './components/features/pages/visit/visit.component';
import { ProfileComponent } from './components/features/pages/profile/profile.component';
import { ForgotPasswordComponent } from './components/features/pages/forgot-password/forgot-password.component';
import { BusinessManagementComponent } from './components/features/pages/business-management/business-management.component';
import { PublicHealthInfoComponent } from './components/features/pages/public-health-info/public-health-info.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'public/health-info',
    component: PublicHealthInfoComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    data: { skipInitialRender: true }
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'client',
    component: ClientComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'deliverer',
    component: DelivererComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'product',
    component: ProductComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'visit',
    component: VisitComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'business-management',
    component: BusinessManagementComponent,
    canActivate: [AuthGuardService]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    data: { skipInitialRender: true }
  }
];
