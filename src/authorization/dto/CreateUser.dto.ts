import { ApiProperty } from '@nestjs/swagger';
import { CommonUserTypes } from '@SergeyLys/tracker-contracts';

type User = CommonUserTypes.User;

export class CreateUserDto implements Partial<User> {
  @ApiProperty({ example: 'test@mail.com', description: 'Uniq id' })
  declare email: string;
  @ApiProperty({ example: 'Name', description: 'Users name' })
  declare name: string;
  @ApiProperty({ example: '123', description: 'Users password' })
  declare password: string;
  @ApiProperty({ example: 'COACH', description: 'Users role' })
  declare role: string;
}
