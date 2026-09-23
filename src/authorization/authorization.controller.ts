import { Controller } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { ApiTags } from '@nestjs/swagger';
import {CommonAuthTypes} from '@SergeyLys/tracker-contracts';
import { AuthorizationServiceTypes } from '@SergeyLys/tracker-contracts';
import { GrpcMethod } from '@nestjs/microservices';

const {
  AUTH_SERVICE_NAME,
  AuthServiceControllerMethods,
} = AuthorizationServiceTypes;


type AuthServiceController = AuthorizationServiceTypes.AuthServiceController;

type CreateUserRequest = CommonAuthTypes.RegisterRequest;
type ValidateUserRequest = CommonAuthTypes.LoginRequest;

@ApiTags('Authorization')
@Controller('auth')
@AuthServiceControllerMethods()
export class AuthorizationController implements AuthServiceController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @GrpcMethod(AUTH_SERVICE_NAME, 'login')
  login(payload: ValidateUserRequest) {
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
}
