import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

@Directive({
  selector: '[appRole]',
  standalone: true
})
export class RoleDirective {
  private currentUserRole: string = '';
  private requiredRoles: string[] = [];

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthenticationService
  ) {
    this.currentUserRole = this.authService.getCurrentRole();
  }

  @Input()
  set appRole(roles: string | string[]) {
    this.requiredRoles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  private updateView(): void {
    this.viewContainer.clear();
    if (this.checkRole()) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  private checkRole(): boolean {
    if (!this.requiredRoles || this.requiredRoles.length === 0) return true;
    return this.requiredRoles.includes(this.currentUserRole);
  }
} 