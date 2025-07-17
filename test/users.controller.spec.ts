import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { User } from '../src/users/entities/user.entity';
import { FindUsersQueryDto } from '../src/users/dto/find-user-query.dto';
import { PaginatedUserResponseDto } from '../src/users/dto/paginated-user-response.dto';
import { ForbiddenException } from '@nestjs/common';

describe('UsersController', () => {
    let controller: UsersController;
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {
                        create: jest.fn(),
                        find: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('find', () => {
        it('should find users with pagination and filtering', async () => {
            const queryDto: FindUsersQueryDto = { page: 1, limit: 10 };
            const mockPaginatedResponse: PaginatedUserResponseDto = {
                data: [
                    {
                        id: '1',
                        email: 'test1@example.com',
                        username: 'user1',
                        displayName: 'User One',
                        userDescription: 'Desc1',
                        isActive: true,
                        registrationDate: new Date(),
                        profilePictureUrl: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };
            jest.spyOn(service, 'find').mockResolvedValue(mockPaginatedResponse);

            expect(await controller.find(queryDto)).toEqual(mockPaginatedResponse);
            expect(service.find).toHaveBeenCalledWith(queryDto);
        });
    });

    describe('update', () => {
        it('should update a user if current user is the owner', async () => {
            const userId = '1';
            const updateUserDto: UpdateUserDto = { displayName: 'Updated Name' };
            const currentUser = { id: userId } as User;
            const updatedUser = { id: userId, displayName: 'Updated Name' } as User;

            jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

            expect(await controller.update(userId, updateUserDto, currentUser.id)).toEqual(
                updatedUser,
            );
            expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
        });

        it('should throw ForbiddenException if current user is not the owner', async () => {
            const userId = '1';
            const updateUserDto: UpdateUserDto = { displayName: 'Updated Name' };
            const currentUser = { id: '2' } as User;

            await expect(controller.update(userId, updateUserDto, currentUser.id)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('remove', () => {
        it('should remove a user if current user is the owner', async () => {
            const userId = '1';
            const currentUser = { id: userId } as User;

            jest.spyOn(service, 'remove').mockResolvedValue(undefined);

            await controller.remove(userId, currentUser.id);
            expect(service.remove).toHaveBeenCalledWith(userId);
        });

        it('should throw ForbiddenException if current user is not the owner', async () => {
            const userId = '1';
            const currentUser = { id: '2' } as User;

            await expect(controller.remove(userId, currentUser.id)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });
});
