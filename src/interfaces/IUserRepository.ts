import { UserEntity } from "../database/entities/user.entity";

export interface IUserRepository {
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: number): Promise<UserEntity | null>;
    save(user: Partial<UserEntity>): Promise<UserEntity>;
    updateRefreshToken(id: number, token: string | null): Promise<void>;
    delete(id: number): Promise<void>;
}