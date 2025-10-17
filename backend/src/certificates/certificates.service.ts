// src/certificates/certificates.service.ts
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificatesService {
  private certificatesDir = path.join(__dirname, '../../certificates');

  constructor() {
    // Create certificates folder if it doesn't exist
    if (!fs.existsSync(this.certificatesDir)) {
      fs.mkdirSync(this.certificatesDir);
    }
  }

  async generateCertificate(studentName: string, courseTitle: string, studentId: number, courseId: number): Promise<string> {
    const fileName = `${studentId}-${courseId}.pdf`;
    const filePath = path.join(this.certificatesDir, fileName);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });

    doc.pipe(fs.createWriteStream(filePath));

    // Certificate title
    doc.fontSize(36).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);

    // Student name
    doc.fontSize(24).text(`This certifies that`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(32).text(studentName, { align: 'center', underline: true });
    doc.moveDown();

    // Course name
    doc.fontSize(24).text(`has successfully completed the course`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(28).text(courseTitle, { align: 'center', underline: true });
    doc.moveDown(2);

    // Date
    const date = new Date().toLocaleDateString();
    doc.fontSize(20).text(`Date: ${date}`, { align: 'center' });

    doc.end();

    return `/certificates/${fileName}`;
  }
}
