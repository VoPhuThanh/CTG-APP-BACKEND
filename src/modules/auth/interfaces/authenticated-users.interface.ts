export interface AuthenticatedUser {
  id: string;
  username: string;
  role: {
    id: string;
    name: string;
  } | null;
  permissions: string[];
}
