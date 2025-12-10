import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  telephone: string;
}

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  membre: {
    id: string;
    nom: string;
    prenom: string;
    codeMembre: string;
    role: string;
  };
}
