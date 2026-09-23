import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ClientGrpc } from '@nestjs/microservices';
import {UserServiceTypes, CommonUserTypes, Schemas} from '@SergeyLys/tracker-contracts';
import { RpcException } from '@nestjs/microservices';

import {CommonAuthTypes} from '@SergeyLys/tracker-contracts';
type CreateUserRequest = CommonAuthTypes.RegisterRequest;
type ValidateUserRequest = CommonAuthTypes.LoginRequest;
type User = CommonUserTypes.User;

const {
  USER_SERVICE_NAME,
} = UserServiceTypes;

type UserServiceClient = UserServiceTypes.UserServiceClient;

@Injectable()
export class AuthorizationService {
  private userClient: UserServiceClient = {} as UserServiceClient;
  
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_SERVICE_NAME) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.userClient = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async login(loginUserDto: ValidateUserRequest) {
    const schema = Schemas.LoginRequestSchema.parse(loginUserDto);
    const { user: candidate } = await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
      this.userClient.validateUser(schema).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(new RpcException(err)),
      });
    });
    const accessToken = await this.generateToken(candidate, process.env.JWT_SECRET);

    return {
      accessToken,
    };
  }

  async register(dto: CreateUserRequest) {
    const { user } = await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
      this.userClient.createUser(dto).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(new RpcException(err)),
      });
    });

    const accessToken = await this.generateToken(user, process.env.JWT_SECRET);

    return {
      accessToken,
    };
  }

  async loginWithGoogle(googleUser: ValidateUserRequest) {
    const schema = Schemas.LoginRequestSchema.parse(googleUser);
    const { user: candidate } = await new Promise<UserServiceTypes.UserResponse>((resolve, reject) => {
      this.userClient.validateUser(schema).subscribe({
        next: (res) => resolve(res),
        error: (err) => reject(new RpcException(err)),
      });
    });
    const accessToken = await this.generateToken(candidate, process.env.JWT_SECRET);

    return {
      accessToken,
    };
  }

  private async generateToken(user?: Partial<User>, secret?: string) {
    const payload = { email: user?.email, id: user?.id, roles: user?.roles };

    return this.jwtService.sign(payload, { secret, expiresIn: '365d' });
  }
}
