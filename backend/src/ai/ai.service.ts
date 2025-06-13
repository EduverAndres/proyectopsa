// ===========================================
// src/ai/ai.service.ts (CORREGIDO - Tipos explícitos)
// ===========================================
import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface StudentAnswerForFeedback {
  questionId: number;
  questionText: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

interface FeedbackResponse {
  feedbackText: string;
  improvementAreas: string[];
  strengths: string[];
  recommendedResources: string[];
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY no está configurado. Las funciones de IA no funcionarán.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateQuestions(
    topic: string,
    questionCount: number,
    difficulty: string,
  ): Promise<GeneratedQuestion[]> {
    if (!this.genAI) {
      console.warn('Gemini AI no configurado, usando preguntas de respaldo');
      return this.generateFallbackQuestions(topic, questionCount, difficulty);
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
    Genera exactamente ${questionCount} preguntas de opción múltiple sobre el tema: "${topic}".
    
    Configuración:
    - Dificultad: ${difficulty}
    - Cada pregunta debe tener 4 opciones (A, B, C, D)
    - Solo una opción debe ser correcta
    - Las preguntas deben ser claras y educativas
    - Evita preguntas ambiguas o con trucos
    - Enfócate en conceptos fundamentales del tema
    
    Formato de respuesta (JSON válido):
    [
      {
        "questionText": "Pregunta aquí",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "correctAnswer": 0,
        "difficulty": "easy",
        "topic": "${topic}"
      }
    ]
    
    IMPORTANTE: Responde SOLO con el JSON, sin texto adicional, sin markdown, sin explicaciones.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Limpiar el texto en caso de que tenga markdown
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      
      const questions = JSON.parse(cleanText);
      
      // Validar que se generaron las preguntas correctamente
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No se generaron preguntas válidas');
      }
      
      return questions;
    } catch (error) {
      console.error('Error generando preguntas con IA:', error);
      
      // Fallback: generar preguntas básicas si falla la IA
      return this.generateFallbackQuestions(topic, questionCount, difficulty);
    }
  }

  async generateFeedback(
    studentAnswers: StudentAnswerForFeedback[],
    examTitle: string,
    score: number,
  ): Promise<FeedbackResponse> {
    if (!this.genAI) {
      return this.generateFallbackFeedback(score);
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

    const wrongAnswers = studentAnswers.filter(answer => !answer.isCorrect);
    const correctAnswers = studentAnswers.filter(answer => answer.isCorrect);

    const prompt = `
    Genera un feedback personalizado y constructivo para un estudiante basado en su desempeño en el examen.
    
    Información del examen:
    - Título: ${examTitle}
    - Puntuación: ${score.toFixed(1)}%
    - Respuestas correctas: ${correctAnswers.length}
    - Respuestas incorrectas: ${wrongAnswers.length}
    - Total de preguntas: ${studentAnswers.length}
    
    ${wrongAnswers.length > 0 ? `
    Preguntas incorrectas:
    ${wrongAnswers.map((answer, index) => `${index + 1}. ${answer.questionText}`).join('\n')}
    ` : ''}
    
    Genera un feedback que incluya:
    1. Mensaje motivacional y constructivo (evita ser negativo)
    2. Análisis de fortalezas encontradas
    3. Áreas específicas de mejora
    4. Recomendaciones de estudio concretas
    
    Formato de respuesta (JSON válido):
    {
      "feedbackText": "Mensaje principal de feedback aquí (máximo 200 palabras)...",
      "improvementAreas": ["Área específica 1", "Área específica 2", "Área específica 3"],
      "strengths": ["Fortaleza 1", "Fortaleza 2"],
      "recommendedResources": ["Recurso o actividad 1", "Recurso o actividad 2", "Recurso o actividad 3"]
    }
    
    IMPORTANTE: 
    - Sé empático, motivacional y constructivo
    - Evita lenguaje negativo o desalentador
    - Enfócate en el crecimiento y la mejora continua
    - Personaliza según la puntuación obtenida
    - Responde SOLO con el JSON, sin texto adicional, sin markdown
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const cleanText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      
      const feedback = JSON.parse(cleanText);
      
      // Validar la estructura del feedback
      if (!feedback.feedbackText || !feedback.improvementAreas || !feedback.strengths || !feedback.recommendedResources) {
        throw new Error('Estructura de feedback inválida');
      }
      
      return feedback;
    } catch (error) {
      console.error('Error generando feedback con IA:', error);
      return this.generateFallbackFeedback(score);
    }
  }

  private generateFallbackQuestions(topic: string, count: number, difficulty: string): GeneratedQuestion[] {
    const fallbackQuestions: GeneratedQuestion[] = [];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      fallbackQuestions.push({
        questionText: `Pregunta sobre ${topic} #${i + 1}`,
        options: [
          'Opción A',
          'Opción B (Correcta)',
          'Opción C',
          'Opción D'
        ],
        correctAnswer: 1,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        topic: topic,
      });
    }
    
    return fallbackQuestions;
  }

  private generateFallbackFeedback(score: number): FeedbackResponse {
    let feedbackText = '';
    let improvementAreas: string[] = []; // ✅ Tipo explícito
    let strengths: string[] = [];        // ✅ Tipo explícito
    
    if (score >= 90) {
      feedbackText = '¡Excelente trabajo! Demuestras un dominio sobresaliente del tema. Tu dedicación y comprensión son ejemplares.';
      strengths = ['Dominio excepcional del tema', 'Comprensión profunda de conceptos'];
      improvementAreas = ['Mantener el nivel de excelencia', 'Explorar temas avanzados'];
    } else if (score >= 70) {
      feedbackText = '¡Buen trabajo! Tienes una comprensión sólida del tema. Con un poco más de práctica puedes alcanzar la excelencia.';
      strengths = ['Buena comprensión general', 'Base sólida de conocimientos'];
      improvementAreas = ['Reforzar conceptos específicos', 'Practicar más ejercicios'];
    } else if (score >= 50) {
      feedbackText = 'Tienes una base de conocimiento que puedes desarrollar. Con más estudio y práctica, definitivamente mejorarás tus resultados.';
      strengths = ['Conocimientos básicos presentes', 'Potencial de mejora'];
      improvementAreas = ['Revisar conceptos fundamentales', 'Aumentar tiempo de estudio', 'Buscar ayuda adicional'];
    } else {
      feedbackText = 'Este es un punto de partida para tu aprendizaje. Te recomiendo revisar el material y no hesitar en buscar ayuda. ¡El esfuerzo constante trae resultados!';
      strengths = ['Participación en el examen', 'Oportunidad de crecimiento'];
      improvementAreas = ['Repaso completo del tema', 'Estudio con material adicional', 'Consultar con el profesor'];
    }
    
    return {
      feedbackText,
      improvementAreas,
      strengths,
      recommendedResources: [
        'Material de estudio adicional',
        'Ejercicios de práctica',
        'Consulta con el profesor',
        'Grupos de estudio'
      ],
    };
  }
}

// ===========================================
// ALTERNATIVA: Si prefieres inicializar con valores por defecto
// ===========================================
/*
También puedes solucionarlo inicializando los arrays con valores por defecto:

private generateFallbackFeedback(score: number): FeedbackResponse {
  let feedbackText = '';
  let improvementAreas = ['Revisar conceptos básicos']; // Valor inicial
  let strengths = ['Participación activa'];             // Valor inicial
  
  if (score >= 90) {
    feedbackText = '¡Excelente trabajo! Demuestras un dominio sobresaliente del tema.';
    strengths = ['Dominio excepcional del tema', 'Comprensión profunda de conceptos'];
    improvementAreas = ['Mantener el nivel de excelencia', 'Explorar temas avanzados'];
  }
  // ... resto del código
}
*/