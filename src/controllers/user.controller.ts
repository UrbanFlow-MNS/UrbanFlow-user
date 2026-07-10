import { SetRefreshTokenDto, UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Controller, Inject, UseGuards } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { GrpcAuthGuard } from "../guards/grpc-auth.guard";
import { IUserService } from "../interfaces/user-service.interface";
import { UserConstants } from "../core/constants";

import {
    CheckCredentialsRequest,
    CheckUserCredentialsResponse,
    CreateUserRequest,
    DeleteUserRequest,
    EmptyResponse,
    FindOneByEmailRequest,
    FindOneByEmailResponse,
    FindOneByIdRequest,
    FindOneByIdResponse,
    SetRefreshTokenRequest,
    UpdatePasswordRequest,
    UserDtoGrpc,
    UserRoleType as GrpcUserRoleType,
} from '../../../proto/generated/typescript/user';

@UseGuards(GrpcAuthGuard)
@Controller()
export class UserGrpcController {
    constructor(@Inject(UserConstants.IUSER_SERVICE) private readonly userService: IUserService) { }

    @GrpcMethod('UserService', 'CreateUser')
    async createUser(data: CreateUserRequest): Promise<UserDtoGrpc> {
        const role = (data.role as unknown as UserRoleType) ?? UserRoleType.USER_CITY;
        const user = await this.userService.create({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password, role, agencyId: data.agencyId });
        return this.toGrpc(user);
    }

    @GrpcMethod('UserService', 'FindOneByEmail')
    async findOneByEmail(data: FindOneByEmailRequest): Promise<FindOneByEmailResponse> {
        const user = await this.userService.findOneByEmail(data.email);
        if (!user) return { user: undefined };
        return { user: this.toGrpc(user) };
    }

    @GrpcMethod('UserService', 'FindOneById')
    async findOneById(data: FindOneByIdRequest): Promise<FindOneByIdResponse> {
        const user = await this.userService.findOneById(data.id);
        if (!user) return { user: undefined };
        return { user: this.toGrpc(user) };
    }

    @GrpcMethod('UserService', 'SetRefreshToken')
    async setRefreshToken(data: SetRefreshTokenRequest): Promise<UserDtoGrpc> {
        const user = await this.userService.setRefreshToken(new SetRefreshTokenDto(data.userId, data.refreshToken));
        return this.toGrpc(user);
    }

    @GrpcMethod('UserService', 'CheckUserCredentials')
    async checkUserCredentials(data: CheckCredentialsRequest): Promise<CheckUserCredentialsResponse> {
        const isValid = await this.userService.checkUserCredentials(data.email, data.password);
        if (!isValid) return { user: undefined };
        const user = await this.userService.findOneByEmail(data.email);
        if (!user) return { user: undefined };
        return { user: this.toGrpc(user) };
    }

    @GrpcMethod('UserService', 'UpdatePassword')
    async updatePassword(data: UpdatePasswordRequest): Promise<EmptyResponse> {
        await this.userService.updatePassword(data.id, data.newPassword, data.callerId, data.callerRole as unknown as string);
        return {};
    }

    @GrpcMethod('UserService', 'DeleteUser')
    async deleteUser(data: DeleteUserRequest): Promise<EmptyResponse> {
        await this.userService.delete(data.id);
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
