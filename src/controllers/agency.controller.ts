import { Controller, UseFilters, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HttpToRpcExceptionFilter } from '../filters/http-to-rpc-exception.filter';
import { GrpcAuthGuard } from '../guards/grpc-auth.guard';
import { AgencyService } from '../services/agency.service';
import {
    AgencyByIdRequest,
    AgencyDtoGrpc,
    AgencyListResponse,
    AgencyUserRequest,
    CreateAgencyRequest,
    EmptyResponse,
    FindOneAgencyResponse,
    UserListResponse,
    UserRoleType as GrpcUserRoleType,
} from '../../../proto/generated/typescript/user';

type AgencyResponse = {
    id: number;
    city: string;
    createdBy: number;
    createdAt: Date | string;
    userIds: number[];
};

@UseGuards(GrpcAuthGuard)
@UseFilters(new HttpToRpcExceptionFilter())
@Controller()
export class AgencyGrpcController {

    constructor(private readonly agencyService: AgencyService) { }

    @GrpcMethod('AgencyService', 'Create')
    async create(data: CreateAgencyRequest): Promise<AgencyDtoGrpc> {
        const agency = await this.agencyService.create({ city: data.city }, data.callerId);
        return this.toGrpc(agency);
    }

    @GrpcMethod('AgencyService', 'FindAll')
    async findAll(): Promise<AgencyListResponse> {
        const agencies = await this.agencyService.findAll();
        return { agencies: agencies.map(a => this.toGrpc(a)) };
    }

    @GrpcMethod('AgencyService', 'FindOne')
    async findOne(data: AgencyByIdRequest): Promise<FindOneAgencyResponse> {
        try {
            const agency = await this.agencyService.findOne(data.id);
            return { agency: this.toGrpc(agency) };
        } catch {
            return { agency: undefined };
        }
    }

    @GrpcMethod('AgencyService', 'FindUsers')
    async findUsers(data: AgencyByIdRequest): Promise<UserListResponse> {
        const users = await this.agencyService.findUsers(data.id);
        return {
            users: users.map(u => ({
                id: u.id ?? 0,
                firstName: u.firstName ?? '',
                lastName: u.lastName ?? '',
                email: u.email ?? '',
                role: u.role as unknown as GrpcUserRoleType,
                refreshToken: undefined,
                accessToken: undefined,
            })),
        };
    }

    @GrpcMethod('AgencyService', 'AddUser')
    async addUser(data: AgencyUserRequest): Promise<EmptyResponse> {
        await this.agencyService.addUser(data.agencyId, data.userId);
        return {};
    }

    @GrpcMethod('AgencyService', 'RemoveUser')
    async removeUser(data: AgencyUserRequest): Promise<EmptyResponse> {
        await this.agencyService.removeUser(data.agencyId, data.userId);
        return {};
    }

    @GrpcMethod('AgencyService', 'Delete')
    async delete(data: AgencyByIdRequest): Promise<EmptyResponse> {
        await this.agencyService.delete(data.id);
        return {};
    }

    private toGrpc(agency: AgencyResponse): AgencyDtoGrpc {
        return {
            id: agency.id,
            city: agency.city,
            createdBy: agency.createdBy,
            createdAt: agency.createdAt instanceof Date ? agency.createdAt.toISOString() : (agency.createdAt ?? ''),
            userIds: agency.userIds ?? [],
        };
    }
}
