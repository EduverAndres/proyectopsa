import { IsString, IsInt, IsEnum, IsOptional, Min, Max, MinLength } from 'class-validator';
import { DifficultyLevel } from '../../database/entities/exam.entity';

export class GenerateExamDto {
  @IsString({ message: 'El título es requerido' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString({ message: 'El tema/materia es requerido para generar preguntas' })
  @MinLength(2, { message: 'El tema debe tener al menos 2 caracteres' })
  subjectName: string;

  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(10, { message: 'La duración mínima es 10 minutos' })
  @Max(300, { message: 'La duración máxima es 300 minutos' })
  durationMinutes: number;

  @IsInt({ message: 'El número de preguntas debe ser un número entero' })
  @Min(5, { message: 'Debe haber al menos 5 preguntas para generar con IA' })
  @Max(50, { message: 'Máximo 50 preguntas pueden ser generadas por IA' })
  totalQuestions: number;

  @IsEnum(DifficultyLevel, { message: 'El nivel de dificultad no es válido' })
  difficultyLevel: DifficultyLevel;
}