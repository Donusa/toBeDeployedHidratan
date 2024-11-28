import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthenticationService } from '../services/authenticationService.service';

@Directive({
  selector: '[appRole]'
})
export class RoleDirective {
  private currentUserRole: string = '';

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthenticationService
  ) {
      this.currentUserRole = localStorage.getItem('role') || '';
  }

  @Input() set appRole(allowedRoles: string[]) {
    const hasAccess = this.checkRole(allowedRoles);
    
    if (hasAccess) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  private checkRole(allowedRoles: string[]): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return false;
    
    const currentRole = this.authService.getCurrentRole();
    const roleMapping: { [key: string]: string } = {
      'admin': 'ROLE_ADMIN',
      'worker': 'ROLE_DELIVERY'
    };

    const mappedRole = roleMapping[currentRole.toLowerCase()] || currentRole;
    return allowedRoles.includes(mappedRole);
  }
}
   
