
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { User } from '../../schemas/user.schema';
import { MatchesService } from '../matches/matches.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

import { TranslationService } from '../translation/translation.service';

@Injectable()
export class ArizaService {
  constructor(
    @InjectModel('Ariza') private arizaModel: Model<Ariza>,
    @InjectModel('User') private userModel: Model<User>,
    private matchesService: MatchesService,
    private cloudinaryService: CloudinaryService,
    private translationService: TranslationService,
  ) {}

  async confirmHandover(arizaId: string, userId: string, otherUserId: string) {
    const ariza = await this.arizaModel.findById(arizaId);
    if (!ariza) throw new Error('E\'lon topilmadi');

    // Only allow setting matchedUser once
    if (!ariza.matchedUser) {
      // If current user is the owner, matchedUser is otherUserId
      // If current user is NOT the owner, matchedUser is current user (userId)
      if (ariza.user.toString() === userId) {
        ariza.matchedUser = new Types.ObjectId(otherUserId);
      } else {
        ariza.matchedUser = new Types.ObjectId(userId);
      }
    }

    // Who is the finder?
    // If it's a "found" item, the owner of ariza is the finder.
    // If it's a "lost" item, the 'matchedUser' (the person who replied) is the finder.
    const isOwner = ariza.user.toString() === userId;
    // Finder is: Owner if status is 'found', otherwise the matchedUser (the non-owner who found it)
    const isFinder = (ariza.status === 'found' && isOwner) || (ariza.status === 'lost' && !isOwner);
      
    if (isFinder) {
      ariza.confirmedByFinder = true;
      if (!ariza.matchedUser && !isOwner) {
        ariza.matchedUser = new Types.ObjectId(userId);
      } else if (!ariza.matchedUser && isOwner) {
        ariza.matchedUser = new Types.ObjectId(otherUserId);
      }
    }

    await ariza.save();
    return this.checkAndAwardPoints(ariza);
  }

  async confirmReceipt(arizaId: string, userId: string, otherUserId: string) {
    const ariza = await this.arizaModel.findById(arizaId);
    if (!ariza) throw new Error('E\'lon topilmadi');

    const isOwner = ariza.user.toString() === userId;
    // Loser is: Owner if status is 'lost', otherwise the matchedUser (the person who lost it and someone found it)
    const isLoser = (ariza.status === 'lost' && isOwner) || (ariza.status === 'found' && !isOwner);

    if (isLoser) {
      ariza.confirmedByLoser = true;
      if (!ariza.matchedUser && !isOwner) {
        ariza.matchedUser = new Types.ObjectId(userId);
      } else if (!ariza.matchedUser && isOwner) {
        ariza.matchedUser = new Types.ObjectId(otherUserId);
      }
    }

    await ariza.save();
    return this.checkAndAwardPoints(ariza);
  }

  async cancelDeal(arizaId: string, userId: string) {
    const ariza = await this.arizaModel.findById(arizaId);
    if (!ariza) throw new Error('E\'lon topilmadi');

    // Reset deal flags if the user is involved
    const isOwner = ariza.user.toString() === userId;
    const isMatched = ariza.matchedUser && ariza.matchedUser.toString() === userId;

    if (isOwner || isMatched) {
        ariza.confirmedByFinder = false;
        ariza.confirmedByLoser = false;
        ariza.matchedUser = null as any; // Unlink the matched user so it's open again
        
        // If it was somehow returned, revert to approved
        if (ariza.moderationStatus === 'returned') {
            ariza.moderationStatus = 'approved';
        }
    }
    
    await ariza.save();
    return ariza;
  }

  private async checkAndAwardPoints(ariza: any) {
    if (ariza.confirmedByFinder && ariza.confirmedByLoser && ariza.moderationStatus !== 'returned') {
      ariza.moderationStatus = 'returned';
      await ariza.save();

      // Check for a related item (the other side of the match)
      if (ariza.matchedUser) {
         const relatedItemId = await this.matchesService.findRelatedItemId(ariza._id.toString(), ariza.matchedUser.toString());
         if (relatedItemId) {
            await this.arizaModel.findByIdAndUpdate(relatedItemId, { moderationStatus: 'returned' });
         }
      }

      // Find the finder's ID to award points
      const finderId = ariza.status === 'found' ? ariza.user : ariza.matchedUser;
      
      if (finderId) {
        const updatedUser = await this.userModel.findByIdAndUpdate(finderId, {
          $inc: { points: 100 }
        }, { new: true });

        // Badge update logic
        if (updatedUser) {
          const newBadges: string[] = [];
          if (updatedUser.points >= 100) newBadges.push('Yaxshi odam');
          if (updatedUser.points >= 300) newBadges.push('Ishonchli qaytaruvchi');
          if (updatedUser.points >= 500) newBadges.push('Qahramon');

          if (newBadges.length > 0) {
            await this.userModel.findByIdAndUpdate(finderId, {
              $addToSet: { badges: { $each: newBadges } }
            });
          }
        }
      }
    }
    return ariza;
  }

