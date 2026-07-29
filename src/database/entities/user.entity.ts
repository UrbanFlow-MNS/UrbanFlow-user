import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AgencyEntity } from './agency.entity';

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

    @Column({ type: 'text', nullable: true })
    refreshToken?: string

    @Column({ nullable: true })
    createdBy?: number

    @Column({ nullable: true })
    agencyId?: number;

    @ManyToOne(() => AgencyEntity, (agency) => agency.users, { nullable: true })
    agency?: AgencyEntity;

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
            agencyId: this.agencyId ?? undefined,
        });
    }

}