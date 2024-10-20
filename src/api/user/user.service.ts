import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async findById(id: string) {
    try {
      const response = await this.repository.findOneBy({ id });

      if (!response) {
        throw new NotFoundException('User not found');
      }

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        created_at: response.created_at,
        updated_at: response.updated_at,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
