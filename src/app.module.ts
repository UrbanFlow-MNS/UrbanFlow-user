import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { UserEntity } from './objects/entities/user.entity';
import { LogsService } from './services/log.service';
import { UserService } from './services/user.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.POSTGRES_HOST,
            port: Number(process.env.POSTGRES_PORT),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            entities: [
                UserEntity
            ],
            synchronize: true // TODO: process.env.POSTGRES_SYNCHRONISE === 'true',
        }),
        TypeOrmModule.forFeature([UserEntity]),
        ClientsModule.register([
            {
                name: 'LOGS_SERVICE',
                transport: Transport.RMQ,
                options: {
                    urls: [process.env.RABBIT_MQ ?? ''],
                    queue: 'LOGS_QUEUE',
                    queueOptions: { durable: false },
                },
            },
        ])
    ],
    controllers: [UserController],
    providers: [UserService, LogsService],
})
export class AppModule { }
