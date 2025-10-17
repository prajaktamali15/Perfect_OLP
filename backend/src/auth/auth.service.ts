import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '@prisma/client'; // Prisma enum
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService, // for future use
  ) {}

  // -----------------------------
  // Validate user for login
  // -----------------------------
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  // -----------------------------
  // Login (JWT issue)
  // -----------------------------
  async login(user: { id: number; email: string; role: Role }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // -----------------------------
  // Register new user (Prisma-based)
  // -----------------------------
  async register(email: string, password: string, name?: string, role?: string) {
    // Check if user exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new ConflictException('User already exists');

    // Hash the password before creating user
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convert string role to Prisma enum, default to STUDENT
    let userRole: Role = Role.STUDENT;
    if (role && Object.values(Role).includes(role as Role)) {
      userRole = role as Role;
    }

    // Create user
    const newUser = await this.usersService.createUser({
      email,
      name,
      password: hashedPassword,
      role: userRole,
    });

    // Return JWT and user info (same as previous working behavior)
    return this.login({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
  }
}
