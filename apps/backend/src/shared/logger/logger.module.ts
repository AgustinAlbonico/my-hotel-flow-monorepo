import { Module, Global, DynamicModule } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({})
export class LoggerModule {
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: LoggerService,
          useFactory: () => {
            return new LoggerService();
          },
        },
      ],
      exports: [LoggerService],
    };
  }
}
