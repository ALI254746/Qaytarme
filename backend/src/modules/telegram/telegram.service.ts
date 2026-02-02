import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { ArizaService } from '../ariza/ariza.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TelegramChannel } from '../../schemas/telegram-channel.schema';
import { User } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeCategory } from '../../utils/category.util';
// import input from 'input'; // Note: input requires interactive terminal, might be tricky in backend auto-start. 
// Ideally session string should be provided via ENV if already generated, or we generate it once locally.

@Injectable()
export class TelegramService implements OnModuleInit {
  private client: TelegramClient;
  private readonly logger = new Logger(TelegramService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  // No longer hardcoded
  // private targetChannels = ['topilmalar_toshkent', 'topilmalar_uz']; 

  constructor(
    private configService: ConfigService,
    private arizaService: ArizaService,
    private cloudinaryService: CloudinaryService,
    @InjectModel(TelegramChannel.name) private channelModel: Model<TelegramChannel>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.genAI = new GoogleGenerativeAI(this.configService.get<string>('GEMINI_API_KEY') || '');
    // Using gemini-1.5-flash as gemini-2.0-flash-exp is not available
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async onModuleInit() {
    // Only verify if credentials exist to avoid errors during dev without envs
    const apiId = Number(this.configService.get('TELEGRAM_API_ID'));
    const apiHash = this.configService.get('TELEGRAM_API_HASH');
    const sessionString = this.configService.get('TELEGRAM_SESSION');

    if (!apiId || !apiHash || !sessionString) {
      this.logger.warn('Telegram API credentials or Session missing. Telegram monitor disabled.');
      return; 
    }

    const stringSession = new StringSession(sessionString);

    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    // Note: Interactive login is hard on server. Best practice: Generate session string locally and put in ENV.
    // For now, we assume session string is valid or we just try to connect.
    try {
        await this.client.connect();
        
        // If not authorized (session invalid or empty), we can't do interactive login here easily without blocking boot.
        // We will just log a warning.
        if (!await this.client.checkAuthorization()) {
            this.logger.error('Telegram Client not authorized! Please generate a session string and add it to TELEGRAM_SESSION in .env');
            return;
        }

        this.logger.log('Telegram Client Connected!');
        await this.joinChannels(); // Auto-join channels from DB
        this.startListening();

    } catch (e: any) {
        // Handle AUTH_KEY_DUPLICATED error specifically
        if (e.code === 406 && e.errorMessage === 'AUTH_KEY_DUPLICATED') {
            this.logger.error('Telegram AUTH_KEY_DUPLICATED: Session key is being used elsewhere.');
            this.logger.error('Please generate a new session string using: node generate-session.js');
            this.logger.error('Or check if another instance is using the same session.');
            this.logger.warn('Telegram service disabled. Please update TELEGRAM_SESSION in .env with a new session.');
        } else {
            this.logger.error('Failed to connect to Telegram:', e);
        }
    }
  }

  private async joinChannels() {
      try {
          const activeChannels = await this.channelModel.find({ isActive: true });
          this.logger.log(`Checking membership for ${activeChannels.length} channels...`);

          for (const channel of activeChannels) {
              if (!channel.username) continue;
              const username = channel.username.replace('@', '');
              
              try {
                  // Resolve the username to an entity first (safest way)
                  const entity = await this.client.getEntity(username);
                  
                  await this.client.invoke(new Api.channels.JoinChannel({
                      channel: entity
                  }));
                  this.logger.log(`Successfully joined/verified channel: ${username}`);
              } catch (err) {
                  // User already participant error or other benign errors can be ignored
                  if (err.message && err.message.includes('USER_ALREADY_PARTICIPANT')) {
                       // already joined, good
                  } else {
                      this.logger.warn(`Could not join channel ${username}: ${err.message}`);
                  }
              }
          }
      } catch (e) {
          this.logger.error('Error in joinChannels', e);
      }
  }

  private startListening() {
    this.client.addEventHandler(async (event: any) => {
        try {
            const message = event.message;
            if (!message || !message.message) return;

            // Check if message is from observed channels
            // For simplicity, we process all messages for now or filter by chatID if we had them.
            // Getting sender info:
            const chat = await message.getChat();
            
            // Log everything to see what is happening
            const chatUsername = chat?.username;
            const chatTitle = chat?.title;
            const chatId = chat?.id;

            console.log(`[MSG] From: ${chatTitle} | @${chatUsername} | ID: ${chatId}`);

            // Fetch active channels from DB
            const activeChannels = await this.channelModel.find({ isActive: true });
            
            // STRICTLY use only channels from Admin Panel (Database)
            const targetUsernames = activeChannels
                .map(c => c.username?.replace(/^@/, '')) 
                .map(u => u?.toLowerCase())
                .filter(Boolean);

            // console.log(`Target Channels: ${targetUsernames.join(', ')}`);

            // Check match
            const isMatch = chatUsername && targetUsernames.includes(chatUsername.toLowerCase());

            if (!isMatch) {
                // Uncomment to see ignored messages noise
                // console.log(`Ignoring message from: ${chatTitle} (@${chatUsername})`);
                return;
            }

            // Handle Private Messages /start
            if (message.isPrivate && message.message?.startsWith('/start')) {
                const sender = await message.getSender();
                this.logger.log(`Received /start from user: ${sender?.id}`);
                
                const clientUrl = this.configService.get('CLIENT_URL') || 'https://qaytarme.uz';
                const webAppUrl = `${clientUrl}/mobile/add`;

                await this.client.sendMessage(sender, {
                    message: "Assalomu alaykum! Topilmalar va yo'qolgan narsalar bo'yicha yagona tizimga xush kelibsiz.\n\nE'lon berish uchun quyidagi tugmani bosing:",
                    buttons: new Api.ReplyKeyboardMarkup({
                        rows: [
                            new Api.KeyboardButtonRow({
                                buttons: [
                                    new Api.KeyboardButtonWebView({
                                        text: "📢 E'lon qo'shish",
                                        url: webAppUrl
                                    })
                                ]
                            })
                        ],
                        resize: true,
                        persistent: true
                    })
                });
                return;
            }

            this.logger.log(`>> PROCESSING VALID MESSAGE FROM: ${chatTitle} (@${chatUsername})`);

            // 1. Download Media FIRST (for Vision AI)
            let buffer: Buffer | null = null;
            let imageObj: any = null;

            if (message.media) {
                 const downloaded = await this.client.downloadMedia(message, {});
                 if (downloaded) {
                    buffer = downloaded as Buffer;
                 }
            }

            // 2. Process with AI (Multimodal)
            // Now we pass the buffer too so AI can "see" the image if text is insufficient
            const extractedData = await this.analyzeContent(message.message, buffer || undefined);
            if (!extractedData) return; // Not a relevant ad

            // 3. Upload to Cloudinary if buffer exists
            if (buffer) {
                 try {
                    const uploadResult = await this.cloudinaryService.uploadBuffer(buffer);
                    imageObj = {
                        url: uploadResult.url, // or secure_url
                        publicId: uploadResult.public_id
                    };
                    this.logger.debug('Image uploaded to Cloudinary: ' + imageObj.url);
                 } catch (uploadErr) {
                    this.logger.error('Failed to upload image to Cloudinary', uploadErr);
                 }
            }

            // 3. Save to DB
            
            // Improve coordinates based on region/district
            const regionCoords = this.getRegionCoordinates(extractedData.region, extractedData.district);

            // Transliterate fields
            const safeItemType = this.transliterateCyrillicToLatin(extractedData.itemType);
            const safeDescription = this.transliterateCyrillicToLatin(extractedData.description || message.message);
            const safeTitle = this.transliterateCyrillicToLatin(extractedData.itemType || 'Noma\'lum buyum');
            const safeRegion = this.transliterateCyrillicToLatin(extractedData.region);
            const safeDistrict = this.transliterateCyrillicToLatin(extractedData.district);
            const safeLocation = this.transliterateCyrillicToLatin(extractedData.location);

            // Normalize category to match the 14 valid categories
            const normalizedCategory = normalizeCategory(extractedData.category);

            // Map AI result to DTO
            const arizaData = {
                title: safeTitle,
                itemType: safeItemType,
                description: safeDescription,
                itemDescription: safeDescription,
                status: extractedData.status || 'found', // lost or found
                category: normalizedCategory, // Normalized to one of 14 valid categories
                region: safeRegion || 'Toshkent',
                district: safeDistrict || 'Boshqa',
                location: safeLocation || 'Toshkent',
                date: new Date().toISOString().split('T')[0],
                phone: Array.isArray(extractedData.phone) ? extractedData.phone.join(', ') : (extractedData.phone || ''),
                telegram: '', 
                image: imageObj, // Pass object { url, publicId } instead of string
                coordinates: regionCoords // Use smarter coords
            };

            this.logger.log(`Saving new item from Telegram: ${arizaData.title}`);
            console.log("---- TELEGRAM ITEM SAVED ----");
            console.log(arizaData);
            console.log("-----------------------------");

            // Find an admin to assign this to
            const adminUser = await this.userModel.findOne({ role: 'admin' });
            if (adminUser) {
               await this.arizaService.create(adminUser._id.toString(), arizaData, undefined); 
               this.logger.log(`Item successfully saved to DB for admin: ${adminUser.name}`);
            } else {
               this.logger.warn('No admin user found to assign Telegram item to.');
            } 

        } catch (err) {
            this.logger.error('Error processing Telegram message:', err);
        }
    }, new NewMessage({}));
  }

  private async analyzeContent(text: string, imageBuffer?: Buffer): Promise<any> {
    try {
        const prompt = `
        Analyze the following text AND IMAGE (if provided) which is an advertisement for a lost or found item.
        If the text is short or missing details (like location, color, type), LOOK AT THE IMAGE to extract them.
        
        Extract the following fields in JSON format:
        - status: "lost" or "found" (detect from context like "yo'qaldi", "topib olindi")
        - itemType: Short name of the item. IF NOT IN TEXT, IDENTIFY IT FROM THE IMAGE (e.g., "iPhone 13", "Pasport", "Kalit"). Keep it in Uzbek.
        - category: STRICTLY choose one from this EXACT list (use lowercase, no spaces):
            * tech (Telefon, smartphone, noutbuk, kompyuter, tablet, maishiy texnika, elektronika)
            * pets (Hayvonlar: mushuk, it, qush, baliq va boshqa uy hayvonlari)
            * keys (Kalitlar: uy kaliti, mashina kaliti, ofis kaliti)
            * wallet (Hamyon, sumka, portfel, karta, pul)
            * docs (Hujjatlar: pasport, guvohnoma, prava, metrika, kartalar, sertifikat)
            * clothing (Kiyim-kechak: ko'ylak, shim, ko'zoynak, oyoq kiyim)
            * jewelry (Zargarlik buyumlari: uzuk, zirak, soat, marjon, qo'shquloq)
            * vehicle (Transport: velosiped, skuter, mototsikl, mashina ehtiyot qismlari)
            * home (Uy-ro'zg'or buyumlari: mebel, idish-tovoq, uy jihozlari)
            * sports (Sport anjomlari: to'p, raketka, sport kiyimlari, sport uskunalari)
            * toys (O'yinchoqlar: qog'oz o'yinchoqlar, robotlar, lolipoplar)
            * books (Kitoblar: kitob, daftar, jurnal, qo'llanma)
            * tools (Asbob-uskunalar: bolg'a, o'roq, qaychi, boshqa asboblar)
            * food (Oziq-ovqat: ovqat, ichimlik, mahsulotlar)
        
        IMPORTANT: 
        - category MUST be exactly one of the 14 values above (lowercase, no spaces)
        - If item doesn't fit any category, choose the closest match
        - DO NOT use "other" or any other value not in the list
        
        - description: Use the original text if it describes the situation or item. ONLY generate a description from the image if the text is completely missing or just says "Found" or "Lost".
        - region: Region name in Uzbekistan (Infer from image landmarks or text)
        - district: District name
        - location: General location string. If not in text, try to guess from image background (e.g. "Park", "School").
        - phone: Contact phone number if present

        Text: "${text}"
        
        Respond ONLY with valid JSON.
        `;

        const parts: any[] = [prompt];
        if (imageBuffer) {
            parts.push({
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            });
        }

        const result = await this.model.generateContent(parts);
        const response = await result.response;
        const jsonText = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (e) {
        this.logger.error('AI Analysis failed', e);
        return null;
    }
  }

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

  private getRegionCoordinates(region: string, district?: string): { lat: number, lng: number } {
    const coordsMap: Record<string, { lat: number, lng: number }> = {
        'Toshkent': { lat: 41.2995, lng: 69.2401 },
        'Andijon': { lat: 40.7821, lng: 72.3442 },
        'Buxoro': { lat: 39.7747, lng: 64.4286 },
        'Farg\'ona': { lat: 40.3842, lng: 71.7843 },
        'Jizzax': { lat: 40.1158, lng: 67.8422 },
        'Xorazm': { lat: 41.3565, lng: 60.8567 },
        'Namangan': { lat: 40.9983, lng: 71.6726 },
        'Navoiy': { lat: 40.1031, lng: 65.3739 },
        'Qashqadaryo': { lat: 38.8986, lng: 65.7842 }, // Qarshi
        'Samarqand': { lat: 39.6793, lng: 66.9750 },
        'Sirdaryo': { lat: 40.4982, lng: 68.7754 }, // Guliston
        'Surxondaryo': { lat: 37.2284, lng: 67.2752 }, // Termiz
        'Surxandaryo': { lat: 37.2284, lng: 67.2752 }, // Alternative spelling
        'Qoraqalpog\'iston': { lat: 42.4602, lng: 59.6166 } // Nukus
    };

    // Normalize region string to match keys
    for (const key in coordsMap) {
        if (region && region.toLowerCase().includes(key.toLowerCase())) {
            return coordsMap[key];
        }
    }

    return { lat: 41.2995, lng: 69.2401 }; // Default to Tashkent
  }
}
