import { IsString, IsInt, IsEnum, Min, Max, MinLength } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString({ message: 'El tema es requerido' })
  @MinLength(2, { message: 'El tema debe tener al menos 2 caracteres' })
  topic: string;

  @IsInt({ message: 'El número de preguntas debe ser un número entero' })
  @Min(1, { message: 'Debe generar al menos 1 pregunta' })
  @Max(50, { message: 'Máximo 50 preguntas pueden ser generadas' })
  questionCount: number;

  @IsEnum(['easy', 'medium', 'hard', 'mixed'], { 
    message: 'La dificultad debe ser: easy, medium, hard o mixed' 
  })
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
}