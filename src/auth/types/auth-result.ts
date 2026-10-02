import { UserResponseDto } from '../../users/dto';

export type AuthResult = {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
};
