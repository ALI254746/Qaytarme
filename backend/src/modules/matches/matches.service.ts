
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
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
    private configService: ConfigService,
  ) {
    // Try to initialize Google Vision API
    // Option 1: Use service account JSON from environment variable
    const googleCredentialsJson = this.configService.get<string>('GOOGLE_CREDENTIALS_JSON');
    if (googleCredentialsJson) {
      try {
        const credentials = JSON.parse(googleCredentialsJson);
        this.imageClient = new ImageAnnotatorClient({
          credentials: credentials,
        });
        this.logger.log('✅ Google Vision API initialized from GOOGLE_CREDENTIALS_JSON');
      } catch (error) {
        this.logger.warn('Failed to parse GOOGLE_CREDENTIALS_JSON:', error.message);
      }
    }
    
    // Option 2: Use API key (simpler, but limited features)
    if (!this.imageClient) {
      const googleVisionApiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
      if (googleVisionApiKey) {
        this.imageClient = new ImageAnnotatorClient({
          apiKey: googleVisionApiKey,
        });
        this.logger.log('✅ Google Vision API initialized from GOOGLE_VISION_API_KEY');
      }
    }
    
    // Option 3: Try credentials file (for local development)
    if (!this.imageClient) {
      const credPath = require('path').join(process.cwd(), 'google-credentials.json');
      if (require('fs').existsSync(credPath)) {
        this.imageClient = new ImageAnnotatorClient({
          keyFilename: credPath,
        });
        this.logger.log('✅ Google Vision API initialized from google-credentials.json file');
      }
    }
    
    if (!this.imageClient) {
      this.logger.warn(
        '⚠️ Google Cloud Vision API not initialized. Image matching will be disabled.',
      );
      this.logger.warn(
        '💡 To enable: Set GOOGLE_CREDENTIALS_JSON or GOOGLE_VISION_API_KEY in environment variables.',
      );
    }
  }

  // --- AI / SEMANTIC LOGIC --- //
  


  // Future: This can be replaced by TensorFlow.js Universal Sentence Encoder or OpenAI Embeddings
  private calculateSemanticSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const t1 = text1.toLowerCase().trim();
    const t2 = text2.toLowerCase().trim();
    
    // Exact match check
    if (t1 === t2) return 100;
    
    // Check if one contains the other (for partial matches)
    if (t1.includes(t2) || t2.includes(t1)) {
      const shorter = t1.length < t2.length ? t1 : t2;
      const longer = t1.length >= t2.length ? t1 : t2;
      return (shorter.length / longer.length) * 90; // Up to 90% for substring match
    }
    
    // Check for precise matches like Serial Numbers, Phone Models, specific unique keywords
    const uniqueIdentifiers = [
      /\biphone\s?1[1-5]\b/gi, // iPhone models
      /\bsamsung\s?s\d{2}\b/gi, // Samsung models
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Card numbers
      /\b([a-z0-9]{10,})\b/gi // Serial numbers (10+ chars)
    ];

    for (const regex of uniqueIdentifiers) {
        const m1 = t1.match(regex);
        const m2 = t2.match(regex);
        if (m1 && m2 && m1[0] === m2[0]) return 100; // Exact model/ID match
    }

    // Improved Jaccard Similarity with word normalization
    // Remove common words that don't add meaning
    const stopWords = new Set(['va', 'yoki', 'uchun', 'bilan', 'dan', 'ga', 'ni', 'da', 'de', 'lekin', 'the', 'a', 'an', 'and', 'or', 'for', 'with', 'from', 'to', 'in', 'on', 'at']);
    
    const words1 = t1.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .map(w => w.replace(/[.,!?;:]/g, '')); // Remove punctuation
    
    const words2 = t2.split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .map(w => w.replace(/[.,!?;:]/g, ''));
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    let intersection = 0;
    set1.forEach(word => { 
      if (set2.has(word)) intersection++; 
      // Also check for partial word matches (e.g., "telefon" vs "telefoni")
      else {
        set2.forEach(w2 => {
          if (word.includes(w2) || w2.includes(word)) intersection += 0.5;
        });
      }
    });
    
    const union = new Set([...set1, ...set2]).size;
    const jaccardScore = union === 0 ? 0 : (intersection / union) * 100;
    
    // Boost score if there are multiple matching words
    const matchingWords = Array.from(set1).filter(w => set2.has(w));
    if (matchingWords.length >= 3) {
      return Math.min(jaccardScore * 1.2, 100); // Boost by 20% if 3+ words match
    }
    
    return Math.min(jaccardScore, 100);
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
      
      // More flexible filtering: Check all approved items with opposite status
      // We'll score them all and only create matches for high-scoring ones
      const candidates = await this.arizaModel.find({
        status: targetStatus,
        moderationStatus: 'approved',
        _id: { $ne: newItem._id },
        // Remove strict $or filter - let scoring algorithm decide
      }).lean();
      
      this.logger.debug(`Matching: Found ${candidates.length} candidates for item ${newItem._id}`);

      const matches: Types.ObjectId[] = [];

      for (const candidate of candidates) {
        let score = 0;
        const reasons: string[] = [];
        let hasCategoryMatch = false;
        let hasItemTypeMatch = false;
        let locationScore = 0;

        // 1. CRITICAL: Category MUST match first (30%)
        if (newItem.category && candidate.category && newItem.category === candidate.category) {
            score += 30;
            reasons.push('Kategoriya');
            hasCategoryMatch = true;
        } else {
          // Category mos kelmasa, matching'ni davom ettirmaymiz (juda past ball)
          this.logger.debug(`Skipping candidate ${candidate._id}: Category mismatch (${newItem.category} vs ${candidate.category})`);
          // Continue but with very low score
        }

        // 2. CRITICAL: ItemType MUST match (30%)
        if (newItem.itemType && candidate.itemType && 
            newItem.itemType.toLowerCase().trim() === candidate.itemType.toLowerCase().trim()) {
          score += 30;
          reasons.push('Buyum turi');
          hasItemTypeMatch = true;
        } else if (newItem.itemType && candidate.itemType) {
          // Partial match for itemType (e.g., "iPhone 13" vs "iPhone")
          const typeSim = this.calculateSemanticSimilarity(newItem.itemType, candidate.itemType);
          if (typeSim > 70) {
            score += 20; // Reduced from 25
            reasons.push('Buyum turi (qisman)');
            hasItemTypeMatch = true;
          } else if (typeSim > 50) {
            score += 10;
            hasItemTypeMatch = true;
          }
        }

        // If neither category nor itemType match, skip this candidate (too different)
        if (!hasCategoryMatch && !hasItemTypeMatch) {
          this.logger.debug(`Skipping candidate ${candidate._id}: No category or itemType match`);
          continue; // Skip this candidate entirely
        }

        // 3. HIGH PRIORITY: Location matching (25%)
        // Location is very important - items found/lost in same place are likely matches
        
        // Exact location match (e.g., "bakatoshi pitak moshnasida")
        if (newItem.location && candidate.location) {
          const locationSim = this.calculateSemanticSimilarity(newItem.location, candidate.location);
          if (locationSim > 80) {
            locationScore += 25;
            reasons.push('Joylashuv (to\'liq)');
          } else if (locationSim > 60) {
            locationScore += 15;
            reasons.push('Joylashuv (qisman)');
          } else if (locationSim > 40) {
            locationScore += 8;
          }
        }
        
        // Region match
        if (newItem.region && candidate.region && newItem.region === candidate.region) {
          locationScore += 10;
          reasons.push('Viloyat');
          if (newItem.district && candidate.district && newItem.district === candidate.district) {
            locationScore += 10;
            reasons.push('Tuman');
          }
        }
        
        score += locationScore;

        // 4. Title/Name match (10%)
        if (newItem.itemName && candidate.itemName) {
          const titleSim = this.calculateSemanticSimilarity(newItem.itemName, candidate.itemName);
          if (titleSim > 70) {
            score += 10;
            reasons.push('Nomi');
          } else if (titleSim > 50) {
            score += 5;
          }
        }

        // 5. Description Match (10%)
        const descSim = this.calculateSemanticSimilarity(
          newItem.itemDescription || '', 
          candidate.itemDescription || ''
        );
        
        if (descSim > 80) { 
          score += 10; 
          reasons.push('Tavsif'); 
        } else if (descSim > 50) { 
          score += 5; 
        }
        
        // 6. Time Logic Check (5% - bonus only)
        const dateDiff = Math.abs(new Date(newItem.createdAt).getTime() - new Date(candidate.createdAt).getTime());
        const daysDiff = dateDiff / (1000 * 3600 * 24);
        if (daysDiff <= 7) {
          score += 5;
          reasons.push('Yaqin vaqt');
        }
        
        // 7. Image AI Check (15%) - ONLY if category AND itemType match
        // This prevents matching person photos with car license plates
        if (hasCategoryMatch && hasItemTypeMatch && newItem.image?.url && candidate.image?.url) {
          try {
            const imageScore = await this.compareImages(newItem.image.url, candidate.image.url);
            // Only add image score if it's high enough (images are similar)
            if (imageScore > 70) {
              score += 15;
              reasons.push('Rasm (AI - yuqori)');
            } else if (imageScore > 50) {
              score += 8;
              reasons.push('Rasm (AI - o\'rtacha)');
            } else if (imageScore < 20) {
              // If images are very different, reduce score slightly
              score -= 5;
              this.logger.debug(`Image mismatch detected: ${imageScore}% similarity - reducing score`);
            }
          } catch (error) {
            this.logger.warn(`Image comparison failed: ${error.message}`);
            // Don't penalize if image comparison fails
          }
        }

        // Threshold to be a "Match" - increased to 50% for better quality
        // Require at least category OR itemType match + location match
        const hasLocationMatch = locationScore > 0;
        const minimumRequired = hasCategoryMatch || hasItemTypeMatch;
        
        // Log scores for debugging
        this.logger.debug(`Matching score: ${score}% for item ${candidate._id}`);
        this.logger.debug(`  - Category match: ${hasCategoryMatch}, ItemType match: ${hasItemTypeMatch}, Location match: ${hasLocationMatch}`);
        this.logger.debug(`  - Location score: ${locationScore}`);
        this.logger.debug(`  - Reasons: ${reasons.join(', ') || 'none'}`);
        
        // Require: (Category OR ItemType) AND (Score >= 50 OR (Score >= 40 AND Location match))
        // This ensures we don't match completely unrelated items
        if (minimumRequired && (score >= 50 || (score >= 40 && hasLocationMatch))) {
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
