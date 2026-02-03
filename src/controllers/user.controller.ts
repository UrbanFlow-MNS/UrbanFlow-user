import { AuthEventType, SetRefreshTokenDto, UserSignUpBody } from '@bato-urbanflow/urbanflow-models';
import { Body, Controller, Delete, Param, ParseIntPipe, Put } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserService } from "../services/user.service";
import { RpcValidationPipe } from "../utils/rpc-validation-pipe";

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @ApiOperation({
        summary: 'Change user password',
        description: 'Updates the password of a user identified by its unique ID'
    })
    @ApiResponse({ status: 200, description: 'Password successfully updated' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @Put(':id/password')
    async updatePassword(
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

    @MessagePattern({ cmd: AuthEventType.FIND_ONE_BY_EMAIL })
    findOneUserByEmailFromEvent(
        @Payload(new RpcValidationPipe()) data: { email: string },
    ) {
        return this.userService.findOneByEmail(data.email);
    }

    @MessagePattern({ cmd: AuthEventType.NEED_USER_CREATION })
    createUserFromEvent(@Payload(new RpcValidationPipe()) data: UserSignUpBody) {
        return this.userService.create(data);
    }

    @MessagePattern({ cmd: AuthEventType.SET_REFRESH_TOKEN })
    setRefreshTokenFromEvent(
        @Payload(new RpcValidationPipe()) data: SetRefreshTokenDto,
    ) {
        return this.userService.setRefreshToken(data);
    }

    @MessagePattern({ cmd: 'auth.checkUserCredentials' })
    checkUserCredentialsFromEvent(
        @Payload(new RpcValidationPipe()) data: { email, password },
    ) {
        return this.userService.checkUserCredentials(data.email, data.password);
    }

    @MessagePattern({ cmd: 'user.updatePassword' })
    updatePasswordFromEvent(
        @Payload(new RpcValidationPipe()) data: { id: number, body }
    ) {
        return this.userService.updatePassword(data.id, data.body.newPassword)
    }

}