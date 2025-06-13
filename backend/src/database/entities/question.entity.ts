import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exam } from './exam.entity';
import { QuestionOption } from './question-option.entity';
import { StudentAnswer } from './student-answer.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

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
  topic: string;

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
