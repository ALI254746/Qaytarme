
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ariza } from '../../schemas/ariza.schema';
import { User } from '../../schemas/user.schema';
import { MatchesService } from '../matches/matches.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ArizaService {
  constructor(
    @InjectModel('Ariza') private arizaModel: Model<Ariza>,
    @InjectModel('User') private userModel: Model<User>,
    private matchesService: MatchesService,
    private cloudinaryService: CloudinaryService,
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

  async findAll(query: any) {
    const { status, category, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = { moderationStatus: 'approved' };
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'Barchasi') {
      filter.itemType = category;
    }

    if (search) {
      filter.$or = [
        { itemType: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
        { itemDescription: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await this.arizaModel.countDocuments(filter);
    const arizalar = await this.arizaModel.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      arizalar,
      total,
      hasMore: total > skip + arizalar.length,
    };
  }

  async create(userId: string, data: any, file?: Express.Multer.File) {
    try {
      let imageData: any = null;
      if (file) {
        const result = await this.cloudinaryService.uploadFile(file);
        imageData = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }

      let coordinates = data.coordinates;
      if (typeof coordinates === 'string') {
        try {
          coordinates = JSON.parse(coordinates);
        } catch (e) {
          coordinates = null;
        }
      }

      const newAriza = new this.arizaModel({
        ...data,
        coordinates,
        image: imageData,
        moderationStatus: 'approved',
        user: new Types.ObjectId(userId),
      });

      const savedAriza = await newAriza.save();
      
      // Trigger matching in background
      this.matchesService.findAndCreateMatches(savedAriza).catch(err => console.error('Matching trigger failed:', err));

      return savedAriza;
    } catch (error) {
      console.error('Create Ariza Error:', error);
      throw new InternalServerErrorException('Error creating ariza');
    }
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
