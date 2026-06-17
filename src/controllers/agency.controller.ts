import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HttpToRpcExceptionFilter } from '../filters/http-to-rpc-exception.filter';
import { AgencyService } from '../services/agency.service';
import { RpcValidationPipe } from '../utils/rpc-validation-pipe';

@UseFilters(new HttpToRpcExceptionFilter())
@Controller()
export class AgencyController {

    constructor(private readonly agencyService: AgencyService) { }

    @MessagePattern({ cmd: 'agency.create' })
    create(@Payload(new RpcValidationPipe()) data: { city: string; callerId: number }) {
        return this.agencyService.create({ city: data.city }, data.callerId);
    }

    @MessagePattern({ cmd: 'agency.findAll' })
    findAll() {
        return this.agencyService.findAll();
    }

    @MessagePattern({ cmd: 'agency.findOne' })
    findOne(@Payload() data: { id: number }) {
        return this.agencyService.findOne(data.id);
    }

    @MessagePattern({ cmd: 'agency.addUser' })
    addUser(@Payload() data: { agencyId: number; userId: number }) {
        return this.agencyService.addUser(data.agencyId, data.userId);
    }

    @MessagePattern({ cmd: 'agency.removeUser' })
    removeUser(@Payload() data: { agencyId: number; userId: number }) {
        return this.agencyService.removeUser(data.agencyId, data.userId);
    }

    @MessagePattern({ cmd: 'agency.delete' })
    delete(@Payload() data: { id: number }) {
        return this.agencyService.delete(data.id);
    }
}
