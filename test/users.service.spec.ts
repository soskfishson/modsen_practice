import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../src/users/users.service';
import { User } from '../src/users/entities/user.entity';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { FindUsersQueryDto } from '../src/users/dto/find-user-query.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

describe('UsersService', () => {
    let service: UsersService;
    let usersRepository: Repository<User>;
    let cloudinaryService: CloudinaryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useClass: Repository,
                },
                {
                    provide: CloudinaryService,
                    useValue: {
                        uploadImage: jest.fn(),
                        deleteImageByUrl: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
        cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const createUserDto: CreateUserDto = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                displayName: 'Test User',
                userDescription: 'A test user',
                profilePicture: 'base64encodedstring',
            };
            const mockUploadResult = { secure_url: 'http://mock-url.com/image.jpg' };
            jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
            jest.spyOn(cloudinaryService, 'uploadImage').mockResolvedValue(mockUploadResult);
            jest.spyOn(usersRepository, 'create').mockReturnValue({
                ...createUserDto,
                password: 'hashedPassword',
                registrationDate: new Date(),
            } as User);
            jest.spyOn(usersRepository, 'save').mockResolvedValue({
                id: '1',
                ...createUserDto,
                password: 'hashedPassword',
                registrationDate: new Date(),
            } as User);

            const result = await service.create(createUserDto);
            expect(cloudinaryService.uploadImage).toHaveBeenCalled();
            expect(usersRepository.findOne).toHaveBeenCalledWith({
                where: [{ email: createUserDto.email }, { username: createUserDto.username }],
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
            expect(usersRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...createUserDto,
                    password: 'hashedPassword',
                    profilePictureUrl: mockUploadResult.secure_url,
                }),
            );
            expect(usersRepository.save).toHaveBeenCalled();
            expect(result).toHaveProperty('id');
            expect(result.email).toEqual(createUserDto.email);
        });

        it('should throw ConflictException if user with email or username already exists', async () => {
            const createUserDto: CreateUserDto = {
                email: 'existing@example.com',
                username: 'existinguser',
                password: 'password123',
                displayName: 'Existing User',
                userDescription: 'An existing user',
            };

            jest.spyOn(usersRepository, 'findOne').mockResolvedValue({ id: '1' } as User);

            await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('find', () => {
        it('should return paginated users', async () => {
            const mockUsers = [
                {
                    id: '1',
                    email: 'test1@example.com',
                    username: 'user1',
                    displayName: 'User One',
                    userDescription: 'Desc1',
                    isActive: true,
                    registrationDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: '2',
                    email: 'test2@example.com',
                    username: 'user2',
                    displayName: 'User Two',
                    userDescription: 'Desc2',
                    isActive: true,
                    registrationDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ] as User[];
            const queryDto: FindUsersQueryDto = { page: 1, limit: 10, search: 'user' };

            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn().mockResolvedValue([mockUsers, mockUsers.length]),
            };
            jest.spyOn(usersRepository, 'createQueryBuilder').mockReturnValue(
                mockQueryBuilder as unknown as SelectQueryBuilder<User>,
            );

            const result = await service.find(queryDto);
            expect(usersRepository.createQueryBuilder).toHaveBeenCalledWith('user');
            expect(mockQueryBuilder.select).toHaveBeenCalled();
            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('user.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.data).toEqual(mockUsers);
            expect(result.total).toEqual(mockUsers.length);
            expect(result.page).toEqual(1);
            expect(result.limit).toEqual(10);
            expect(result.totalPages).toEqual(1);
        });
    });

    describe('update', () => {
        it('should update an existing user', async () => {
            const userId = '1';
            const updateUserDto: UpdateUserDto = { displayName: 'Updated Name' };
            const existingUser = {
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Old Name',
                userDescription: 'Desc',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            } as User;

            jest.spyOn(service, 'find').mockResolvedValueOnce({
                data: [existingUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });
            jest.spyOn(usersRepository, 'save').mockResolvedValue({
                ...existingUser,
                ...updateUserDto,
            } as User);

            const result = await service.update(userId, updateUserDto);
            expect(service.find).toHaveBeenCalledWith({ id: userId, limit: 1 });
            expect(usersRepository.save).toHaveBeenCalledWith(
                expect.objectContaining(updateUserDto),
            );
            expect(result.displayName).toEqual(updateUserDto.displayName);
        });

        it('should throw NotFoundException if user not found', async () => {
            const userId = 'nonexistent';
            const updateUserDto: UpdateUserDto = { displayName: 'Updated Name' };

            jest.spyOn(service, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            });

            await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if username is already taken', async () => {
            const userId = '1';
            const updateUserDto: UpdateUserDto = { username: 'existinguser' };
            const existingUser = {
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'Old Name',
                userDescription: 'Desc',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            } as User;
            const anotherUser = {
                id: '2',
                email: 'another@example.com',
                username: 'existinguser',
                displayName: 'Another User',
                userDescription: 'Desc',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            } as User;

            jest.spyOn(service, 'find')
                .mockResolvedValueOnce({
                    data: [existingUser],
                    total: 1,
                    page: 1,
                    limit: 1,
                    totalPages: 1,
                })
                .mockResolvedValueOnce({
                    data: [anotherUser],
                    total: 1,
                    page: 1,
                    limit: 1,
                    totalPages: 1,
                });

            await expect(service.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('remove', () => {
        it('should remove a user', async () => {
            const userId = '1';
            const existingUser = {
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                displayName: 'User',
                userDescription: 'Desc',
                isActive: true,
                registrationDate: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            } as User;

            jest.spyOn(service, 'find').mockResolvedValueOnce({
                data: [existingUser],
                total: 1,
                page: 1,
                limit: 1,
                totalPages: 1,
            });
            jest.spyOn(usersRepository, 'remove').mockResolvedValue(existingUser);

            await service.remove(userId);
            expect(service.find).toHaveBeenCalledWith({ id: userId, limit: 1 });
            expect(usersRepository.remove).toHaveBeenCalledWith(existingUser);
        });

        it('should throw NotFoundException if user not found', async () => {
            const userId = 'nonexistent';
            jest.spyOn(service, 'find').mockResolvedValueOnce({
                data: [],
                total: 0,
                page: 1,
                limit: 1,
                totalPages: 0,
            });

            await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('validatePassword', () => {
        it('should return true for valid password', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
            const result = await service.validatePassword('password123', 'hashedPassword');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
            expect(result).toBe(true);
        });

        it('should return false for invalid password', async () => {
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
            const result = await service.validatePassword('wrongpassword', 'hashedPassword');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
            expect(result).toBe(false);
        });
    });
});
