import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
            refreshToken: this.refreshToken
        });
    }

}