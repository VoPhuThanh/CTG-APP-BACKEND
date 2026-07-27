import { AuthenticatedUser } from './authenticated-users.interface';

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
