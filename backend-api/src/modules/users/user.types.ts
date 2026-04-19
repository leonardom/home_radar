export type UserStatus = "active" | "deleted";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewUser = Pick<User, "name" | "email" | "passwordHash"> & {
  status?: UserStatus;
};
