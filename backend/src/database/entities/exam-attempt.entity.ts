import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Exam } from './exam.entity';
import { StudentAnswer } from './student-answer.entity';
import { AiFeedback } from './ai-feedback.entity';

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'start_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ name: 'total_questions', nullable: true })
  totalQuestions: number;

  @Column({ name: 'correct_answers', nullable: true })
  correctAnswers: number;

  @Column({ name: 'time_spent_minutes', nullable: true })
  timeSpentMinutes: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  // Relaciones
  @ManyToOne(() => Exam, exam => exam.attempts)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: number;

  @ManyToOne(() => User, user => user.attempts)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: number;

  @OneToMany(() => StudentAnswer, answer => answer.attempt)
  answers: StudentAnswer[];

  @OneToMany(() => AiFeedback, feedback => feedback.attempt)
  aiFeedback: AiFeedback[];
}
