import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { LogBody } from '../objects/body/log.body';
import { UserEntity } from '../objects/entities/user.entity';
import { RMQEventType } from '../objects/enums/rmq-event.enum';
import { LogsService } from './log.service';
import { UserDto } from '../objects/body/user.dto';
import { UserBody } from '../objects/body/user.body';
import { SetRefreshTokenDto } from '../objects/body/set-refresh-token.dto';

@Injectable()
export class UserService {
  
    constructor(
        private logsService: LogsService,
        @InjectRepository(UserEntity) private repository: Repository<UserEntity>,
        @Inject('LOGS_SERVICE') private readonly client: ClientProxy,
    ) {
        this.logsService = new LogsService(client)
    }

    async findOneByEmail(email: string): Promise<UserDto | null> {
        const user = await this.repository.findOneBy({ email });
        if (user) {
            return user.toDto()
        } else { return null }
    }

    async findOneById(id: number): Promise<UserDto | null> {
        const user = await this.repository.findOneBy({ id });
         if (user) {
            return user.toDto()
        } else { return null }
    }

    async create(body: UserBody): Promise<UserDto> {
        const existing = await this.repository.findOne({ where: { email: body.email } });

        if (existing) {
            throw new BadRequestException("Email already used");
        }

        const hashedPassword = await argon2.hash(body.password);

        const userCreated = this.repository.create({
            ...body,
            password: hashedPassword,
        });

        try{
            const userSaved = await this.repository.save(userCreated);
            return userSaved.toDto()
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async setRefreshToken(body: SetRefreshTokenDto): Promise<UserDto> {
        const user = await this.findOneById(body.userId)
        if (user && user.id) {
            await this.repository.update(user.id, { refreshToken: body.refreshToken });
            user.refreshToken = body.refreshToken
            return user
        } else {
            throw new NotFoundException('User not found')
        }
    }

    async delete(id: number) {
        const existing = await this.repository.findOne({ where: { id: id } });
        if (existing) {
            await this.repository.delete(id)
            const logUserDeleted = new LogBody("200", `User ${existing.email} deleted`)
            this.logsService.sendEvent(RMQEventType.LOGS_CREATE, logUserDeleted)
            return {
                statusCode: 200,
                message: 'User deleted successfully',
            };
        } else {
            const logUserNotFound = new LogBody("404", `User not found by id`)
            this.logsService.sendEvent(RMQEventType.LOGS_CREATE, logUserNotFound)
            throw new NotFoundException('User not found');
        }
    }

}