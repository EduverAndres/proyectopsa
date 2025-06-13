import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ExamAttempt } from './exam-attempt.entity';
import { User } from './user.entity';

@Entity('ai_feedback')
export class AiFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'feedback_text', type: 'text' })
  feedbackText: string;

  @Column({ name: 'improvement_areas', type: 'json', nullable: true })
  improvementAreas: any;

  @Column({ type: 'json', nullable: true })
  strengths: any;

  @Column({ name: 'recommended_resources', type: 'json', nullable: true })
  recommendedResources: any;

  @Column({ name: 'difficulty_analysis', type: 'json', nullable: true })
  difficultyAnalysis: any;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  // Relaciones
  @ManyToOne(() => ExamAttempt, attempt => attempt.aiFeedback)
  @JoinColumn({ name: 'attempt_id' })
  attempt: ExamAttempt;

  @Column({ name: 'attempt_id' })
  attemptId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'student_id' })
  studentId: number;
}