import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoleType } from '../enums/user-role.enum';
import { UserDto } from '../body/user.dto';

@Entity()
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({ type: 'enum', enum: UserRoleType })
    role: UserRoleType;

    @Column({ unique: true })
    email: string

    @Column()
    @Exclude()
    password: string

    @Column({ nullable: true })
    refreshToken?: string

    @CreateDateColumn()
    createdAt: Date

    toDto(): UserDto {
        return new UserDto({
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            role: this.role,
            refreshToken: this.refreshToken,
            createdAt: this.createdAt
        });
    }

}