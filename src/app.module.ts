import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AdminUserCityController } from './controllers/admin-user-city.controller';
import { AgencyController } from './controllers/agency.controller';
import { AuthEventsController } from "./controllers/auth-events.controller";
import { PrometheusController } from './controllers/prometheus.controller';
import { UserController, UserGrpcController } from './controllers/user.controller';
import { UserConstants } from "./core/constants";
import { DatabaseModule } from './database/database.module';
import { agencyProviders } from './providers/agency.providers';
import { userProviders } from './providers/user.providers';
import { AdminUserCityService } from './services/admin-user-city.service';
import { AgencyService } from './services/agency.service';
import { LogsService } from './services/log.service';
import { PrometheusService } from './services/prometheus.service';
import { UserService } from './services/user.service';

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
        UserGrpcController,
        AuthEventsController,
        AdminUserCityController,
        AgencyController,
        PrometheusController,
    ],
    providers: [
        ...userProviders,
        UserService,
        AdminUserCityService,
        ...agencyProviders,
        AgencyService,
        LogsService,
        { provide: UserConstants.IUSER_SERVICE, useClass: UserService },
        PrometheusService,
        { provide: 'IPrometheusService', useClass: PrometheusService },
    ],
})

export class AppModule { }
