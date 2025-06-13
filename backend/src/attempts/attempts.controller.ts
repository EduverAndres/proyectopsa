import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseIntPipe 
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { StartAttemptDto } from './dto/start-attempt.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { FinishAttemptDto } from './dto/finish-attempt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start/:examId')
  startAttempt(@Param('examId', ParseIntPipe) examId: number, @Request() req) {
    return this.attemptsService.startAttempt(examId, req.user.id);
  }

  @Post(':attemptId/answer')
  submitAnswer(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @Request() req
  ) {
    return this.attemptsService.submitAnswer(attemptId, submitAnswerDto, req.user.id);
  }

  @Post(':attemptId/finish')
  finishAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @Body() finishAttemptDto: FinishAttemptDto,
    @Request() req
  ) {
    return this.attemptsService.finishAttempt(attemptId, finishAttemptDto, req.user.id);
  }

  @Get(':attemptId/results')
  getResults(@Param('attemptId', ParseIntPipe) attemptId: number, @Request() req) {
    return this.attemptsService.getAttemptResults(attemptId, req.user.id);
  }

  @Get('my-attempts')
  getMyAttempts(@Request() req) {
    return this.attemptsService.getStudentAttempts(req.user.id);
  }

  @Get('exam/:examId')
  getAttemptsByExam(@Param('examId', ParseIntPipe) examId: number, @Request() req) {
    return this.attemptsService.getAttemptsByExam(examId, req.user.id);
  }

  @Get(':attemptId')
  getAttempt(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return this.attemptsService.getAttempt(attemptId);
  }
}