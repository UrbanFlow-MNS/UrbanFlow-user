import { DataSource } from 'typeorm';
import {UserConstants} from '../core/constants';
import { UserEntity } from '../database/entities/user.entity';

export const userProviders = [
    {
        provide: UserConstants.USER_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
        inject: [UserConstants.DATA_SOURCE],
    },
];
