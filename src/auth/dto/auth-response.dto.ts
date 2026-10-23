import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto';

export class AuthResponseDto {
  @ApiProperty({ type: () => UserResponseDto, description: 'User object' })
  user: UserResponseDto;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInRva2VuVmVyc2lvbiI6MCwiaWF0IjoxNzkyNzMzNTU5LCJleHAiOjE3OTI3MzQ0NTl9.DwjPwopv0kIOdIDbhN87CUP0ZMlvNsswnG8Es1DTiu8',
    description: 'JWT access token',
  })
  accessToken: string;
}
