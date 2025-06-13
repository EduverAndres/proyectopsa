import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';
import { ExamAttempt } from './exam-attempt.entity';

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  MIXED = 'mixed',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'subject_name', length: 255 })
  subjectName: string;

  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @Column({ name: 'total_questions' })
  totalQuestions: number;

  @Column({
    name: 'difficulty_level',
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.MIXED,
  })
  difficultyLevel: DifficultyLevel;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, user => user.exams)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'teacher_id' })
  teacherId: number;

  @OneToMany(() => Question, question => question.exam)
  questions: Question[];

  @OneToMany(() => ExamAttempt, attempt => attempt.exam)
  attempts: ExamAttempt[];
}
