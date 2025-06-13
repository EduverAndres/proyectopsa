import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request,
  ParseIntPipe 
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { GenerateExamDto } from './dto/generate-exam.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherGuard } from '../auth/guards/teacher.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @UseGuards(TeacherGuard)
  @Post()
  create(@Body() createExamDto: CreateExamDto, @Request() req) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @UseGuards(TeacherGuard)
  @Post('generate')
  generateWithAI(@Body() generateExamDto: GenerateExamDto, @Request() req) {
    return this.examsService.generateWithAI(generateExamDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.examsService.findAll();
  }

  @UseGuards(TeacherGuard)
  @Get('teacher')
  findByTeacher(@Request() req) {
    return this.examsService.findByTeacher(req.user.id);
  }

  @Public()
  @Get('available')
  findPublished() {
    return this.examsService.findPublished();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.examsService.findOne(id);
  }

  @Get(':id/questions')
  findOneWithQuestions(@Param('id', ParseIntPipe) id: number) {
    return this.examsService.findOneWithQuestions(id);
  }

  @UseGuards(TeacherGuard)
  @Patch(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.examsService.publish(id, req.user.id);
  }

  @UseGuards(TeacherGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.examsService.remove(id, req.user.id);
  }
}
