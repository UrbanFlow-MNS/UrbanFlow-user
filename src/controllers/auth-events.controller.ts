import {Controller, UseFilters} from "@nestjs/common";
import {MessagePattern, Payload} from "@nestjs/microservices";
import {HttpToRpcExceptionFilter} from "../filters/http-to-rpc-exception.filter";
import {RpcValidationPipe} from "../utils/rpc-validation-pipe";
import {AuthEventType, SetRefreshTokenDto, UserSignUpBody} from "@bato-urbanflow/urbanflow-models";
import {UserService} from "../services/user.service";

@UseFilters(new HttpToRpcExceptionFilter())
@Controller('user')
export class AuthEventsController {

    constructor(private readonly userService: UserService) { }

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

    @MessagePattern({ cmd: 'user.deleteUser' })
    deleteUserFromEvent(
        @Payload(new RpcValidationPipe()) data: { id: number }
    ) {
        return this.userService.delete(data.id)
    }

}