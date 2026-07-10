import { UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Controller, UseFilters, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HttpToRpcExceptionFilter } from '../filters/http-to-rpc-exception.filter';
import { GrpcAuthGuard } from '../guards/grpc-auth.guard';
import { AdminUserCityService } from '../services/admin-user-city.service';
import {
    CreateCityUserRequest,
    DeleteCityUserRequest,
    EmptyResponse,
    FindAllCityUsersRequest,
    FindOneCityUserRequest,
    FindOneCityUserResponse,
    UpdateCityUserRequest,
    UserDtoGrpc,
    UserListResponse,
    UserRoleType as GrpcUserRoleType,
} from '../../../proto/generated/typescript/user';

@UseGuards(GrpcAuthGuard)
@UseFilters(new HttpToRpcExceptionFilter())
@Controller()
export class AdminUserCityGrpcController {

    constructor(private readonly adminUserCityService: AdminUserCityService) { }

    @GrpcMethod('AdminUserCityService', 'Create')
    async create(data: CreateCityUserRequest): Promise<UserDtoGrpc> {
        const user = await this.adminUserCityService.create(
            { firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password },
            data.callerId,
        );
        return this.toGrpc(user);
    }

    @GrpcMethod('AdminUserCityService', 'FindAll')
    async findAll(data: FindAllCityUsersRequest): Promise<UserListResponse> {
        const users = await this.adminUserCityService.findAll(data.callerId, data.callerRole as unknown as UserRoleType);
        return { users: users.map(u => this.toGrpc(u)) };
    }

    @GrpcMethod('AdminUserCityService', 'FindOne')
    async findOne(data: FindOneCityUserRequest): Promise<FindOneCityUserResponse> {
        try {
            const user = await this.adminUserCityService.findOne(data.id, data.callerId, data.callerRole as unknown as UserRoleType);
            return { user: this.toGrpc(user) };
        } catch {
            return { user: undefined };
        }
    }

    @GrpcMethod('AdminUserCityService', 'Update')
    async update(data: UpdateCityUserRequest): Promise<UserDtoGrpc> {
        const user = await this.adminUserCityService.update(
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

    @GrpcMethod('AdminUserCityService', 'Delete')
    async delete(data: DeleteCityUserRequest): Promise<EmptyResponse> {
        await this.adminUserCityService.delete(data.id, data.callerId, data.callerRole as unknown as UserRoleType);
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
        };
    }
}
