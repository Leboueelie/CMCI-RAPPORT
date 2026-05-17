import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TerritoiresModule } from './modules/territoires/territoires.module';
import { AssembleesModule } from './modules/assemblees/assemblees.module';
import { MembresModule } from './modules/membres/membres.module';
import { RapportsModule } from './modules/rapports/rapports.module';
import { ValidationsModule } from './modules/validations/validations.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { FonctionsModule } from './modules/fonctions/fonctions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TerritoiresModule,
    AssembleesModule,
    MembresModule,
    FonctionsModule,
    RapportsModule,
    ValidationsModule,
    DashboardModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
