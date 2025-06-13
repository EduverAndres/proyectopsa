import { IsInt, IsOptional, IsString } from 'class-validator';

export class SubmitAnswerDto {
  @IsInt({ message: 'El ID de la pregunta es requerido' })
  questionId: number;

  @IsOptional()
  @IsInt({ message: 'El ID de la opción seleccionada debe ser un número' })
  selectedOptionId?: number;

  @IsOptional()
  @IsString({ message: 'La respuesta de texto debe ser una cadena' })
  answerText?: string;

  @IsOptional()
  @IsInt({ message: 'El tiempo gastado debe ser un número' })
  timeSpentSeconds?: number;
}
