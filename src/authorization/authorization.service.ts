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
import { status as GrpcStatus } from '@grpc/grpc-js';
import { Transaction } from 'sequelize';
import {
  PinoLoggerService,
  PinoLoggerModule,
} from '@SergeyLys/tracker-pinno-logger';
import { TokenService } from '../token/token.service';

type CreateUserRequest = CommonAuthTypes.RegisterRequest;
type ValidateUserRequest = CommonAuthTypes.LoginRequest;
type RefreshTokenRequest = CommonAuthTypes.RefreshTokenRequest;
type User = CommonUserTypes.User;

const { USER_SERVICE_NAME } = UserServiceTypes;

type UserServiceClient = UserServiceTypes.UserServiceClient;

@Injectable()
export class AuthorizationService {
  private userClient: UserServiceClient = {} as UserServiceClient;

  constructor(
    @Inject(USER_SERVICE_NAME) private client: ClientGrpc,
    @InjectModel(RefreshTokens)
    private readonly refreshTokensRepository: typeof RefreshTokens,
    private readonly logger: PinoLoggerService,
    private readonly tokenService: TokenService,
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

  async refresh(payload: RefreshTokenRequest) {
    const tokenHash = this.hashRefreshToken(payload.currentRefreshToken);

    const storedToken = await this.refreshTokensRepository.findOne({
      where: {
        tokenHash,
      },
    });

    if (!storedToken) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Invalid refresh token',
      });
    }

    if (storedToken.revokedAt) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Token was revoked',
      });
    }

    if (storedToken.expiresAt < new Date()) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Token was expired',
      });
    }

    const { user: candidate } =
      await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
        this.userClient.getUserById({ userId: storedToken.userId }).subscribe({
          next: (res) => resolve(res),
          error: (err) => reject(new RpcException(err)),
        });
      });

    if (!candidate) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }

    const accessToken = await this.generateAccessToken(candidate);

    const transaction =
      await this.refreshTokensRepository.sequelize!.transaction();

    try {
      const { refreshToken: newRefreshToken, id: newRefreshTokenId } =
        await this.saveRefreshToken(candidate?.id, transaction);

      console.log('\n\n\n');
      console.log('newRefreshTokenId ', newRefreshTokenId);
      console.log('\n\n\n');

      await storedToken.update(
        {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          replacedById: newRefreshTokenId,
        },
        {
          transaction,
        },
      );

      console.log('\n\n\n');
      console.log('newRefreshTokenId ', storedToken);
      console.log('\n\n\n');

      await transaction.commit();

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      await transaction.rollback();

      const err = error instanceof Error ? error : new Error(String(error));

      this.logger.error(err, 'AuthorizationService');

      throw new RpcException({
        code: GrpcStatus.INTERNAL,
        message: err.message,
      });
    }
  }

  private async saveRefreshToken(userId: string, transaction?: Transaction) {
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const token = await this.refreshTokensRepository.create(
      {
        tokenHash,
        expiresAt,
        userId,
      },
      { transaction },
    );

    return {
      id: token.id,
      refreshToken,
    };
  }

  private async getTokensPair(candidate: CommonUserTypes.User | undefined) {
    if (!candidate) {
      throw new RpcException({
        code: GrpcStatus.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }

    const accessToken = await this.generateAccessToken(candidate);
    const { refreshToken } = await this.saveRefreshToken(candidate.id);

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

  private generateAccessToken(user: Pick<User, 'email' | 'roles' | 'id'>) {
    return this.tokenService.createAccessToken({
      email: user.email,
      sub: user.id,
      // roles: user.roles
    });
  }
}
