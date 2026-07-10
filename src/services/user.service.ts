import { SetRefreshTokenDto, UserDto, UserRoleType, UserSignUpBody } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { UserConstants } from '../core/constants';
import { AgencyEntity } from '../database/entities/agency.entity';
import { UserEntity } from '../database/entities/user.entity';
import {IUserService} from '../interfaces/user-service.interface';
import { LogsService } from './log.service';

@Injectable()
export class UserService implements IUserService {

    constructor(
        private readonly logsService: LogsService,
        @Inject(UserConstants.USER_REPOSITORY) private readonly repository: Repository<UserEntity>,
        @Inject('AGENCY_REPOSITORY') private readonly agencyRepository: Repository<AgencyEntity>,
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

    async checkUserCredentials(email: string, password: string): Promise<boolean> {
        const user = await this.repository.findOne({
            where: { email },
            select: ['id', 'password']
        });

        if (!user) { return false; }

        const isPasswordMatching = await argon2.verify(user.password, password);
        return isPasswordMatching;
    }

    async create(body: UserSignUpBody): Promise<UserDto> {
        if (body.role === UserRoleType.ADMIN_USER_CITY && !body.agencyId) {
            throw new RpcException({ statusCode: 400, message: 'agencyId is required for ADMIN_USER_CITY role' });
        }

        if (body.agencyId) {
            const agency = await this.agencyRepository.findOneBy({ id: body.agencyId });
            if (!agency) {
                throw new RpcException({ statusCode: 404, message: 'Agency not found' });
            }
        }

        const existing = await this.repository.findOne({ where: { email: body.email } });
        if (existing) {
            throw new RpcException({ statusCode: 400, message: 'Invalid request' });
        }

        const hashedPassword = await argon2.hash(body.password);
        const userCreated = this.repository.create({ ...body, password: hashedPassword });

        try {
            const userSaved = await this.repository.save(userCreated);
            return userSaved.toDto();
        } catch (error: any) {
            throw new RpcException({ statusCode: 400, message: error?.message ?? 'Failed to create user' });
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

    async updatePassword(id: number, newPassword: string, callerId: number, callerRole: string) {
        if (callerRole !== 'SUPERADMIN' && callerId !== id) {
            throw new RpcException({ statusCode: 403, message: "Forbidden: cannot update another user's password" });
        }

        if (!newPassword || newPassword.length < 8) {
            throw new RpcException({ statusCode: 400, message: 'Password must be at least 8 characters long' });
        }

        const user = await this.repository.findOneBy({ id });

        if (!user) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('User not found');
        }

        const hashedPassword = await argon2.hash(newPassword);

        await this.repository.update(user.id, { password: hashedPassword });
        return { message: 'Password updated successfully' };
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