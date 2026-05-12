import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import { ScheduleModule } from './modules/schedule/schedule.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { PollsModule } from './modules/polls/polls.module';
// import { GroupModule } from './modules/group/group.module';
import { UserModule } from './modules/user/user.module';
// import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseConfig } from './configs/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
      inject: [DatabaseConfig],
    }),
    // ScheduleModule,
    ChecklistModule,
    // GroupModule,
    UserModule,
    // AuthModule,
    // require('./modules/rooms/rooms.module').RoomsModule,
    PollsModule,
    // require('./modules/ai/ai.module').AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
