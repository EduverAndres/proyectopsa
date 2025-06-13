import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  ParseIntPipe,
  Patch,
  Query
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import { QuestionType, QuestionDifficulty } from '../database/entities/question.entity';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @UseGuards(TeacherGuard)
  @Post()
  create(@Body() createQuestionDto: CreateQuestionDto, @Request() req) {
    return this.questionsService.create(createQuestionDto, req.user.id);
  }

  @Get('exam/:examId')
  findByExam(@Param('examId', ParseIntPipe) examId: number) {
    return this.questionsService.findByExam(examId);
  }

  @Get('exam/:examId/difficulty/:difficulty')
  findByDifficulty(
    @Param('examId', ParseIntPipe) examId: number,
    @Param('difficulty') difficulty: QuestionDifficulty
  ) {
    return this.questionsService.findByDifficulty(examId, difficulty);
  }

  @Get('exam/:examId/type/:type')
  findByType(
    @Param('examId', ParseIntPipe) examId: number,
    @Param('type') questionType: QuestionType
  ) {
    return this.questionsService.findByType(examId, questionType);
  }

  @Get('exam/:examId/count')
  countQuestions(@Param('examId', ParseIntPipe) examId: number) {
    return this.questionsService.countQuestionsByExam(examId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(TeacherGuard)
  getQuestionStats(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.questionsService.getQuestionStats(id, req.user.id);
  }

  @UseGuards(TeacherGuard)
  @Post(':id/duplicate')
  duplicateQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body('targetExamId') targetExamId: number,
    @Request() req
  ) {
    return this.questionsService.duplicateQuestion(questionId, targetExamId, req.user.id);
  }

@Patch(':id')
update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateData: any, // Solución temporal
  @Request() req
) {
  return this.questionsService.update(id, updateData, req.user.id);
}

  @UseGuards(TeacherGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.questionsService.remove(id, req.user.id);
  }
}