import {
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma/prisma.service";
import { LoginDto, RefreshDto, RegisterDto, UserRoleDto } from "./dto";

type TokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(input: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase()
      }
    });
    if (existing) {
      throw new UnauthorizedException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name ?? input.email.split("@")[0],
        role: (input.role ?? UserRoleDto.QA) as UserRole
      }
    });

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      ...tokens
    };
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: input.email.toLowerCase()
      }
    });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      ...tokens
    };
  }

  async refresh(input: RefreshDto) {
    const refreshSecret = this.config.get<string>(
      "JWT_REFRESH_SECRET",
      "change-me-too"
    );
    const payload = await this.jwt.verifyAsync<TokenPayload>(input.refreshToken, {
      secret: refreshSecret
    });

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      }
    });
    if (!user) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role
    });
  }

  private async signTokens(payload: TokenPayload) {
    const accessTtl = this.config.get<number>("JWT_ACCESS_TTL", 900);
    const refreshTtl = this.config.get<number>("JWT_REFRESH_TTL", 604800);
    const refreshSecret = this.config.get<string>(
      "JWT_REFRESH_SECRET",
      "change-me-too"
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: `${accessTtl}s`
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: `${refreshTtl}s`
      })
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTtl
    };
  }
}
