import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserController } from './controllers/user.controller';
import { DatabaseModule } from './database/database.module';
import { userProviders } from './providers/user.providers';
import { LogsService } from './services/log.service';
import { UserService } from './services/user.service';
import {AuthEventsController} from "./controllers/auth-events.controller";
import {UserConstants} from "./core/constants";

@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot({ isGlobal: true }),
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
    controllers: [
        UserController,
        AuthEventsController
    ],
    providers: [
        ...userProviders,
        UserService,
        LogsService,
        { provide: UserConstants.IUSER_SERVICE, useClass: UserService },
    ],
})

export class AppModule { }
