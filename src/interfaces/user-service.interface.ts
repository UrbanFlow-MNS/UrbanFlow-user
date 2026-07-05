import { SetRefreshTokenDto, UserDto, UserSignUpBody } from "@bato-urbanflow/urbanflow-models";

export interface IUserService {
    findOneByEmail(email: string): Promise<UserDto | null>;
    findOneById(id: number): Promise<UserDto | null>;
    create(body: UserSignUpBody): Promise<UserDto>;
    updatePassword(id: number, newPassword: string): void
    delete(id: number): Promise<{ statusCode: number; message: string }>;
    setRefreshToken(body: SetRefreshTokenDto): Promise<UserDto>;
    checkUserCredentials(email: string, password: string): Promise<boolean>;
}