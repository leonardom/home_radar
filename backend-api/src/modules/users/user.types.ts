export type UserStatus = "active" | "deleted";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type NewUser = Pick<User, "email" | "passwordHash"> & {
  status?: UserStatus;
};
