import { DataSource } from 'typeorm';
import { UserConstants } from '../core/constants';
import { AgencyEntity } from '../database/entities/agency.entity';

export const agencyProviders = [
    {
        provide: 'AGENCY_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(AgencyEntity),
        inject: [UserConstants.DATA_SOURCE],
    },
];
