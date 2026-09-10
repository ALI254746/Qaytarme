import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { VALID_CATEGORIES } from '../../../utils/category.util';

export class CoordinatesDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

/**
 * Multipart form data always arrives as strings, so nested objects are sent
 * as JSON. Parsing here keeps the validation rules meaningful.
 */
function parseJsonObject(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

/**
 * Whitelist of fields a client is allowed to submit.
 *
 * Deliberately absent: `user`, `provenance`, `moderationStatus`,
 * `matchedUser`, `confirmedByFinder`, `confirmedByLoser`, `likeCount`.
 * Those are decided by the server, because provenance is OSINT evidence and
 * must never be self-reported.
 */
export class CreateArizaDto {
  @IsIn(['lost', 'found'])
  status: 'lost' | 'found';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  telegram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  itemType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  itemName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  itemDescription?: string;

  /**
   * Free-form value on purpose: the AI vision step and Telegram channels send
   * local wording. `resolveAnnouncementCategory` maps it to a valid category
   * or infers one from the text.
   */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @Transform(({ value }) => parseJsonObject(value))
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

export const ALLOWED_CATEGORY_HINTS = VALID_CATEGORIES;
