import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ClientGrpc } from '@nestjs/microservices';
import {
  UserServiceTypes,
  CommonUserTypes,
  Schemas,
} from '@SergeyLys/tracker-contracts';
import { RpcException } from '@nestjs/microservices';
import { randomBytes, createHash } from 'node:crypto';
import { CommonAuthTypes } from '@SergeyLys/tracker-contracts';
import { InjectModel } from '@nestjs/sequelize';
import { RefreshTokens } from './entities/refresh-token.entity';
type CreateUserRequest = CommonAuthTypes.RegisterRequest;
type ValidateUserRequest = CommonAuthTypes.LoginRequest;
type User = CommonUserTypes.User;

const { USER_SERVICE_NAME } = UserServiceTypes;

type UserServiceClient = UserServiceTypes.UserServiceClient;

@Injectable()
export class AuthorizationService {
  private userClient: UserServiceClient = {} as UserServiceClient;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_SERVICE_NAME) private client: ClientGrpc,
    @InjectModel(RefreshTokens)
    private readonly refreshTokensRepository: typeof RefreshTokens,
  ) {}

  onModuleInit() {
    this.userClient =
      this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async login(loginUserDto: ValidateUserRequest) {
    const schema = Schemas.LoginRequestSchema.parse(loginUserDto);
    const { user: candidate } =
      await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
        this.userClient.validateUser(schema).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(new RpcException(err)),
        });
      });

    const tokens = await this.getTokensPair(candidate);

    return tokens;
  }

  async register(dto: CreateUserRequest) {
    const { user } = await new Promise<UserServiceTypes.UserResponse>(
      (resolve, reject) => {
        this.userClient.createUser(dto).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(new RpcException(err)),
        });
      },
    );
    const tokens = await this.getTokensPair(user);

    return tokens;
  }

  async loginWithGoogle(googleUser: ValidateUserRequest) {
    const schema = Schemas.LoginRequestSchema.parse(googleUser);
    const { user: candidate } =
      await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
        this.userClient.validateUser(schema).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(new RpcException(err)),
        });
      });
    const tokens = await this.getTokensPair(candidate);

    return tokens;
  }

  private async saveRefreshToken(userId: string) {
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.refreshTokensRepository.create({
      tokenHash,
      expiresAt,
      userId,
    });

    return refreshToken;
  }

  private async getTokensPair(candidate: CommonUserTypes.User | undefined) {
    if (!candidate) {
      throw new RpcException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(candidate);
    const refreshToken = await this.saveRefreshToken(candidate.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  private async generateAccessToken(user?: Partial<User>) {
    const payload = { email: user?.email, id: user?.id, roles: user?.roles };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
  }
}
