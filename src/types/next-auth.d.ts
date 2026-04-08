import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    adminId?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
    adminId?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    adminId?: number;
  }
}
