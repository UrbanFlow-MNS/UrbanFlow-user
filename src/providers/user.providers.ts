import { DataSource } from 'typeorm';
import { AppConstants } from '../core/constants';
import { UserEntity } from '../database/entities/user.entity';

export const userProviders = [
    {
        provide: AppConstants.USER_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntity),
        inject: [AppConstants.DATA_SOURCE],
    },
];
