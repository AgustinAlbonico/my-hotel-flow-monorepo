import { Module, OnModuleInit } from '@nestjs/common';
import { PdfGeneratorService } from './pdf-generator.service';

@Module({
  providers: [PdfGeneratorService],
  exports: [PdfGeneratorService],
})
export class PdfModule implements OnModuleInit {
  constructor(private readonly pdfGeneratorService: PdfGeneratorService) {}

  async onModuleInit() {
    await this.pdfGeneratorService.onModuleInit();
  }
}
