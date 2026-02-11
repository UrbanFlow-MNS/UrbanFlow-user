import { LogEventType } from '@bato-urbanflow/urbanflow-models';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { LogsService } from '../services/log.service';
import { UserService } from '../services/user.service';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<UserEntity>;
    let logsService: LogsService;

    const mockUserEntity = {
        id: 1,
        email: 'theo@example.com',
        password: 'hashed_password',
        toDto: jest.fn().mockReturnValue({ id: 1, email: 'theo@example.com' }),
    };

    const mockRepository = {
        findOneBy: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockLogsService = {
        sendEvent: jest.fn(),
        sendUserNotFound: jest.fn(),
        sendDeleteUser: jest.fn()
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: LogsService, useValue: mockLogsService },
                { provide: getRepositoryToken(UserEntity), useValue: mockRepository },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
        logsService = module.get<LogsService>(LogsService);
    });

    describe('create', () => {
        it('should throw BadRequestException if email already exists', async () => {
            mockRepository.findOne.mockResolvedValue(mockUserEntity);
            const signUpDto = { email: 'theo@example.com', password: 'password123' } as any;

            await expect(service.create(signUpDto)).rejects.toThrow(BadRequestException);
        });

        it('should save user successfully', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(mockUserEntity);
            mockRepository.save.mockResolvedValue(mockUserEntity);

            const result = await service.create({ email: 'new@example.com', password: 'password123' } as any);

            expect(repository.save).toHaveBeenCalled();
            expect(result.email).toEqual('theo@example.com');
        });
    });

    describe('delete', () => {
        it('should delete user and log success event', async () => {
            mockRepository.findOne.mockResolvedValue(mockUserEntity);

            const result = await service.delete(1);

            expect(repository.delete).toHaveBeenCalledWith(1);
            expect(logsService.sendEvent).toHaveBeenCalledWith(
                LogEventType.LOGS_CREATE,
                expect.objectContaining({ message: expect.stringContaining('deleted') })
            );
            expect(result.statusCode).toBe(200);
        });

        it('should throw NotFoundException and log error if user does not exist', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.delete(99))
                .rejects
                .toThrow(NotFoundException);
            
            expect(logsService.sendUserNotFound)
                .toHaveBeenCalledWith(
                    LogEventType.LOGS_CREATE,
                    expect.objectContaining({ status: "404" })
                );
        });
    });
});