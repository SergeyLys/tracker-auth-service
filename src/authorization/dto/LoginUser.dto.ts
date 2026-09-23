import { ApiProperty } from '@nestjs/swagger';
import { CommonUserTypes } from '@SergeyLys/tracker-contracts';

type User = CommonUserTypes.User;

export class LoginUserDto implements Partial<User> {
  @ApiProperty({ example: 'test@mail.com', description: 'Uniq id' })
  declare email: string;
  @ApiProperty({ example: '123', description: 'Users password' })
  declare password: string;
}
