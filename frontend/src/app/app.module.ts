import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './interceptor/jwt.interceptor';

// Material Imports
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from '../components/login/login.component';
import { HomeComponent } from '../components/home/home.component';
import { DeliveryViewComponent } from '../components/delivery-view/delivery-view.component';
import { StockManagementComponent } from '../components/stock-management/stock-management.component';
import { DeliveryManagementComponent } from '../components/delivery-management/delivery-management.component';
import { ClientManagementComponent } from '../components/client-management/client-management.component';
import { ModalClientManagementComponent } from '../components/modals/client-modal/modal-form-client/modal-client-management.component';
import { RoleDirective } from './directives/role.directive';
import { ModalClientDetailComponent } from '../components/modals/client-modal/modal-client-details/modal-client-detail.component';
import { ModalDeliveryDetailComponent } from '../components/modals/delivery-modal/modal-delivery-detail/modal-delivery-detail.component';
import { ModalDeliveryComponent } from '../components/modals/delivery-modal/modal-form-delivery/modal-delivery.component';
import { ModalStockComponent } from '../components/modals/modal-stock/modal-form-stock/modal-stock.component';
import { ModalStockDetailComponent } from '../components/modals/modal-stock/modal-stock-detail/modal-stock-detail.component';
import { ModalStockHistoryComponent } from '../components/modals/modal-stock/modal-stock-history/modal-stock-history.component';
import { ModalWorkerComponent } from '../components/modals/worker-modal/modal-form-worker/modal-worker.component';
import { ModalWorkerDetailComponent } from '../components/modals/worker-modal/modal-worker-detail/modal-worker-detail.component';
import { ProfileComponent } from '../components/profile/profile.component';
import { DeleteProductDialogComponent } from '../components/modals/confirmation-dialog/delete-product-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { ModalPendingDeliveriesComponent } from '../components/modals/delivery-modal/modal-pending-deliveries/modal-pending-deliveries.component';
import { LogoutConfirmationDialogComponent } from '../components/logout-confirmation-dialog/logout-confirmation-dialog.component';
import { ForgotPasswordComponent } from '../components/forgot-password/forgot-password.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    RoleDirective,
    DeliveryViewComponent,
    StockManagementComponent,
    DeliveryManagementComponent,
    ClientManagementComponent,
    ModalClientManagementComponent,
    ModalClientDetailComponent,
    ModalDeliveryDetailComponent,
    ModalDeliveryComponent,
    ModalStockComponent,
    ModalStockDetailComponent,
    ModalStockHistoryComponent,
    ModalWorkerComponent,
    ModalWorkerDetailComponent,
    ProfileComponent,
    DeleteProductDialogComponent,
    ModalPendingDeliveriesComponent,
    LogoutConfirmationDialogComponent,
    ForgotPasswordComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatMenuModule,
    MatExpansionModule,
    MatSidenavModule,
    MatDividerModule,
    MatSortModule,
    MatPaginatorModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    BrowserModule,
    HttpClientModule,
    MatCheckboxModule,
    MatTabsModule,
    NgxMaterialTimepickerModule
  ],
  providers: [DatePipe,{provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule { }
