import { IsInt, IsString, IsArray, ValidateNested, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentAnswerForFeedbackDto {
  @IsInt()
  questionId: number;

  @IsString()
  questionText: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsNumber()
  timeSpentSeconds: number;
}

export class GenerateFeedbackDto {
  @IsInt({ message: 'El ID del intento es requerido' })
  attemptId: number;

  @IsString({ message: 'El título del examen es requerido' })
  examTitle: string;

  @IsNumber({}, { message: 'La puntuación debe ser un número' })
  score: number;

  @IsArray({ message: 'Las respuestas del estudiante deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => StudentAnswerForFeedbackDto)
  studentAnswers: StudentAnswerForFeedbackDto[];
}
