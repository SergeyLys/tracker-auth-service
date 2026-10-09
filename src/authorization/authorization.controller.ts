import { Controller, UseInterceptors } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { ApiTags } from '@nestjs/swagger';
import { CommonAuthTypes } from '@SergeyLys/tracker-contracts';
import { AuthorizationServiceTypes } from '@SergeyLys/tracker-contracts';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcLoggingInterceptor } from '@SergeyLys/tracker-pinno-logger';
import { TokenService } from '../token/token.service';

const { AUTH_SERVICE_NAME, AuthServiceControllerMethods } =
  AuthorizationServiceTypes;

type AuthServiceController = AuthorizationServiceTypes.AuthServiceController;

type CreateUserRequest = CommonAuthTypes.RegisterRequest;
type ValidateUserRequest = CommonAuthTypes.LoginRequest;
type RefreshTokenRequest = CommonAuthTypes.RefreshTokenRequest;

@ApiTags('Authorization')
@Controller('auth')
@AuthServiceControllerMethods()
@UseInterceptors(GrpcLoggingInterceptor)
export class AuthorizationController implements AuthServiceController {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly tokenService: TokenService,
  ) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'login')
  async login(payload: ValidateUserRequest) {
    return this.authorizationService.login(payload);
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'register')
  register(payload: CreateUserRequest) {
    return this.authorizationService.register(payload);
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'loginWithGoogle')
  loginWithGoogle(payload: ValidateUserRequest) {
    return this.authorizationService.loginWithGoogle(payload);
  }

  @GrpcMethod(AUTH_SERVICE_NAME, 'refresh')
  refresh(payload: RefreshTokenRequest) {
    return this.authorizationService.refresh(payload);
  }
}
