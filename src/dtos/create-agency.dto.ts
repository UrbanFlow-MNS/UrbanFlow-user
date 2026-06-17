import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAgencyDto {
    @IsString()
    @IsNotEmpty()
    city: string;
}
