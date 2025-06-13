import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ExamAttempt } from './exam-attempt.entity';
import { Question } from './question.entity';
import { QuestionOption } from './question-option.entity';

@Entity('student_answers')
export class StudentAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'answer_text', type: 'text', nullable: true })
  answerText: string | null;

  @Column({ name: 'is_correct', nullable: true })
  isCorrect: boolean | null;

  @Column({ name: 'time_spent_seconds', default: 0 })
  timeSpentSeconds: number;

  // Relaciones
  @ManyToOne(() => ExamAttempt, attempt => attempt.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: ExamAttempt;

  @Column({ name: 'attempt_id' })
  attemptId: number;

  @ManyToOne(() => Question, question => question.studentAnswers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'question_id' })
  questionId: number;

  @ManyToOne(() => QuestionOption, { nullable: true })
  @JoinColumn({ name: 'selected_option_id' })
  selectedOption: QuestionOption | null;

  @Column({ name: 'selected_option_id', nullable: true })
  selectedOptionId: number | null;
}