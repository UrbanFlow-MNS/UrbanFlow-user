import { SetRefreshTokenDto, UserDto, UserSignUpBody } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { IUserService } from '../interfaces/IUserService';
import { UserEntity } from '../objects/entities/user.entity';
import { LogsService } from './log.service';

@Injectable()
export class UserService implements IUserService {
  
    constructor(
        private readonly logsService: LogsService,
        @InjectRepository(UserEntity) private readonly repository: Repository<UserEntity>
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

        try {
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
            this.logsService.sendUserNotFound()
            throw new NotFoundException('User not found')
        }
    }

    async delete(id: number) {
        const existing = await this.repository.findOne({ where: { id: id } });
        if (existing) {
            await this.repository.delete(id)
            this.logsService.sendDeleteUser(existing.email)
            return { statusCode: 200, message: 'User deleted successfully' }
        } else {
            this.logsService.sendUserNotFound()
            throw new NotFoundException('User not found');
        }
    }

}