import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from './database/database.module';
import { userProviders } from './providers/user.providers';
import { LogsService } from './services/log.service';
import { UserService } from './services/user.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
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
    providers: [
        ...userProviders,
        UserService, LogsService
    ],
})

export class AppModule { }
