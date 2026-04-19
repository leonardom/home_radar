import { UsersRepository } from "../users/users.repository";
import type { User } from "../users/user.types";
import type { RegisterRequest } from "./register.schemas";
import { PasswordService } from "./password.service";

export class RegisterService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async register(input: RegisterRequest): Promise<User> {
    const passwordHash = await this.passwordService.hashPassword(input.password);

    return this.usersRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }
}
