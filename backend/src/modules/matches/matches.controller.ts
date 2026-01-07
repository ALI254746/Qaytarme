import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(@Req() req: any) {
    return this.matchesService.getUserMatches(req.user.id);
  }
}
