import { IsString, IsInt, IsEnum, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, QuestionDifficulty } from '../../database/entities/question.entity';

export class CreateQuestionOptionDto {
  @IsString({ message: 'El texto de la opción es requerido' })
  optionText: string;

  @IsBoolean({ message: 'Debe indicar si la opción es correcta' })
  isCorrect: boolean;

  @IsInt({ message: 'El orden de la opción debe ser un número' })
  optionOrder: number;
}

export class CreateQuestionDto {
  @IsInt({ message: 'El ID del examen es requerido' })
  examId: number;

  @IsString({ message: 'El texto de la pregunta es requerido' })
  questionText: string;

  @IsEnum(QuestionType, { message: 'El tipo de pregunta no es válido' })
  questionType: QuestionType;

  @IsEnum(QuestionDifficulty, { message: 'La dificultad de la pregunta no es válida' })
  difficulty: QuestionDifficulty;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsArray({ message: 'Las opciones deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  options: CreateQuestionOptionDto[];
}