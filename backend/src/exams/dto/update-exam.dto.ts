import { IsString, IsInt, IsEnum, IsOptional, IsBoolean, Min, Max, MinLength } from 'class-validator';
import { DifficultyLevel } from '../../database/entities/exam.entity';

export class UpdateExamDto {
  @IsOptional()
  @IsString({ message: 'El título es requerido' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ message: 'El nombre de la materia es requerido' })
  @MinLength(2, { message: 'El nombre de la materia debe tener al menos 2 caracteres' })
  subjectName?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(10, { message: 'La duración mínima es 10 minutos' })
  @Max(300, { message: 'La duración máxima es 300 minutos' })
  durationMinutes?: number;

  @IsOptional()
  @IsInt({ message: 'El número de preguntas debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 pregunta' })
  @Max(100, { message: 'Máximo 100 preguntas por examen' })
  totalQuestions?: number;

  @IsOptional()
  @IsEnum(DifficultyLevel, { message: 'El nivel de dificultad no es válido' })
  difficultyLevel?: DifficultyLevel;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}