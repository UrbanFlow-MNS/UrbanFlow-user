import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Controller, UseFilters, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HttpToRpcExceptionFilter } from '../filters/http-to-rpc-exception.filter';
import { GrpcAuthGuard } from '../guards/grpc-auth.guard';
import { AdminUserService } from '../services/admin-user.service';
import {
    CreateManagedUserRequest,
    DeleteManagedUserRequest,
    EmptyResponse,
    FindAllManagedUsersRequest,
    FindOneManagedUserRequest,
    FindOneManagedUserResponse,
    UpdateManagedUserRequest,
    UserDtoGrpc,
    UserListResponse,
    UserRoleType as GrpcUserRoleType,
} from '../../../proto/generated/typescript/user';

@UseGuards(GrpcAuthGuard)
@UseFilters(new HttpToRpcExceptionFilter())
@Controller()
export class AdminUserGrpcController {

    constructor(private readonly adminUserService: AdminUserService) { }

    @GrpcMethod('AdminUserService', 'Create')
    async create(data: CreateManagedUserRequest): Promise<UserDtoGrpc> {
        const user = await this.adminUserService.create(
            {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
                role: data.role as unknown as UserRoleType,
            },
            data.callerId,
            data.callerRole as unknown as UserRoleType,
        );
        return this.toGrpc(user);
    }

    @GrpcMethod('AdminUserService', 'FindAll')
    async findAll(data: FindAllManagedUsersRequest): Promise<UserListResponse> {
        const users = await this.adminUserService.findAll(data.callerId, data.callerRole as unknown as UserRoleType);
        return { users: users.map(u => this.toGrpc(u)) };
    }

    @GrpcMethod('AdminUserService', 'FindOne')
    async findOne(data: FindOneManagedUserRequest): Promise<FindOneManagedUserResponse> {
        try {
            const user = await this.adminUserService.findOne(data.id, data.callerId, data.callerRole as unknown as UserRoleType);
            return { user: this.toGrpc(user) };
        } catch {
            return { user: undefined };
        }
    }

    @GrpcMethod('AdminUserService', 'Update')
    async update(data: UpdateManagedUserRequest): Promise<UserDtoGrpc> {
        const user = await this.adminUserService.update(
            data.id,
            {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
            },
            data.callerId,
            data.callerRole as unknown as UserRoleType,
        );
        return this.toGrpc(user);
    }

    @GrpcMethod('AdminUserService', 'Delete')
    async delete(data: DeleteManagedUserRequest): Promise<EmptyResponse> {
        await this.adminUserService.delete(data.id, data.callerId, data.callerRole as unknown as UserRoleType);
        return {};
    }

    private toGrpc(user: UserDto): UserDtoGrpc {
        return {
            id: user.id ?? 0,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            email: user.email ?? '',
            role: user.role as unknown as GrpcUserRoleType,
            refreshToken: user.refreshToken ?? undefined,
            accessToken: user.accessToken ?? undefined,
            agencyId: user.agencyId ?? undefined,
        };
    }
}
