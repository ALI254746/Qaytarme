
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match } from '../../schemas/match.schema';
import { Ariza } from '../../schemas/ariza.schema';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class MatchesService {
  private readonly logger = new Logger(MatchesService.name);

  private imageClient: ImageAnnotatorClient | null = null;

  constructor(
    @InjectModel(Match.name) private matchModel: Model<Match>,
    @InjectModel(Ariza.name) private arizaModel: Model<Ariza>,
  ) {
    const credPath = require('path').join(process.cwd(), 'google-credentials.json');
    if (require('fs').existsSync(credPath)) {
      this.imageClient = new ImageAnnotatorClient({
        keyFilename: credPath,
      });
    } else {
      this.logger.warn(
        'Google Cloud Vision credentials not found (google-credentials.json). Image matching will be disabled.',
      );
    }
  }

  // --- AI / SEMANTIC LOGIC --- //
  


  // Future: This can be replaced by TensorFlow.js Universal Sentence Encoder or OpenAI Embeddings
  private calculateSemanticSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const t1 = text1.toLowerCase();
    const t2 = text2.toLowerCase();
    
    // Check for precise matches like Serial Numbers, Phone Models, specific unique keywords
    const uniqueIdentifiers = [
      /\biphone\s?1[1-5]\b/g, // iPhone models
      /\bsamsung\s?s\d{2}\b/g, // Samsung models
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Card numbers
      /\b([a-z0-9]{17})\b/g // VIN or Serial numbers logic
    ];

    for (const regex of uniqueIdentifiers) {
        const m1 = t1.match(regex);
        const m2 = t2.match(regex);
        if (m1 && m2 && m1[0] === m2[0]) return 100; // Exact model/ID match
    }

    // Standard Jaccard Similarity for now
    const set1 = new Set(t1.split(/\s+/).filter(w => w.length > 2));
    const set2 = new Set(t2.split(/\s+/).filter(w => w.length > 2));
    let intersection = 0;
    set1.forEach(word => { if (set2.has(word)) intersection++; });
    const union = new Set([...set1, ...set2]).size;

    return union === 0 ? 0 : (intersection / union) * 100;
  }

  // --- IMAGE COMPARISON (Google Cloud Vision) --- //
  private async compareImages(url1: string, url2: string): Promise<number> {
      if (!this.imageClient || !url1 || !url2) return 0;
      try {
          // Limit concurrent requests or caching could be added here
          // We fetch LABEL_DETECTION for both images
          const [result1] = await this.imageClient.labelDetection(url1);
          const [result2] = await this.imageClient.labelDetection(url2);

          const labels1 = new Set(result1.labelAnnotations?.map(l => l.description?.toLowerCase()).filter(Boolean) || []);
          const labels2 = new Set(result2.labelAnnotations?.map(l => l.description?.toLowerCase()).filter(Boolean) || []);

          if (labels1.size === 0 || labels2.size === 0) return 0;

          // Intersection of labels (e.g., both have 'cat', 'mammal', 'vertebrate')
          let intersection = 0;
          labels1.forEach(l => { if (labels2.has(l)) intersection++; });
          
          // Basic Jaccard Index for labels
          const union = new Set([...labels1, ...labels2]).size;
          const score = (intersection / union) * 100;
          
          this.logger.debug(`Image Compare: ${score.toFixed(1)}% | Common: ${intersection}`);
          return Math.round(score);
      } catch (error) {
          this.logger.warn(`Google Vision API Error (likely no creds): ${error.message}`);
          return 0; // Fail safe
      }
  }

  async findAndCreateMatches(newItem: Ariza) {
    try {
      const targetStatus = newItem.status === 'lost' ? 'found' : 'lost';
      
      // Filter candidates by basic criteria first (Region OR ItemType must match to even consider)
      const candidates = await this.arizaModel.find({
        status: targetStatus,
        moderationStatus: 'approved',
        _id: { $ne: newItem._id },
        $or: [
           { region: newItem.region }, 
           { itemType: newItem.itemType }
        ]
      }).lean();

      const matches: Types.ObjectId[] = [];

      for (const candidate of candidates) {
        let score = 0;
        const reasons: string[] = [];

        // 1. Critical Match: Type (30%)
        if (newItem.itemType === candidate.itemType) {
          score += 30;
          reasons.push('Kategoriya');
        }

        // 2. Geography: Region (15%) & District (15%)
        if (newItem.region === candidate.region) {
          score += 15;
          if (newItem.district === candidate.district) {
            score += 15;
            reasons.push('Lokatsiya');
          }
        }

        // 3. Time Logic Check
        const dateDiff = Math.abs(new Date(newItem.createdAt).getTime() - new Date(candidate.createdAt).getTime());
        const daysDiff = dateDiff / (1000 * 3600 * 24);
        if (daysDiff <= 7) score += 10; 

        // 4. Semantic / Description Match (25%)
        const nameSim = this.calculateSemanticSimilarity(newItem.itemName, candidate.itemName);
        const descSim = this.calculateSemanticSimilarity(newItem.itemDescription, candidate.itemDescription);
        const textScore = Math.max(nameSim, descSim);
        
        if (textScore > 80) { score += 25; reasons.push('Matn'); } 
        else if (textScore > 40) { score += 10; }
        
        // 5. Image AI Check (20%) - Google Cloud Vision
        // Only trigger if we already have some base match (e.g. score > 20) to save API calls
        if (score >= 20 && newItem.image?.url && candidate.image?.url) {
            const imageScore = await this.compareImages(newItem.image.url, candidate.image.url);
            if (imageScore > 60) {
                score += 20;
                reasons.push('Rasm (AI)');
            } else if (imageScore > 30) {
                score += 10;
            }
        }

        // Threshold to be a "Match"
        if (score >= 50) {
          const lostItem = newItem.status === 'lost' ? newItem : candidate;
          const foundItem = newItem.status === 'found' ? newItem : candidate;

          // Prevent duplicate matches
          const exists = await this.matchModel.exists({ 
            lostItem: lostItem._id, 
            foundItem: foundItem._id 
          });
          
          if (!exists) {
            await this.matchModel.create({
              lostItem: lostItem._id,
              foundItem: foundItem._id,
              similarity: Math.round(score),
              reason: reasons.length > 0 ? reasons.join(', ') : 'Umumiy o\'xshashlik',
              user1: lostItem.user,
              user2: foundItem.user,
              isRead1: false,
              isRead2: false
            });
            matches.push(candidate._id);
          }
        }
      }
      
      if (matches.length > 0) {
         this.logger.log(`AI Matching: Found ${matches.length} matches for item ${newItem._id}`);
      }
      return matches;
    } catch (error) {
      this.logger.error('Matching algorithm error:', error);
      return [];
    }
  }

  async getUserMatches(userId: string) {
    return this.matchModel.find({
      $or: [{ user1: new Types.ObjectId(userId) }, { user2: new Types.ObjectId(userId) }]
    })
    .populate('lostItem')
    .populate('foundItem')
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  }

  async findRelatedItemId(originArizaId: string, matchedUserId: string): Promise<string | null> {
    try {
      // Find a match where one side is originArizaId
      // and the OTHER side belongs to matchedUserId (or user1/user2 checks)
      
      const match = await this.matchModel.findOne({
        $or: [
          { lostItem: new Types.ObjectId(originArizaId) },
          { foundItem: new Types.ObjectId(originArizaId) }
        ]
      }).populate('lostItem foundItem').exec();

      if (!match) return null;

      const lostId = (match.lostItem as any)?._id?.toString();
      const foundId = (match.foundItem as any)?._id?.toString();

      if (lostId === originArizaId.toString()) {
         return foundId;
      } else {
         return lostId;
      }
    } catch (error) {
       this.logger.error("Error finding related item:", error);
       return null;
    }
  }
}
