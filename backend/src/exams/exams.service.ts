// ===========================================
// src/exams/exams.service.ts (CORREGIDO - Manejo de tipos nullable)
// ===========================================
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Exam } from '../database/entities/exam.entity';
import { Question, QuestionType, QuestionDifficulty } from '../database/entities/question.entity';
import { QuestionOption } from '../database/entities/question-option.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private optionRepository: Repository<QuestionOption>,
    private aiService: AiService,
  ) {}

  async create(createExamDto: CreateExamDto, teacherId: number): Promise<Exam> {
    const exam = this.examRepository.create({
      ...createExamDto,
      teacherId,
    });

    return this.examRepository.save(exam);
  }

  async generateWithAI(generateExamDto: GenerateExamDto, teacherId: number): Promise<Exam> {
    // Crear el examen primero
    const exam = this.examRepository.create({
      ...generateExamDto,
      teacherId,
    });

    const savedExam = await this.examRepository.save(exam);

    try {
      // Generar preguntas con IA
      const generatedQuestions = await this.aiService.generateQuestions(
        generateExamDto.subjectName,
        generateExamDto.totalQuestions,
        generateExamDto.difficultyLevel,
      );

      // Guardar las preguntas generadas
      for (let i = 0; i < generatedQuestions.length; i++) {
        const questionData = generatedQuestions[i];
        
        // ✅ Crear pregunta usando new en lugar de create()
        const question = new Question();
        question.examId = savedExam.id;
        question.questionText = questionData.questionText;
        question.questionType = QuestionType.MULTIPLE_CHOICE;
        question.difficulty = this.mapDifficultyToEnum(questionData.difficulty);
        question.topic = questionData.topic || ''; // ✅ Manejar undefined
        question.aiGenerated = true;

        const savedQuestion = await this.questionRepository.save(question);

        // Guardar las opciones
        for (let j = 0; j < questionData.options.length; j++) {
          const option = new QuestionOption();
          option.questionId = savedQuestion.id;
          option.optionText = questionData.options[j];
          option.isCorrect = j === questionData.correctAnswer;
          option.optionOrder = j + 1;

          await this.optionRepository.save(option);
        }
      }

      return this.findOne(savedExam.id);
    } catch (error) {
      // Si hay error con la IA, eliminar el examen creado
      await this.examRepository.delete(savedExam.id);
      throw error;
    }
  }

  // ✅ Método helper para mapear dificultad
  private mapDifficultyToEnum(difficulty: string): QuestionDifficulty {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return QuestionDifficulty.EASY;
      case 'medium':
        return QuestionDifficulty.MEDIUM;
      case 'hard':
        return QuestionDifficulty.HARD;
      default:
        return QuestionDifficulty.MEDIUM; // Por defecto
    }
  }

  async findAll(): Promise<Exam[]> {
    return this.examRepository.find({
      where: { isActive: true },
      relations: ['teacher', 'questions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByTeacher(teacherId: number): Promise<Exam[]> {
    return this.examRepository.find({
      where: { teacherId, isActive: true },
      relations: ['questions', 'attempts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublished(): Promise<Exam[]> {
    return this.examRepository.find({
      where: { isPublished: true, isActive: true },
      relations: ['teacher'],
      select: {
        id: true,
        title: true,
        description: true,
        subjectName: true,
        durationMinutes: true,
        totalQuestions: true,
        difficultyLevel: true,
        createdAt: true,
        teacher: {
          id: true,
          name: true,
        }
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id, isActive: true },
      relations: ['teacher', 'questions', 'questions.options'],
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    return exam;
  }

  async findOneWithQuestions(id: number): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id, isActive: true, isPublished: true },
      relations: ['questions', 'questions.options'],
      select: {
        id: true,
        title: true,
        description: true,
        subjectName: true,
        durationMinutes: true,
        totalQuestions: true,
        difficultyLevel: true,
        questions: {
          id: true,
          questionText: true,
          questionType: true,
          difficulty: true,
          topic: true,
          options: {
            id: true,
            optionText: true,
            optionOrder: true,
            // Nota: NO incluir isCorrect para estudiantes
          }
        }
      },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado o no está publicado');
    }

    return exam;
  }

  async publish(id: number, teacherId: number): Promise<Exam> {
    const exam = await this.findOne(id);

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para modificar este examen');
    }

    exam.isPublished = true;
    return this.examRepository.save(exam);
  }

  async remove(id: number, teacherId: number): Promise<void> {
    const exam = await this.findOne(id);

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para eliminar este examen');
    }

    await this.examRepository.update(id, { isActive: false });
  }

  // ✅ Método adicional para crear preguntas manualmente (con manejo de nullable)
  async addQuestionToExam(examId: number, questionData: {
    questionText: string;
    questionType: QuestionType;
    difficulty: QuestionDifficulty;
    topic?: string;
    options: Array<{ optionText: string; isCorrect: boolean }>;
  }, teacherId: number): Promise<Question> {
    // Verificar que el examen pertenece al profesor
    const exam = await this.examRepository.findOne({
      where: { id: examId, teacherId, isActive: true },
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado o no tienes permisos');
    }

    // Crear la pregunta
    const question = new Question();
    question.examId = examId;
    question.questionText = questionData.questionText;
    question.questionType = questionData.questionType;
    question.difficulty = questionData.difficulty;
    question.topic = questionData.topic || ''; // ✅ Manejar undefined
    question.aiGenerated = false;

    const savedQuestion = await this.questionRepository.save(question);

    // Crear las opciones
    for (let i = 0; i < questionData.options.length; i++) {
      const optionData = questionData.options[i];
      const option = new QuestionOption();
      option.questionId = savedQuestion.id;
      option.optionText = optionData.optionText;
      option.isCorrect = optionData.isCorrect;
      option.optionOrder = i + 1;

      await this.optionRepository.save(option);
    }

    // ✅ Retornar la pregunta con sus opciones (manejo de null)
    const questionWithOptions = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: ['options'],
    });

    if (!questionWithOptions) {
      throw new NotFoundException('Error al crear la pregunta');
    }

    return questionWithOptions;
  }

  // ✅ Método para obtener estadísticas del examen
  async getExamStats(examId: number, teacherId: number) {
    const exam = await this.examRepository.findOne({
      where: { id: examId, teacherId, isActive: true },
      relations: ['attempts', 'questions'],
    });

    if (!exam) {
      throw new NotFoundException('Examen no encontrado o no tienes permisos');
    }

    const completedAttempts = exam.attempts?.filter(attempt => attempt.isCompleted) || [];
    const avgScore = completedAttempts.length > 0 
      ? completedAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts.length
      : 0;

    return {
      examId: exam.id,
      title: exam.title,
      totalQuestions: exam.totalQuestions,
      totalAttempts: exam.attempts?.length || 0,
      completedAttempts: completedAttempts.length,
      avgScore: Number(avgScore.toFixed(2)),
      isPublished: exam.isPublished,
      createdAt: exam.createdAt,
    };
  }
}

// ===========================================
// src/database/entities/question.entity.ts (VERIFICAR TIPOS)
// ===========================================
/*
Asegúrate de que tu entidad Question tenga:

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  @Column({
    name: 'question_type',
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  questionType: QuestionType;

  @Column({
    type: 'enum',
    enum: QuestionDifficulty,
  })
  difficulty: QuestionDifficulty;

  @Column({ length: 255, nullable: true })
  topic: string | null; // ✅ Permitir null

  @Column({ name: 'ai_generated', default: true })
  aiGenerated: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Exam, exam => exam.questions)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: number;

  @OneToMany(() => QuestionOption, option => option.question)
  options: QuestionOption[];

  @OneToMany(() => StudentAnswer, answer => answer.question)
  studentAnswers: StudentAnswer[];
}
*/

// ===========================================
// ALTERNATIVA: Si prefieres usar create() con type assertion
// ===========================================
/*
También puedes usar create() de esta manera:

// Para Question:
const question = this.questionRepository.create({
  examId: savedExam.id,
  questionText: questionData.questionText,
  questionType: QuestionType.MULTIPLE_CHOICE,
  difficulty: this.mapDifficultyToEnum(questionData.difficulty),
  topic: questionData.topic,
  aiGenerated: true,
} as Partial<Question>);

// Para QuestionOption:
const option = this.optionRepository.create({
  questionId: savedQuestion.id,
  optionText: questionData.options[j],
  isCorrect: j === questionData.correctAnswer,
  optionOrder: j + 1,
} as Partial<QuestionOption>);
*/

// ===========================================
// src/ai/ai.service.ts (ACTUALIZAR INTERFACE)
// ===========================================
/*
Asegúrate de que tu interface GeneratedQuestion en AiService tenga:

interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard'; // ✅ Tipos correctos
  topic: string;
}
*/