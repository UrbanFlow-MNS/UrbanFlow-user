import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { config } from 'dotenv';
config({ path: __dirname + '/../../.env' });
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'user',
            protoPath: join(__dirname, '../../proto/files/user.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT ?? 7006}`,
            loader: { enums: String },
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.API_PORT ?? 0);
}
bootstrap();
