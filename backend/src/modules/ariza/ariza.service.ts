import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { User } from '../../schemas/user.schema';
import { MatchesService } from '../matches/matches.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { TranslationService } from '../translation/translation.service';
import {
  buildAnnouncementText,
  resolveAnnouncementCategory,
} from '../../utils/announcement-category.util';
import { escapeRegex, sanitizeAriza, sanitizeArizaList } from '../../utils/pii.util';
import { transliterateCyrillicToLatin } from '../../utils/text-normalization.util';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  QueryArizaDto,
} from './dto/query-ariza.dto';
import { CreateArizaDto } from './dto/create-ariza.dto';

/**
 * Fields the server owns. A client can never set them, because provenance is
 * OSINT evidence and moderation/reward state decides who gets points.
 */
const SERVER_OWNED_FIELDS = [
  'matchedUser',
  'confirmedByFinder',
  'confirmedByLoser',
  'likeCount',
  'isLikedByCurrentUser',
  'geo',
  'occurredAt',
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class ArizaService {
  private readonly logger = new Logger(ArizaService.name);

  constructor(
    @InjectModel('Ariza') private arizaModel: Model<Ariza>,
    @InjectModel('User') private userModel: Model<User>,
    private matchesService: MatchesService,
    private cloudinaryService: CloudinaryService,
    private translationService: TranslationService,
  ) {}

  private assertObjectId(value: string, label = 'identifikator'): Types.ObjectId {
    if (!value || !Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Noto\u2018g\u2018ri ${label}`);
    }
    return new Types.ObjectId(value);
  }

  private async loadOwnedOrMatched(arizaId: string, userId: string) {
    this.assertObjectId(arizaId, 'e\u2018lon identifikatori');
    const ariza = await this.arizaModel.findById(arizaId);
    if (!ariza) throw new NotFoundException("E'lon topilmadi");

    const isOwner = ariza.user.toString() === userId;
    const isMatched = ariza.matchedUser?.toString() === userId;

    // Before a counterpart is registered only the owner may act; afterwards
    // both parties may. Without this check any authenticated user could
    // register themselves as the finder and collect the reward points.
    if (!isOwner && !isMatched && ariza.matchedUser) {
      throw new ForbiddenException('Bu e\u2018lon bo\u2018yicha ruxsat yo\u2018q');
    }

    return { ariza, isOwner, isMatched };
  }

  private resolveCounterpart(
    ariza: Ariza,
    userId: string,
    isOwner: boolean,
    otherUserId?: string,
  ): Types.ObjectId {
    if (ariza.matchedUser) return ariza.matchedUser;

    if (isOwner) {
      if (!otherUserId) {
        throw new BadRequestException('Ikkinchi tomon ko\u2018rsatilmagan');
      }
      const counterpart = this.assertObjectId(
        otherUserId,
        'foydalanuvchi identifikatori',
      );
      if (counterpart.toString() === userId) {
        throw new BadRequestException(
          'Ikkinchi tomon o\u2018zingiz bo\u2018lishi mumkin emas',
        );
      }
      return counterpart;
    }

    // A non-owner may only register themselves, never a third party.
    return new Types.ObjectId(userId);
  }

  async confirmHandover(arizaId: string, userId: string, otherUserId: string) {
    const { ariza, isOwner } = await this.loadOwnedOrMatched(arizaId, userId);

    if (!ariza.matchedUser) {
      ariza.matchedUser = this.resolveCounterpart(ariza, userId, isOwner, otherUserId);
    }

    // If it's a "found" item, the owner of the announcement is the finder.
    // If it's a "lost" item, the matched user is the finder.
    const isFinder =
      (ariza.status === 'found' && isOwner) || (ariza.status === 'lost' && !isOwner);

    if (!isFinder) {
      throw new ForbiddenException(
        'Topshirishni faqat buyumni topgan tomon tasdiqlaydi',
      );
    }

    ariza.confirmedByFinder = true;
    await ariza.save();
    return this.checkAndAwardPoints(ariza);
  }

  async confirmReceipt(arizaId: string, userId: string, otherUserId: string) {
    const { ariza, isOwner } = await this.loadOwnedOrMatched(arizaId, userId);

    if (!ariza.matchedUser) {
      ariza.matchedUser = this.resolveCounterpart(ariza, userId, isOwner, otherUserId);
    }

    const isLoser =
      (ariza.status === 'lost' && isOwner) || (ariza.status === 'found' && !isOwner);

    if (!isLoser) {
      throw new ForbiddenException('Qabul qilishni faqat buyum egasi tasdiqlaydi');
    }

    ariza.confirmedByLoser = true;
    await ariza.save();
    return this.checkAndAwardPoints(ariza);
  }

  async cancelDeal(arizaId: string, userId: string) {
    const { ariza } = await this.loadOwnedOrMatched(arizaId, userId);

    if (ariza.moderationStatus === 'returned') {
      throw new BadRequestException(
        'Yakunlangan kelishuvni bekor qilish mumkin emas',
      );
    }

    ariza.confirmedByFinder = false;
    ariza.confirmedByLoser = false;
    ariza.matchedUser = null as any;

    await ariza.save();
    return ariza;
  }

  private async checkAndAwardPoints(ariza: any) {
    if (
      ariza.confirmedByFinder &&
      ariza.confirmedByLoser &&
      ariza.moderationStatus !== 'returned'
    ) {
      ariza.moderationStatus = 'returned';
      await ariza.save();

      // Close the other side of the match as well.
      if (ariza.matchedUser) {
        const relatedItemId = await this.matchesService.findRelatedItemId(
          ariza._id.toString(),
          ariza.matchedUser.toString(),
        );
        if (relatedItemId) {
          await this.arizaModel.findByIdAndUpdate(relatedItemId, {
            moderationStatus: 'returned',
          });
        }
      }

      const finderId = ariza.status === 'found' ? ariza.user : ariza.matchedUser;

      if (finderId) {
        const updatedUser = await this.userModel.findByIdAndUpdate(
          finderId,
          { $inc: { points: 100 } },
          { new: true },
        );

        if (updatedUser) {
          const newBadges: string[] = [];
          if (updatedUser.points >= 100) newBadges.push('Yaxshi odam');
          if (updatedUser.points >= 300) newBadges.push('Ishonchli qaytaruvchi');
          if (updatedUser.points >= 500) newBadges.push('Qahramon');

          if (newBadges.length > 0) {
            await this.userModel.findByIdAndUpdate(finderId, {
              $addToSet: { badges: { $each: newBadges } },
            });
          }
        }
      }
    }
    return ariza;
  }

  /**
   * Cyrillic input is transliterated so search and matching work across both
   * scripts. Case is preserved because these values are displayed as is.
   */
  private toLatin(text?: string | null): string | undefined {
    if (!text) return undefined;
    return transliterateCyrillicToLatin(text);
  }

  async create(
    userId: string,
    data: CreateArizaDto & Record<string, any>,
    file?: Express.Multer.File | { url: string },
  ) {
    try {
      let imageData: { url: string; publicId?: string } | null = null;

      if (file) {
        if ('url' in file) {
          // Provided by the trusted Telegram ingestion pipeline.
          imageData = { url: file.url };
        } else {
          const result = await this.cloudinaryService.uploadFile(file);
          imageData = {
            url: result.secure_url,
            publicId: result.public_id,
          };
        }
      }

      // Resolve the category from the suggested value AND the announcement text.
      // AI image analysis often answers with the fallback value, so the text is
      // allowed to correct an unusable or low confidence suggestion.
      const categoryResolution = resolveAnnouncementCategory(
        data.category,
        buildAnnouncementText(data),
      );

      if (categoryResolution.corrected) {
        this.logger.warn(
          `Category corrected from "${categoryResolution.suggestedCategory}" to "${categoryResolution.category}" using announcement text`,
        );
      } else if (!categoryResolution.confident) {
        this.logger.warn(
          `Category could not be determined for "${data.itemType || 'unknown item'}", using "${categoryResolution.category}"`,
        );
      }

      let coordinates: any = data.coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
        } catch {
          coordinates = undefined;
        }
      }

      // Explicit field list instead of spreading the request body, so server
      // owned fields (provenance, moderationStatus, ...) stay server owned.
      const payload: Record<string, unknown> = {
        user: this.assertObjectId(userId, 'foydalanuvchi identifikatori'),
        status: data.status,
        fullName: this.toLatin(data.fullName),
        phone: data.phone,
        telegram: data.telegram,
        email: data.email,
        itemType: this.toLatin(data.itemType),
        itemName: this.toLatin(data.itemName),
        itemDescription: this.toLatin(data.itemDescription),
        category: categoryResolution.category,
        date: data.date,
        location: data.location,
        region: data.region,
        district: data.district,
        coordinates,
        image: imageData,
        moderationStatus: 'approved',
      };

      for (const field of SERVER_OWNED_FIELDS) {
        delete (payload as any)[field];
      }

      // Provenance is only accepted from trusted internal callers (Telegram
      // ingestion, admin import). An HTTP request body can never set it.
      if (data.provenance && data.trustedSource === true) {
        payload.provenance = data.provenance;
      }

      const savedAriza = await new this.arizaModel(payload).save();

      this.matchesService
        .findAndCreateMatches(savedAriza)
        .catch((error) =>
          this.logger.error(`Matching trigger failed: ${error.message}`),
        );

      return savedAriza;
    } catch (error: any) {
      if (error?.status && error.status < 500) throw error;
      this.logger.error(`Error creating Ariza: ${error.message}`, error.stack);
      throw new InternalServerErrorException("E'lonni saqlashda xatolik yuz berdi");
    }
  }

  async findAll(query: QueryArizaDto, viewerId?: string | null) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(query.limit) || DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * limit;

    const filter: any = { moderationStatus: 'approved' };

    if (query.status && query.status !== 'all') filter.status = query.status;
    if (query.category && query.category !== 'all') filter.category = query.category;

    if (query.search) {
      // Escaped: user input must never be interpreted as a regular expression.
      const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [
        { itemType: pattern },
        { itemName: pattern },
        { itemDescription: pattern },
        { location: pattern },
      ];
    }

    const [total, arizalar] = await Promise.all([
      this.arizaModel.countDocuments(filter),
      this.arizaModel
        .find(filter)
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
    ]);

    const targetLang = query.lang;
    const prepared = await Promise.all(
      arizalar.map(async (item: any) => {
        if (targetLang && targetLang !== 'uz') {
          item.itemType = await this.translationService.translate(
            item.itemType,
            targetLang,
          );
          item.itemName = await this.translationService.translate(
            item.itemName,
            targetLang,
          );
          item.itemDescription = await this.translationService.translate(
            item.itemDescription,
            targetLang,
          );
        }
        return item;
      }),
    );

    return {
      arizalar: sanitizeArizaList(prepared, viewerId),
      total,
      page,
      limit,
      hasMore: total > skip + prepared.length,
    };
  }

  async findById(id: string, viewerId?: string | null) {
    this.assertObjectId(id, 'e\u2018lon identifikatori');

    const ariza = await this.arizaModel
      .findById(id)
      .populate('user', 'name avatar')
      .lean()
      .exec();

    if (!ariza) throw new NotFoundException("E'lon topilmadi");

    return sanitizeAriza(ariza, viewerId);
  }

  async findByUser(userId: string) {
    const objectId = this.assertObjectId(userId, 'foydalanuvchi identifikatori');

    const arizalar = await this.arizaModel
      .find({ $or: [{ user: objectId }, { matchedUser: objectId }] })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return sanitizeArizaList(arizalar, userId);
  }

  async remove(id: string, userId: string) {
    this.assertObjectId(id, 'e\u2018lon identifikatori');

    const ariza = await this.arizaModel.findById(id);
    if (!ariza) throw new NotFoundException("E'lon topilmadi");

    if (ariza.user.toString() !== userId) {
      throw new ForbiddenException("Faqat o'z e'loningizni o'chirishingiz mumkin");
    }

    if (ariza.moderationStatus === 'returned') {
      throw new BadRequestException("Qaytarilgan e'lonni o'chirish mumkin emas");
    }

    return this.arizaModel.findByIdAndDelete(id).exec();
  }

  async updateModeration(id: string, status: string) {
    this.assertObjectId(id, 'e\u2018lon identifikatori');
    return this.arizaModel
      .findByIdAndUpdate(id, { moderationStatus: status }, { new: true })
      .exec();
  }
}
