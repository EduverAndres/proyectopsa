import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Question, QuestionType, QuestionDifficulty } from '../database/entities/question.entity';
import { QuestionOption } from '../database/entities/question-option.entity';
import { Exam } from '../database/entities/exam.entity';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private optionRepository: Repository<QuestionOption>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, teacherId: number): Promise<Question> {
    // Verificar que el examen pertenece al profesor
    const exam = await this.examRepository.findOne({
      where: { id: createQuestionDto.examId, teacherId, isActive: true },
    });

    if (!exam) {
      throw new ForbiddenException('No tienes permisos para agregar preguntas a este examen');
    }

    // Crear la pregunta
    const question = new Question();
    question.examId = createQuestionDto.examId;
    question.questionText = createQuestionDto.questionText;
    question.questionType = createQuestionDto.questionType;
    question.difficulty = createQuestionDto.difficulty;
    question.topic = createQuestionDto.topic || '';
    question.aiGenerated = createQuestionDto.aiGenerated || false;

    const savedQuestion = await this.questionRepository.save(question);

    // Crear las opciones
    for (const optionData of createQuestionDto.options) {
      const option = new QuestionOption();
      option.questionId = savedQuestion.id;
      option.optionText = optionData.optionText;
      option.isCorrect = optionData.isCorrect;
      option.optionOrder = optionData.optionOrder;

      await this.optionRepository.save(option);
    }

    return this.findOne(savedQuestion.id);
  }

  async findByExam(examId: number): Promise<Question[]> {
    // Verificar que el examen existe
    const exam = await this.examRepository.findOne({
      where: { id: examId, isActive: true },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    return this.questionRepository.find({
      where: { examId },
      relations: ['options'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['options', 'exam'],
    });

    if (!question) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    return question;
  }

  async update(id: number, updateData: Partial<Question>, teacherId: number): Promise<Question> {
    const question = await this.findOne(id);

    // Verificar que el examen pertenece al profesor
    const exam = await this.examRepository.findOne({
      where: { id: question.examId, teacherId },
    });

    if (!exam) {
      throw new ForbiddenException('No tienes permisos para modificar esta pregunta');
    }

    await this.questionRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number, teacherId: number): Promise<void> {
    const question = await this.findOne(id);

    // Verificar que el examen pertenece al profesor
    const exam = await this.examRepository.findOne({
      where: { id: question.examId, teacherId },
    });

    if (!exam) {
      throw new ForbiddenException('No tienes permisos para eliminar esta pregunta');
    }

    await this.questionRepository.delete(id);
  }

  // Métodos adicionales útiles

  async findByDifficulty(examId: number, difficulty: QuestionDifficulty): Promise<Question[]> {
    return this.questionRepository.find({
      where: { examId, difficulty },
      relations: ['options'],
      order: { id: 'ASC' },
    });
  }

  async findByType(examId: number, questionType: QuestionType): Promise<Question[]> {
    return this.questionRepository.find({
      where: { examId, questionType },
      relations: ['options'],
      order: { id: 'ASC' },
    });
  }

  async countQuestionsByExam(examId: number): Promise<number> {
    return this.questionRepository.count({
      where: { examId },
    });
  }

  async duplicateQuestion(questionId: number, targetExamId: number, teacherId: number): Promise<Question> {
    // Verificar permisos en el examen destino
    const targetExam = await this.examRepository.findOne({
      where: { id: targetExamId, teacherId, isActive: true },
    });

    if (!targetExam) {
      throw new ForbiddenException('No tienes permisos para agregar preguntas a este examen');
    }

    // Obtener la pregunta original
    const originalQuestion = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['options'],
    });

    if (!originalQuestion) {
      throw new NotFoundException('Pregunta original no encontrada');
    }

    // Crear nueva pregunta
    const newQuestion = new Question();
    newQuestion.examId = targetExamId;
    newQuestion.questionText = originalQuestion.questionText;
    newQuestion.questionType = originalQuestion.questionType;
    newQuestion.difficulty = originalQuestion.difficulty;
    newQuestion.topic = originalQuestion.topic;
    newQuestion.aiGenerated = false; // Marcar como no generada por IA

    const savedQuestion = await this.questionRepository.save(newQuestion);

    // Duplicar opciones
    for (const originalOption of originalQuestion.options) {
      const newOption = new QuestionOption();
      newOption.questionId = savedQuestion.id;
      newOption.optionText = originalOption.optionText;
      newOption.isCorrect = originalOption.isCorrect;
      newOption.optionOrder = originalOption.optionOrder;

      await this.optionRepository.save(newOption);
    }

    return this.findOne(savedQuestion.id);
  }

  async updateQuestionOption(optionId: number, optionText: string, isCorrect: boolean, teacherId: number): Promise<QuestionOption> {
    const option = await this.optionRepository.findOne({
      where: { id: optionId },
      relations: ['question', 'question.exam'],
    });

    if (!option) {
      throw new NotFoundException('Opción no encontrada');
    }

    // Verificar permisos
    if (option.question.exam.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para modificar esta opción');
    }

    option.optionText = optionText;
    option.isCorrect = isCorrect;

    return this.optionRepository.save(option);
  }

  async getQuestionStats(questionId: number, teacherId: number) {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['exam', 'studentAnswers'],
    });

    if (!question) {
      throw new NotFoundException('Pregunta no encontrada');
    }

    // Verificar permisos
    if (question.exam.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para ver estas estadísticas');
    }

    const totalAnswers = question.studentAnswers.length;
    const correctAnswers = question.studentAnswers.filter(answer => answer.isCorrect).length;
    const incorrectAnswers = totalAnswers - correctAnswers;
    const successRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    return {
      questionId: question.id,
      questionText: question.questionText,
      difficulty: question.difficulty,
      totalAnswers,
      correctAnswers,
      incorrectAnswers,
      successRate: Number(successRate.toFixed(2)),
    };
  }
}
