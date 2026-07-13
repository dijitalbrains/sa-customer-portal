export interface AuthSession {
  userId: number;
  adminId: number;
  actorId: number;
  isAdmin: boolean;
}

export interface AutoLoginToken {
  userId: number;
  adminId: number;
  issuedAt: number | null;
}
