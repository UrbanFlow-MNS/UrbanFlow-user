import { AuthEventType } from '@bato-urbanflow/urbanflow-models';
import {Body, Controller, Delete, Inject, Param, ParseIntPipe, Put} from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RpcValidationPipe } from "../utils/rpc-validation-pipe";
import {IUserService} from "../interfaces/user-service.interface";
import {UserConstants} from "../core/constants";

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