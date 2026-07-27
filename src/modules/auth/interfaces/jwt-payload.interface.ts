export interface JwtPayload {
  sub: string;
  username: string;
  roleId?: string;
  roleName?: string;
  iat?: number;
  exp?: number;
}
