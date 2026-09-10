import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { VALID_CATEGORIES } from '../../../utils/category.util';

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 10;

export class QueryArizaDto {
  @IsOptional()
  @IsIn(['lost', 'found', 'all'])
  status?: 'lost' | 'found' | 'all';

  @IsOptional()
  @IsIn([...VALID_CATEGORIES, 'all'])
  category?: string;

  /** Escaped before it reaches Mongo, and length capped to avoid ReDoS. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Hard cap: the public API must not be a bulk export endpoint. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  lang?: string;
}
