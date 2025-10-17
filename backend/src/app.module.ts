// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { StudentsModule } from './students/students.module';
import { CertificatesService } from './certificates/certificates.service';

// 👇 import mailer
// import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { InstructorModule } from './instructor/instructor.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    AnalyticsModule,
    StudentsModule,
    InstructorModule,

    // ✅ Mailer module setup
    // MailerModule.forRoot({
    //   transport: {
    //     host: process.env.SMTP_HOST,
    //     port: parseInt(process.env.SMTP_PORT || '587'),
    //     secure: false, // true for 465, false for 587
    //     auth: {
    //       user: process.env.SMTP_USER,
    //       pass: process.env.SMTP_PASS,
    //     },
    //   },
    //   defaults: {
    //     from: '"No Reply" <no-reply@yourapp.com>',
    //   },
    //   template: {
    //     dir: process.cwd() + '/templates/',
    //     adapter: new HandlebarsAdapter(), // or PugAdapter, EjsAdapter
    //     options: {
    //       strict: true,
    //     },
    //   },
    // }),
  ],
  controllers: [AppController,],
  providers: [AppService, CertificatesService],
})
export class AppModule {}
