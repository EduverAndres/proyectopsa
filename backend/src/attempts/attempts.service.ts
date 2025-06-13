import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExamAttempt } from '../database/entities/exam-attempt.entity';
import { StudentAnswer } from '../database/entities/student-answer.entity';
import { AiFeedback } from '../database/entities/ai-feedback.entity';
import { Exam } from '../database/entities/exam.entity';
import { Question } from '../database/entities/question.entity';
import { QuestionOption } from '../database/entities/question-option.entity';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinishAttemptDto } from './dto/finish-attempt.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(ExamAttempt)
    private attemptRepository: Repository<ExamAttempt>,
    @InjectRepository(StudentAnswer)
    private answerRepository: Repository<StudentAnswer>,
    @InjectRepository(AiFeedback)
    private feedbackRepository: Repository<AiFeedback>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private optionRepository: Repository<QuestionOption>,
    private aiService: AiService,
  ) {}

  async startAttempt(examId: number, studentId: number): Promise<ExamAttempt> {
    // Verificar que el examen existe y está publicado
    const exam = await this.examRepository.findOne({
      where: { id: examId, isPublished: true, isActive: true },
      relations: ['questions'],
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado o no está disponible');
    }

    // Contar intentos previos del estudiante para este examen
    const previousAttempts = await this.attemptRepository.count({
      where: { examId, studentId },
    });

    // Crear nuevo intento
    const attempt = this.attemptRepository.create({
      examId,
      studentId,
      totalQuestions: exam.totalQuestions,
      attemptNumber: previousAttempts + 1,
      startTime: new Date(),
    });

    return this.attemptRepository.save(attempt);
  }

  async submitAnswer(attemptId: number, submitAnswerDto: SubmitAnswerDto, studentId: number): Promise<StudentAnswer> {
    // Verificar que el intento pertenece al estudiante y está activo
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, studentId, isCompleted: false },
    });

    if (!attempt) {
      throw new NotFoundException('Intento no encontrado o ya está completado');
    }

    // Verificar que la pregunta pertenece al examen
    const question = await this.questionRepository.findOne({
      where: { id: submitAnswerDto.questionId, examId: attempt.examId },
      relations: ['options'],
    });

    if (!question) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    // Verificar si ya existe una respuesta para esta pregunta en este intento
    const existingAnswer = await this.answerRepository.findOne({
      where: { attemptId, questionId: submitAnswerDto.questionId },
    });

    let isCorrect = false;

    // Determinar si la respuesta es correcta
    if (submitAnswerDto.selectedOptionId) {
      const selectedOption = await this.optionRepository.findOne({
        where: { id: submitAnswerDto.selectedOptionId, questionId: question.id },
      });

      if (!selectedOption) {
        throw new BadRequestException('Opción seleccionada no válida');
      }

      isCorrect = selectedOption.isCorrect;
    }

    if (existingAnswer) {
      // Actualizar respuesta existente
      existingAnswer.selectedOptionId = submitAnswerDto.selectedOptionId || null;
      existingAnswer.answerText = submitAnswerDto.answerText || null;
      existingAnswer.isCorrect = isCorrect;
      existingAnswer.timeSpentSeconds = submitAnswerDto.timeSpentSeconds || 0;

      return this.answerRepository.save(existingAnswer);
    } else {
      // Crear nueva respuesta usando las claves foráneas directamente
      const answerData = {
        attemptId: attemptId,
        questionId: submitAnswerDto.questionId,
        selectedOptionId: submitAnswerDto.selectedOptionId || null,
        answerText: submitAnswerDto.answerText || null,
        isCorrect,
        timeSpentSeconds: submitAnswerDto.timeSpentSeconds || 0,
      };

      const answer = this.answerRepository.create(answerData);
      return this.answerRepository.save(answer);
    }
  }

  async finishAttempt(attemptId: number, finishAttemptDto: FinishAttemptDto, studentId: number): Promise<ExamAttempt> {
    // Verificar que el intento pertenece al estudiante
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, studentId },
      relations: ['exam', 'answers', 'answers.question'],
    });

    if (!attempt) {
      throw new NotFoundException('Intento no encontrado');
    }

    if (attempt.isCompleted) {
      throw new BadRequestException('El intento ya está completado');
    }

    // Calcular resultados
    const totalQuestions = attempt.totalQuestions || 0;
    const correctAnswers = attempt.answers.filter(answer => answer.isCorrect).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Actualizar intento
    attempt.endTime = new Date();
    attempt.isCompleted = true;
    attempt.correctAnswers = correctAnswers;
    attempt.score = Number(score.toFixed(2));
    attempt.timeSpentMinutes = finishAttemptDto.totalTimeSpentMinutes || 
      Math.round((attempt.endTime.getTime() - attempt.startTime.getTime()) / (1000 * 60));

    const completedAttempt = await this.attemptRepository.save(attempt);

    // Generar feedback con IA de forma asíncrona
    this.generateAIFeedback(completedAttempt).catch(error => {
      console.error('Error en generateAIFeedback:', error);
    });

    return completedAttempt;
  }

  private async generateAIFeedback(attempt: ExamAttempt): Promise<void> {
    try {
      if (!attempt.answers || attempt.answers.length === 0) {
        console.warn('No hay respuestas para generar feedback');
        return;
      }

      const studentAnswers = attempt.answers.map(answer => ({
        questionId: answer.questionId,
        questionText: answer.question?.questionText || 'Pregunta sin texto',
        isCorrect: answer.isCorrect || false,
        timeSpentSeconds: answer.timeSpentSeconds || 0,
      }));

      const feedback = await this.aiService.generateFeedback(
        studentAnswers,
        attempt.exam?.title || 'Examen sin título',
        attempt.score || 0,
      );

      const aiFeedback = this.feedbackRepository.create({
        attemptId: attempt.id,
        studentId: attempt.studentId,
        feedbackText: feedback.feedbackText,
        improvementAreas: feedback.improvementAreas,
        strengths: feedback.strengths,
        recommendedResources: feedback.recommendedResources,
      });

      await this.feedbackRepository.save(aiFeedback);
    } catch (error) {
      console.error('Error generando feedback con IA:', error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  async getAttemptResults(attemptId: number, studentId: number) {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId, studentId },
      relations: [
        'exam', 
        'answers', 
        'answers.question', 
        'answers.selectedOption',
        'aiFeedback'
      ],
    });

    if (!attempt) {
      throw new NotFoundException('Intento no encontrado');
    }

    return {
      attempt,
      questions: attempt.answers.map(answer => ({
        question: answer.question,
        studentAnswer: {
          selectedOption: answer.selectedOption,
          answerText: answer.answerText,
          isCorrect: answer.isCorrect,
          timeSpentSeconds: answer.timeSpentSeconds,
        },
      })),
      feedback: attempt.aiFeedback?.[0] || null,
    };
  }

  async getStudentAttempts(studentId: number): Promise<ExamAttempt[]> {
    return this.attemptRepository.find({
      where: { studentId },
      relations: ['exam', 'aiFeedback'],
      order: { startTime: 'DESC' },
    });
  }

  async getAttemptsByExam(examId: number, teacherId: number): Promise<ExamAttempt[]> {
    // Verificar que el examen pertenece al profesor
    const exam = await this.examRepository.findOne({
      where: { id: examId, teacherId },
    });

    if (!exam) {
      throw new ForbiddenException('No tienes permisos para ver estos resultados');
    }

    return this.attemptRepository.find({
      where: { examId },
      relations: ['student', 'answers', 'answers.question', 'aiFeedback'],
      order: { startTime: 'DESC' },
    });
  }

  async getAttempt(attemptId: number): Promise<ExamAttempt> {
    const attempt = await this.attemptRepository.findOne({
      where: { id: attemptId },
      relations: ['exam', 'student', 'answers', 'answers.question', 'answers.selectedOption', 'aiFeedback'],
    });

    if (!attempt) {
      throw new NotFoundException('Intento no encontrado');
    }

    return attempt;
  }
}