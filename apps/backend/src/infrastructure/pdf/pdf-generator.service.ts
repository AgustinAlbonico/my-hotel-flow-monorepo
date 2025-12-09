import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ReceiptData {
  // Datos del emisor (Hotel)
  hotel: {
    name: string;
    cuit: string;
    address: string;
    email: string;
    phone: string;
  };
  // Datos del comprobante
  receipt: {
    type: string; // "B", "C", etc.
    number: string;
    date: string;
    cae?: string;
    caeExpiration?: string;
  };
  // Datos del cliente
  client: {
    name: string;
    dni: string;
    address: string;
    email: string;
    phone: string;
    taxCondition: string;
  };
  // Datos de la reserva/estadía
  reservation: {
    id: number;
    checkIn: string;
    checkOut: string;
    roomNumber: string;
    roomType: string;
  };
  // Detalles de servicios
  items: Array<{
    code: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    subtotal: number;
  }>;
  // Totales
  totals: {
    subtotal: number;
    discount: number;
    iva: number;
    total: number;
  };
  // Pago
  payment: {
    id: number;
    method: string;
    amount: number;
    reference?: string;
    date: string;
  };
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private readonly uploadsPath: string;
  private readonly templatePath: string;

  constructor() {
    // Ruta donde se guardarán los PDFs
    this.uploadsPath = path.join(process.cwd(), 'uploads', 'receipts');
    // Ruta del template HTML
    this.templatePath = path.join(
      process.cwd(),
      'src',
      'infrastructure',
      'pdf',
      'templates',
      'receipt.hbs',
    );
  }

  /**
   * Inicializar directorio de uploads
   */
  async onModuleInit() {
    try {
      await fs.mkdir(this.uploadsPath, { recursive: true });
      this.logger.log(`Directorio de receipts creado: ${this.uploadsPath}`);
    } catch (error) {
      this.logger.error('Error creando directorio de receipts', error);
    }
  }

  /**
   * Generar PDF de comprobante
   */
  async generateReceipt(data: ReceiptData): Promise<string> {
    let browser: puppeteer.Browser | null = null;

    try {
      // 1. Leer template HTML
      const templateHtml = await fs.readFile(this.templatePath, 'utf-8');
      const template = Handlebars.compile(templateHtml);

      // 2. Renderizar template con datos
      const html = template(data);

      // 3. Generar PDF con Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // 4. Guardar PDF
      const fileName = `receipt-${data.payment.id}-${Date.now()}.pdf`;
      const filePath = path.join(this.uploadsPath, fileName);

      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      this.logger.log(`Comprobante PDF generado: ${fileName}`);
      return filePath;
    } catch (error) {
      this.logger.error('Error generando PDF', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Leer PDF generado
   */
  async getReceiptFile(filePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      this.logger.error(`Error leyendo PDF: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * Verificar si existe un archivo de comprobante
   */
  async receiptExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
