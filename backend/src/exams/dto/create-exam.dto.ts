import { IsString, IsInt, IsEnum, IsOptional, Min, Max, MinLength } from 'class-validator';
import { DifficultyLevel } from '../../database/entities/exam.entity';

export class CreateExamDto {
  @IsString({ message: 'El título es requerido' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString({ message: 'El nombre de la materia es requerido' })
  @MinLength(2, { message: 'El nombre de la materia debe tener al menos 2 caracteres' })
  subjectName: string;

  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(10, { message: 'La duración mínima es 10 minutos' })
  @Max(300, { message: 'La duración máxima es 300 minutos' })
  durationMinutes: number;

  @IsInt({ message: 'El número de preguntas debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 pregunta' })
  @Max(100, { message: 'Máximo 100 preguntas por examen' })
  totalQuestions: number;

  @IsEnum(DifficultyLevel, { message: 'El nivel de dificultad no es válido' })
  difficultyLevel: DifficultyLevel;
}
