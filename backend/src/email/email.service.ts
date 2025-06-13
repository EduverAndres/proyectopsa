import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendExamResults(
    studentEmail: string,
    studentName: string,
    examTitle: string,
    score: number,
    feedback: string,
    resources?: string[]
  ): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER'),
        to: studentEmail,
        subject: `Resultados de tu examen: ${examTitle}`,
        html: this.generateExamResultsTemplate(studentName, examTitle, score, feedback, resources),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de resultados enviado a ${studentEmail}`);
    } catch (error) {
      this.logger.error('Error enviando email de resultados:', error);
      throw error;
    }
  }

  private generateExamResultsTemplate(
    studentName: string,
    examTitle: string,
    score: number,
    feedback: string,
    resources?: string[]
  ): string {
    const resourcesHtml = resources?.length 
      ? `
        <h3>📚 Recursos Recomendados:</h3>
        <ul>
          ${resources.map(resource => `<li>${resource}</li>`).join('')}
        </ul>
      `
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🎓 Resultados de tu Examen</h2>
        
        <p>Hola <strong>${studentName}</strong>,</p>
        
        <p>Has completado el examen: <strong>${examTitle}</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: ${score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'};">
            Tu puntuación: ${score.toFixed(1)}%
          </h3>
        </div>
        
        <h3>💡 Feedback Personalizado:</h3>
        <p style="background-color: #eff6ff; padding: 15px; border-radius: 8px;">
          ${feedback}
        </p>
        
        ${resourcesHtml}
        
        <p style="margin-top: 30px;">
          ¡Sigue así! El aprendizaje es un proceso continuo.
        </p>
        
        <hr style="margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px;">
          Este email fue generado automáticamente por el Sistema de Exámenes Inteligente.
        </p>
      </div>
    `;
  }
}