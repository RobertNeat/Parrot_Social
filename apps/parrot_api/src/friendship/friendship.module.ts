import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller.js';
import { FriendshipRepository } from './friendship.repository.js';

@Module({
  controllers: [FriendshipController],
  providers: [FriendshipRepository],
  exports: [FriendshipRepository],
})
export class FriendshipModule {}
