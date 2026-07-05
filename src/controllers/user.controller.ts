import { AuthEventType, SetRefreshTokenDto, UserDto, UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Body, Controller, Delete, Inject, Param, ParseIntPipe, Put } from "@nestjs/common";
import { GrpcMethod, MessagePattern, Payload } from "@nestjs/microservices";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RpcValidationPipe } from "../utils/rpc-validation-pipe";
import { IUserService } from "../interfaces/user-service.interface";
import { UserConstants } from "../core/constants";

import {
    CheckCredentialsRequest,
    CheckUserCredentialsResponse,
    CreateUserRequest,
    FindOneByEmailRequest,
    FindOneByEmailResponse,
    FindOneByIdRequest,
    FindOneByIdResponse,
    SetRefreshTokenRequest,
    UserDtoGrpc,
    UserRoleType as GrpcUserRoleType,
} from '../../../proto/generated/typescript/user';

@ApiTags('User')
@Controller('user')
export class UserController {

    constructor(@Inject(UserConstants.IUSER_SERVICE) private readonly userService: IUserService) { }

    @ApiOperation({
        summary: 'Change user password',
        description: 'Updates the password of a user identified by its unique ID'
    })
    @ApiResponse({ status: 200, description: 'Password successfully updated' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Put(':id/password')
    updatePassword(
        @Param('id', ParseIntPipe) id: number,
        @Body('newPassword') newPassword: string
    ) {
        return this.userService.updatePassword(id, newPassword);
    }

    @ApiOperation({
        summary: 'Delete a user',
        description: 'Deletes a user account identified by its unique ID'
    })
    @ApiResponse({ status: 200, description: 'User successfully deleted' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Delete(':id')
    async deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.userService.delete(id);
    }

    @MessagePattern({ cmd: AuthEventType.FIND_ONE_BY_ID })
    findOneUserByIdFromEvent(
        @Payload(new RpcValidationPipe()) data: { id: number },
    ) {
        return this.userService.findOneById(data.id);
    }

    @MessagePattern({ cmd: 'user.findOne' })
    async findOneById(@Payload() data: { id: number }) {
        const user = await this.userService.findOneById(data.id);
        if (!user) return null;
        const { refreshToken, ...info } = user;
        return info;
    }

}

@Controller()
export class UserGrpcController {
    constructor(@Inject(UserConstants.IUSER_SERVICE) private readonly userService: IUserService) { }

    @GrpcMethod('UserService', 'CreateUser')
    async createUser(data: CreateUserRequest): Promise<UserDtoGrpc> {
        const user = await this.userService.create({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password, role: UserRoleType.USER_CITY });
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
