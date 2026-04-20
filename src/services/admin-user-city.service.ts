import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { UserConstants } from '../core/constants';
import { UserEntity } from '../database/entities/user.entity';
import { CreateCityUserDto } from '../dtos/create-city-user.dto';
import { UpdateCityUserDto } from '../dtos/update-city-user.dto';
import { LogsService } from './log.service';

@Injectable()
export class AdminUserCityService {

    constructor(
        private readonly logsService: LogsService,
        @Inject(UserConstants.USER_REPOSITORY) private readonly repository: Repository<UserEntity>
    ) { }

    async create(dto: CreateCityUserDto, callerId: number): Promise<UserDto> {
        const existing = await this.repository.findOne({ where: { email: dto.email } });

        if (existing) {
            throw new BadRequestException('Email already used');
        }

        const hashedPassword = await argon2.hash(dto.password);

        const entity = this.repository.create({
            ...dto,
            password: hashedPassword,
            role: UserRoleType.USER_CITY,
            createdBy: callerId,
        });

        try {
            const saved = await this.repository.save(entity);
            return saved.toDto();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findAll(callerId: number, callerRole: UserRoleType): Promise<UserDto[]> {
        const where = callerRole === UserRoleType.SUPERADMIN
            ? { role: UserRoleType.USER_CITY }
            : { role: UserRoleType.USER_CITY, createdBy: callerId };

        const users = await this.repository.find({ where });
        return users.map(u => u.toDto());
    }

    async findOne(id: number, callerId: number, callerRole: UserRoleType): Promise<UserDto> {
        const user = await this.repository.findOne({
            where: { id, role: UserRoleType.USER_CITY },
        });

        if (!user) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('USER_CITY user not found');
        }

        if (callerRole !== UserRoleType.SUPERADMIN && user.createdBy !== callerId) {
            throw new NotFoundException('USER_CITY user not found');
        }

        return user.toDto();
    }

    async update(id: number, dto: UpdateCityUserDto, callerId: number, callerRole: UserRoleType): Promise<UserDto> {
        const user = await this.repository.findOne({
            where: { id, role: UserRoleType.USER_CITY },
        });

        if (!user) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('USER_CITY user not found');
        }

        if (callerRole !== UserRoleType.SUPERADMIN && user.createdBy !== callerId) {
            throw new NotFoundException('USER_CITY user not found');
        }

        if (dto.email && dto.email !== user.email) {
            const emailTaken = await this.repository.findOne({ where: { email: dto.email } });
            if (emailTaken) {
                throw new BadRequestException('Email already used');
            }
        }

        const updatePayload: Partial<UserEntity> = {};

        if (dto.firstName) updatePayload.firstName = dto.firstName;
        if (dto.lastName) updatePayload.lastName = dto.lastName;
        if (dto.email) updatePayload.email = dto.email;
        if (dto.password) updatePayload.password = await argon2.hash(dto.password);

        await this.repository.update(id, updatePayload);

        return this.findOne(id, callerId, callerRole);
    }

    async delete(id: number, callerId: number, callerRole: UserRoleType): Promise<{ statusCode: number; message: string }> {
        const user = await this.repository.findOne({
            where: { id, role: UserRoleType.USER_CITY },
        });

        if (!user) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('USER_CITY user not found');
        }

        if (callerRole !== UserRoleType.SUPERADMIN && user.createdBy !== callerId) {
            throw new NotFoundException('USER_CITY user not found');
        }

        await this.repository.delete(id);
        this.logsService.sendDeleteUser(user.email);

        return { statusCode: 200, message: 'USER_CITY user deleted successfully' };
    }
}
