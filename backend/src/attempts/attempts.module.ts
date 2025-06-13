import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { ExamAttempt } from '../database/entities/exam-attempt.entity';
import { StudentAnswer } from '../database/entities/student-answer.entity';
import { AiFeedback } from '../database/entities/ai-feedback.entity';
import { Exam } from '../database/entities/exam.entity';
import { Question } from '../database/entities/question.entity';
import { QuestionOption } from '../database/entities/question-option.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamAttempt,
      StudentAnswer,
      AiFeedback,
      Exam,
      Question,
      QuestionOption,
    ]),
    AiModule,
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}