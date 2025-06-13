import { IsInt, IsOptional } from 'class-validator';

export class StartAttemptDto {
  @IsInt({ message: 'El ID del examen es requerido' })
  examId: number;

  @IsOptional()
  @IsInt({ message: 'El número de intento debe ser un número' })
  attemptNumber?: number;
}