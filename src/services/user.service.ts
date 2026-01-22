import { LogBody, LogEventType, SetRefreshTokenDto, UserDto, UserSignUpBody } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { UserEntity } from '../objects/entities/user.entity';
import { LogsService } from './log.service';

@Injectable()
export class UserService {
  
    constructor(
        private logsService: LogsService,
        @InjectRepository(UserEntity) private repository: Repository<UserEntity>
    ) { }

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

    async create(body: UserSignUpBody): Promise<UserDto> {
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
            const logUserDeleted = new LogBody("UrbanFlow-Auth", "200", `User ${existing.email} deleted`)
            this.logsService.sendEvent(LogEventType.LOGS_CREATE, logUserDeleted)
            return {
                statusCode: 200,
                message: 'User deleted successfully',
            };
        } else {
            const logUserNotFound = new LogBody("UrbanFlow-Auth", "404", `User not found by id`)
            this.logsService.sendEvent(LogEventType.LOGS_CREATE, logUserNotFound)
            throw new NotFoundException('User not found');
        }
    }

}