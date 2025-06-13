import { IsOptional, IsInt } from 'class-validator';

export class FinishAttemptDto {
  @IsOptional()
  @IsInt({ message: 'El tiempo total gastado debe ser un número' })
  totalTimeSpentMinutes?: number;
}