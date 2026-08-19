import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    if (!email || typeof email !== 'string' || !pass || typeof pass !== 'string') {
      return null;
    }
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && user.password && (await bcrypt.compare(pass, user.password))) {
        const { password, ...result } = user;
        return result;
      }
    } catch (error) {
      console.error('Error in validateUser:', error);
      return null;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id.toString(), role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(data: any) {
    const user = await this.usersService.create(data);
    return this.login(user);
  }
}
