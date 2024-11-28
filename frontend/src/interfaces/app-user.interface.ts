export interface AppUser {
  email: string;
  name: string;
  role: string;
  active: boolean;
  roles?: string[];
  access_token?: string;
} 
