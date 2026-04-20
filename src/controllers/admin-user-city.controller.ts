import { UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCityUserDto } from '../dtos/create-city-user.dto';
import { UpdateCityUserDto } from '../dtos/update-city-user.dto';
import { HttpToRpcExceptionFilter } from '../filters/http-to-rpc-exception.filter';
import { AdminUserCityService } from '../services/admin-user-city.service';
import { RpcValidationPipe } from '../utils/rpc-validation-pipe';

@ApiTags('Admin - User City')
@UseFilters(new HttpToRpcExceptionFilter())
@Controller('admin/city-users')
export class AdminUserCityController {

    constructor(private readonly adminUserCityService: AdminUserCityService) { }

    @ApiOperation({ summary: 'Create a USER_CITY account' })
    @ApiResponse({ status: 201, description: 'USER_CITY account created' })
    @ApiResponse({ status: 400, description: 'Email already used' })
    @Post()
    create(@Body() dto: CreateCityUserDto) {
        return this.adminUserCityService.create(dto, 0);
    }

    @ApiOperation({ summary: 'List USER_CITY accounts' })
    @ApiResponse({ status: 200, description: 'List of USER_CITY accounts' })
    @Get()
    findAll() {
        return this.adminUserCityService.findAll(0, UserRoleType.SUPERADMIN);
    }

    @ApiOperation({ summary: 'Get a USER_CITY account by ID' })
    @ApiResponse({ status: 200, description: 'USER_CITY account found' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.adminUserCityService.findOne(id, 0, UserRoleType.SUPERADMIN);
    }

    @ApiOperation({ summary: 'Update a USER_CITY account' })
    @ApiResponse({ status: 200, description: 'USER_CITY account updated' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCityUserDto) {
        return this.adminUserCityService.update(id, dto, 0, UserRoleType.SUPERADMIN);
    }

    @ApiOperation({ summary: 'Delete a USER_CITY account' })
    @ApiResponse({ status: 200, description: 'USER_CITY account deleted' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.adminUserCityService.delete(id, 0, UserRoleType.SUPERADMIN);
    }

    @MessagePattern({ cmd: 'adminUserCity.create' })
    createFromEvent(
        @Payload(new RpcValidationPipe()) data: { dto: CreateCityUserDto; callerId: number }
    ) {
        return this.adminUserCityService.create(data.dto, data.callerId);
    }

    @MessagePattern({ cmd: 'adminUserCity.findAll' })
    findAllFromEvent(
        @Payload() data: { callerId: number; callerRole: UserRoleType }
    ) {
        return this.adminUserCityService.findAll(data.callerId, data.callerRole);
    }

    @MessagePattern({ cmd: 'adminUserCity.findOne' })
    findOneFromEvent(
        @Payload() data: { id: number; callerId: number; callerRole: UserRoleType }
    ) {
        return this.adminUserCityService.findOne(data.id, data.callerId, data.callerRole);
    }

    @MessagePattern({ cmd: 'adminUserCity.update' })
    updateFromEvent(
        @Payload() data: { id: number; body: UpdateCityUserDto; callerId: number; callerRole: UserRoleType }
    ) {
        return this.adminUserCityService.update(data.id, data.body, data.callerId, data.callerRole);
    }

    @MessagePattern({ cmd: 'adminUserCity.delete' })
    deleteFromEvent(
        @Payload() data: { id: number; callerId: number; callerRole: UserRoleType }
    ) {
        return this.adminUserCityService.delete(data.id, data.callerId, data.callerRole);
    }
}
