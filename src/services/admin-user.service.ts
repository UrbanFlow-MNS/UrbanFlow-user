import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { In, Repository } from 'typeorm';
import { UserConstants } from '../core/constants';
import { UserEntity } from '../database/entities/user.entity';
import { CreateManagedUserDto } from '../dtos/create-managed-user.dto';
import { UpdateManagedUserDto } from '../dtos/update-managed-user.dto';
import { LogsService } from './log.service';

const MANAGED_ROLES: Record<string, UserRoleType[]> = {
    [UserRoleType.SUPERADMIN]: [UserRoleType.USER_CITY, UserRoleType.TECHNICIAN],
    [UserRoleType.ADMIN_USER_CITY]: [UserRoleType.USER_CITY],
    [UserRoleType.ADMIN_TECHNICIAN]: [UserRoleType.TECHNICIAN],
};

export function managedRolesFor(callerRole: UserRoleType): UserRoleType[] {
    return MANAGED_ROLES[callerRole] ?? [];
}

@Injectable()
export class AdminUserService {

    constructor(
        private readonly logsService: LogsService,
        @Inject(UserConstants.USER_REPOSITORY) private readonly repository: Repository<UserEntity>
    ) { }

    async create(dto: CreateManagedUserDto, callerId: number, callerRole: UserRoleType): Promise<UserDto> {
        const managedRoles = managedRolesFor(callerRole);

        if (!managedRoles.includes(dto.role)) {
            throw new BadRequestException('You are not allowed to create a user with this role');
        }

        const existing = await this.repository.findOne({ where: { email: dto.email } });

        if (existing) {
            throw new BadRequestException('Email already used');
        }

        const hashedPassword = await argon2.hash(dto.password);

        const entity = this.repository.create({
            ...dto,
            password: hashedPassword,
            role: dto.role,
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
        const managedRoles = managedRolesFor(callerRole);

        if (managedRoles.length === 0) {
            return [];
        }

        const users = await this.repository.find({ where: { role: In(managedRoles) } });
        return users.map(u => u.toDto());
    }

    async findOne(id: number, callerId: number, callerRole: UserRoleType): Promise<UserDto> {
        const user = await this.findManaged(id, callerRole);
        return user.toDto();
    }

    async update(id: number, dto: UpdateManagedUserDto, callerId: number, callerRole: UserRoleType): Promise<UserDto> {
        const user = await this.findManaged(id, callerRole);

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
        const user = await this.findManaged(id, callerRole);

        await this.repository.delete(id);
        this.logsService.sendDeleteUser(user.email);

        return { statusCode: 200, message: 'User deleted successfully' };
    }

    private async findManaged(id: number, callerRole: UserRoleType): Promise<UserEntity> {
        const managedRoles = managedRolesFor(callerRole);

        if (managedRoles.length === 0) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('User not found');
        }

        const user = await this.repository.findOne({
            where: { id, role: In(managedRoles) },
        });

        if (!user) {
            this.logsService.sendUserNotFound();
            throw new NotFoundException('User not found');
        }

        return user;
    }
}
