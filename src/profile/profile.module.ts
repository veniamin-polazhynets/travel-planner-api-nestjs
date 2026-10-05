import { Module } from '@nestjs/common';
import { HashModule } from '../common/hash/hash.module';
import { UsersModule } from '../users/users.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [UsersModule, HashModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
