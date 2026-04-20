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
        return this.adminUserCityService.create(dto);
    }

    @ApiOperation({ summary: 'List all USER_CITY accounts' })
    @ApiResponse({ status: 200, description: 'List of USER_CITY accounts' })
    @Get()
    findAll() {
        return this.adminUserCityService.findAll();
    }

    @ApiOperation({ summary: 'Get a USER_CITY account by ID' })
    @ApiResponse({ status: 200, description: 'USER_CITY account found' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.adminUserCityService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a USER_CITY account' })
    @ApiResponse({ status: 200, description: 'USER_CITY account updated' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCityUserDto) {
        return this.adminUserCityService.update(id, dto);
    }

    @ApiOperation({ summary: 'Delete a USER_CITY account' })
    @ApiResponse({ status: 200, description: 'USER_CITY account deleted' })
    @ApiResponse({ status: 404, description: 'USER_CITY user not found' })
    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.adminUserCityService.delete(id);
    }

    // RPC patterns — accessible via TCP/RabbitMQ from the gateway

    @MessagePattern({ cmd: 'adminUserCity.create' })
    createFromEvent(@Payload(new RpcValidationPipe()) dto: CreateCityUserDto) {
        return this.adminUserCityService.create(dto);
    }

    @MessagePattern({ cmd: 'adminUserCity.findAll' })
    findAllFromEvent() {
        return this.adminUserCityService.findAll();
    }

    @MessagePattern({ cmd: 'adminUserCity.findOne' })
    findOneFromEvent(@Payload(new RpcValidationPipe()) data: { id: number }) {
        return this.adminUserCityService.findOne(data.id);
    }

    @MessagePattern({ cmd: 'adminUserCity.update' })
    updateFromEvent(@Payload(new RpcValidationPipe()) data: { id: number; body: UpdateCityUserDto }) {
        return this.adminUserCityService.update(data.id, data.body);
    }

    @MessagePattern({ cmd: 'adminUserCity.delete' })
    deleteFromEvent(@Payload(new RpcValidationPipe()) data: { id: number }) {
        return this.adminUserCityService.delete(data.id);
    }
}
