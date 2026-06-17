import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity()
export class AgencyEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    city: string;

    @Column()
    createdBy: number;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => UserEntity, (user) => user.agency)
    users: UserEntity[];
}