  // --- Transliteration Helper ---
  // --- Transliteration Helper ---
  private transliterateCyrillicToLatin(text: string): string {
    if (!text) return text;
    const map = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'J', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'X', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': '',
      'Ы': 'I', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya', 'Ў': 'O\'', 'Қ': 'Q',
      'Ғ': 'G\'', 'Ҳ': 'H',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': '',
      'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'o\'', 'қ': 'q',
      'ғ': 'g\'', 'ҳ': 'h'
    };

    return text.split('').map(char => map[char] || char).join('');
  }

  async create(userId: string, data: any, file?: Express.Multer.File | { url: string }) {
    try {
      let imageData: { url: string; publicId?: string } | null = null;
      
      // Handle Image
      if (file) {
        if ('url' in file) {
            // It's a URL object (from Telegram)
            imageData = { url: file.url };
        } else {
            // It's a Multer file (from Controller)
            const result = await this.cloudinaryService.uploadFile(file);
            imageData = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }
      } else if (data.image) {
         // Fallback if image data is passed directly in body
         imageData = data.image;
      }

      // Transliterate fields
      const newItemData = {
          ...data,
          itemType: this.transliterateCyrillicToLatin(data.itemType),
          itemName: this.transliterateCyrillicToLatin(data.itemName),
          itemDescription: this.transliterateCyrillicToLatin(data.itemDescription),
          fullName: this.transliterateCyrillicToLatin(data.fullName),
      };

      // Parse coordinates if string
      let coordinates = newItemData.coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
        } catch (e) {
          coordinates = null;
        }
      }

      const newAriza = new this.arizaModel({
        ...newItemData,
        coordinates,
        image: imageData,
        moderationStatus: 'approved',
        user: new Types.ObjectId(userId),
      });

      const savedAriza = await newAriza.save();
      
      // AI Matching
      this.matchesService.findAndCreateMatches(savedAriza).catch(err => console.error('Matching trigger failed:', err));

      return savedAriza;
    } catch (error) {
      console.error('Error creating Ariza:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(query: any) {
    const { status, category, search, page = 1, limit = 10 } = query;
    console.log('ArizaService.findAll Query:', query);
    
    const skip = (page - 1) * limit;

    const filter: any = { moderationStatus: 'approved' };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { itemType: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
        { itemDescription: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('ArizaService.findAll Filter:', JSON.stringify(filter, null, 2));

    const total = await this.arizaModel.countDocuments(filter);
    const arizalar = await this.arizaModel.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Translate if targetLang is provided
    const targetLang = query.lang;
    const translatedArizalar = await Promise.all(arizalar.map(async (ariza) => {
        const item = ariza.toObject();
        if (targetLang && targetLang !== 'uz') { // Default/Source likely Uzbek
             item.itemType = await this.translationService.translate(item.itemType, targetLang);
             item.itemName = await this.translationService.translate(item.itemName, targetLang);
             item.itemDescription = await this.translationService.translate(item.itemDescription, targetLang);
        }
        return item;
    }));

    return {
      arizalar: translatedArizalar,
      total,
      hasMore: total > skip + translatedArizalar.length,
    };
  }



  async findById(id: string) {
    return this.arizaModel.findById(id).populate('user', 'name email avatar').exec();
  }

  async findByUser(userId: string) {
    return this.arizaModel.find({ 
      $or: [
        { user: new Types.ObjectId(userId) },
        { matchedUser: new Types.ObjectId(userId) }
      ]
    }).sort({ createdAt: -1 }).exec();
  }

  async remove(id: string, userId: string) {
    const ariza = await this.arizaModel.findOne({ _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) });
    
    if (!ariza) {
      throw new Error("Ariza topilmadi");
    }

    if (ariza.moderationStatus === 'returned') {
      throw new Error("Qaytarilgan e'lonni o'chirish mumkin emas");
    }

    return this.arizaModel.findByIdAndDelete(id).exec();
  }

  async updateModeration(id: string, status: string) {
    return this.arizaModel.findByIdAndUpdate(id, { moderationStatus: status }, { new: true }).exec();
  }
}
