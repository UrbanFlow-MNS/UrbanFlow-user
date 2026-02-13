import { DataSource } from 'typeorm';
import {UserConstants} from '../core/constants';

export const databaseProviders = [
    {
        provide: UserConstants.DATA_SOURCE,
        useFactory: async () => {
            const dataSource = new DataSource({
                type: 'postgres',
                host: process.env.POSTGRES_HOST,
                port: Number(process.env.POSTGRES_PORT),
                username: process.env.POSTGRES_USER,
                password: process.env.POSTGRES_PASSWORD,
                database: process.env.POSTGRES_DB,
                entities: [
                    __dirname + '/../**/*.entity{.ts,.js}',
                ],
                synchronize: Boolean(process.env.POSTGRES_SYNCHRONIZE)
            })

            return dataSource.initialize()
        }
    }
]