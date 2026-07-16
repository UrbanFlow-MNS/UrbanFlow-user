import { UserRoleType } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserConstants } from '../core/constants';
import { AgencyEntity } from '../database/entities/agency.entity';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class AgencyService {

    constructor(
        @Inject('AGENCY_REPOSITORY') private readonly agencyRepository: Repository<AgencyEntity>,
        @Inject(UserConstants.USER_REPOSITORY) private readonly userRepository: Repository<UserEntity>,
    ) { }

    private toResponse(agency: AgencyEntity) {
        return {
            id: agency.id,
            city: agency.city,
            createdBy: agency.createdBy,
            createdAt: agency.createdAt,
            userIds: agency.users ? agency.users.map(u => u.id) : [],
        };
    }

    async create(dto: { city: string }, callerId: number) {
        const entity = this.agencyRepository.create({ city: dto.city, createdBy: callerId });
        const saved = await this.agencyRepository.save(entity);
        saved.users = [];
        return this.toResponse(saved);
    }

    async findAll() {
        const agencies = await this.agencyRepository.find({ relations: ['users'] });
        return agencies.map(a => this.toResponse(a));
    }

    async findOne(id: number) {
        const agency = await this.agencyRepository.findOne({ where: { id }, relations: ['users'] });
        if (!agency) {
            throw new NotFoundException('Agency not found');
        }
        return this.toResponse(agency);
    }

    async addUser(agencyId: number, userId: number) {
        const agency = await this.agencyRepository.findOne({ where: { id: agencyId }, relations: ['users'] });
        if (!agency) {
            throw new NotFoundException('Agency not found');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== UserRoleType.ADMIN_USER_CITY && user.role !== UserRoleType.USER_CITY && user.role !== UserRoleType.TECHNICIAN && user.role !== UserRoleType.ADMIN_TECHNICIAN) {
            throw new BadRequestException('User must have ADMIN_USER_CITY or USER_CITY role');
        }

        user.agencyId = agencyId;
        await this.userRepository.save(user);

        const updated = await this.agencyRepository.findOne({ where: { id: agencyId }, relations: ['users'] });
        if (!updated) throw new NotFoundException('Agency not found');
        return this.toResponse(updated);
    }

    async removeUser(agencyId: number, userId: number) {
        const agency = await this.agencyRepository.findOne({ where: { id: agencyId }, relations: ['users'] });
        if (!agency) throw new NotFoundException('Agency not found');

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await this.userRepository.update(userId, { agencyId: null as any });

        const updated = await this.agencyRepository.findOne({ where: { id: agencyId }, relations: ['users'] });
        if (!updated) throw new NotFoundException('Agency not found');
        return this.toResponse(updated);
    }

    async delete(id: number) {
        const agency = await this.agencyRepository.findOne({ where: { id }, relations: ['users'] });
        if (!agency) throw new NotFoundException('Agency not found');

        if (agency.users?.length) {
            await this.userRepository
                .createQueryBuilder()
                .update()
                .set({ agencyId: null as any })
                .where('agencyId = :id', { id })
                .execute();
        }

        await this.agencyRepository.delete(id);
        return { statusCode: 200, message: 'Agency deleted successfully' };
    }
}
