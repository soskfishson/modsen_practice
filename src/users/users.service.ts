import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-user-query.dto';
import { Brackets } from 'typeorm';
import { PaginatedUserResponseDto } from './dto/paginated-user-response.dto';
import { USER_VALID_FIELDS, USER_PUBLIC_FIELDS } from './constants/user-constants';
import { validatePassword } from './utils/user-utils';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.usersRepository.findOne({
            where: [{ email: createUserDto.email }, { username: createUserDto.username }],
        });

        if (existingUser) {
            throw new ConflictException('User with this email or username already exists');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
            registrationDate: new Date(),
        });

        return this.usersRepository.save(user);
    }

    async find(queryDto: FindUsersQueryDto): Promise<PaginatedUserResponseDto> {
        const {
            page = 1,
            limit = 10,
            search,
            sortBy,
            sortOrder,
            fields,
            id,
            ...filters
        } = queryDto;

        const queryBuilder = this.usersRepository.createQueryBuilder('user');

        if (fields) {
            const requestedFields = fields.split(',') as (keyof User)[];
            const selectedFields = requestedFields.filter((field) =>
                USER_VALID_FIELDS.includes(field),
            );
            if (selectedFields.length > 0) {
                queryBuilder.select(selectedFields.map((field) => `user.${field}`));
            }
        } else {
            queryBuilder.select(USER_PUBLIC_FIELDS.map((field) => `user.${field}`));
        }

        if (search) {
            const searchTerm = `%${search}%`;
            queryBuilder.andWhere(
                new Brackets((qb) => {
                    qb.where('user.username ILIKE :searchTerm', { searchTerm })
                        .orWhere('user.email ILIKE :searchTerm', { searchTerm })
                        .orWhere('user.displayName ILIKE :searchTerm', { searchTerm });
                }),
            );
        }

        if (id) {
            queryBuilder.andWhere('user.id = :id', { id });
        }

        Object.keys(filters).forEach((key) => {
            if (USER_VALID_FIELDS.includes(key as keyof User)) {
                const filterValue = filters[key];
                const paramName = `param_${key}`;
                queryBuilder.andWhere(`user.${key} = :${paramName}`, { [paramName]: filterValue });
            }
        });

        if (sortBy && USER_VALID_FIELDS.includes(sortBy as keyof User)) {
            queryBuilder.orderBy(`user.${sortBy}`, sortOrder);
        } else {
            queryBuilder.orderBy('user.createdAt', 'DESC');
        }

        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        const [users, total] = await queryBuilder.getManyAndCount();

        return {
            data: users,
            total,
            page: page!,
            limit: limit!,
            totalPages: Math.ceil(total / limit!),
        };
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { data } = await this.find({ id, limit: 1 });
        if (data.length === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        const user = data[0] as User;

        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const { data: existingUsers } = await this.find({
                username: updateUserDto.username,
                limit: 1,
            });
            if (existingUsers.length > 0) {
                throw new ConflictException('This username is already taken.');
            }
        }

        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const { data } = await this.find({ id, limit: 1 });
        if (data.length === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        await this.usersRepository.remove(data[0] as User);
    }

    async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
        return validatePassword(password, hashedPassword);
    }
}
