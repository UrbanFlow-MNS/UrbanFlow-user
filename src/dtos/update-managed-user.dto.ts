import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateManagedUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MinLength(8)
    password?: string;
}
