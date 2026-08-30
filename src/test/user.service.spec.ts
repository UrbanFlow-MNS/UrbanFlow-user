import { NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { vi } from 'vitest';
import { UserConstants } from '../core/constants';
import { UserEntity } from '../database/entities/user.entity';
import { LogsService } from '../services/log.service';
import { UserService } from '../services/user.service';

vi.mock('argon2', () => ({
    hash: vi.fn().mockResolvedValue('hashed_password'),
    verify: vi.fn(),
    argon2id: 2,
}));

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<UserEntity>;
    let logsService: LogsService;

    const mockUserEntity = {
        id: 1,
        email: 'theo@example.com',
        password: 'hashed_password',
        toDto: vi.fn().mockReturnValue({ id: 1, email: 'theo@example.com' }),
    };

    const mockRepository = {
        findOneBy: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    };

    const mockAgencyRepository = {
        findOneBy: vi.fn(),
    };

    const mockLogsService = {
        sendEvent: vi.fn(),
        sendUserNotFound: vi.fn(),
        sendDeleteUser: vi.fn(),
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: LogsService, useValue: mockLogsService },
                { provide: UserConstants.USER_REPOSITORY, useValue: mockRepository },
                { provide: 'AGENCY_REPOSITORY', useValue: mockAgencyRepository },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        repository = module.get<Repository<UserEntity>>(UserConstants.USER_REPOSITORY);
        logsService = module.get<LogsService>(LogsService);
    });

    describe('create', () => {
        it('should throw RpcException if email already exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockUserEntity);

            await expect(service.create({ email: 'theo@example.com', password: 'password123' } as any))
                .rejects
                .toThrow(RpcException);
            expect(repository.save).not.toHaveBeenCalled();
        });

        it('should throw RpcException if the agency does not exist', async () => {
            mockAgencyRepository.findOneBy.mockResolvedValue(null);

            await expect(service.create({ email: 'new@example.com', password: 'password123', agencyId: 42 } as any))
                .rejects
                .toThrow(RpcException);
            expect(repository.findOne).not.toHaveBeenCalled();
        });

        it('should save user successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockUserEntity);
            mockRepository.save.mockResolvedValue(mockUserEntity);

            const result = await service.create({ email: 'new@example.com', password: 'password123' } as any);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({ password: 'hashed_password' }),
            );
            expect(repository.save).toHaveBeenCalled();
            expect(result.email).toEqual('theo@example.com');
        });
    });

    describe('delete', () => {
        it('should delete user and log the deletion', async () => {
            mockRepository.findOne.mockResolvedValue(mockUserEntity);

            const result = await service.delete(1);

            expect(repository.delete).toHaveBeenCalledWith(1);
            expect(logsService.sendDeleteUser).toHaveBeenCalledWith('theo@example.com');
            expect(result.statusCode).toBe(200);
        });

        it('should throw NotFoundException and log if user does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.delete(99)).rejects.toThrow(NotFoundException);

            expect(repository.delete).not.toHaveBeenCalled();
            expect(logsService.sendUserNotFound).toHaveBeenCalledWith();
        });
    });
});
