import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import { ArizaService } from '../ariza/ariza.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from '@googlemaps/google-maps-services-js';
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
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private mapsClient: Client | null = null;
  
  // Message batching: Store pending messages to combine them
  private pendingMessages: Map<string, Array<{ message: any; timestamp: number }>> = new Map();
  private pendingTimeouts: Map<string, NodeJS.Timeout> = new Map(); // Track timeouts to cancel them
  private readonly MESSAGE_BATCH_TIMEOUT_FULL = 5000; // 5 seconds for complete messages
  private readonly MESSAGE_BATCH_TIMEOUT_INCOMPLETE = 15000; // 15 seconds for incomplete messages

  // No longer hardcoded
  // private targetChannels = ['topilmalar_toshkent', 'topilmalar_uz']; 

  constructor(
    private configService: ConfigService,
    private arizaService: ArizaService,
    private cloudinaryService: CloudinaryService,
    @InjectModel(TelegramChannel.name) private channelModel: Model<TelegramChannel>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.logger.debug(`Checking GEMINI_API_KEY: ${apiKey ? 'Found (length: ' + apiKey.length + ')' : 'Not found'}`);
    
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Model name can be configured via env variable.
        // IMPORTANT: model availability is per-project/key. Use `node check-gemini-models.js` to list/test models.
        // Common working models (as of current API):
        // - gemini-2.0-flash
        // - gemini-2.5-flash
        // - gemini-pro-latest
        // - gemini-flash-latest
        const modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
        this.logger.log(`🔧 Attempting to initialize Gemini AI with model: ${modelName}`);
        this.logger.log(`🔑 API Key length: ${apiKey.length}`);
        
        // Try to initialize the model
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        this.logger.log(`✅ Gemini AI model object created: ${modelName}`);
      } catch (error: any) {
        this.logger.error('❌ Failed to initialize Gemini AI. AI analysis will be disabled.', error);
        this.logger.error(`Error message: ${error.message || 'Unknown error'}`);
        this.logger.error(`Error status: ${error.status || 'N/A'}`);
        this.genAI = null;
        this.model = null;
      }
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY not found. AI analysis will be disabled.');
      this.genAI = null;
      this.model = null;
    }

    // Initialize Google Maps API client for geocoding
    const mapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (mapsApiKey) {
      this.mapsClient = new Client({});
      this.logger.log('✅ Google Maps API client initialized');
    } else {
      this.logger.warn('⚠️ GOOGLE_MAPS_API_KEY not found. Location geocoding will use hardcoded coordinates only.');
      this.mapsClient = null;
    }
  }

  async onModuleInit() {
    // Test Gemini AI model if available
    if (this.model && this.genAI) {
      try {
        this.logger.log(`🧪 Testing Gemini AI model with a simple request...`);
        const testResult = await this.model.generateContent('Say "OK"');
        const testResponse = await testResult.response;
        const testText = testResponse.text();
        this.logger.log(`✅ Gemini AI model test successful! Response: ${testText.substring(0, 50)}`);
      } catch (testError: any) {
        this.logger.error(`❌ Gemini AI model test failed: ${testError.message || testError}`);
        this.logger.error(`Error status: ${testError.status || 'N/A'}`);
        this.logger.error(`Error statusText: ${testError.statusText || 'N/A'}`);
        if (testError.message && testError.message.includes('404')) {
          const currentModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
          this.logger.error(`💡 Model "${currentModel}" not found. Try changing GEMINI_MODEL in .env to one of:`);
          this.logger.error(`   - gemini-2.0-flash`);
          this.logger.error(`   - gemini-2.5-flash`);
          this.logger.error(`   - gemini-flash-latest`);
          this.logger.error(`   - gemini-pro-latest`);
          this.logger.error(`Or run: node check-gemini-models.js`);
        }
        this.genAI = null;
        this.model = null;
      }
    }
    
    // Only verify if credentials exist to avoid errors during dev without envs
    const apiId = Number(this.configService.get('TELEGRAM_API_ID'));
    const apiHash = this.configService.get('TELEGRAM_API_HASH');
    const sessionString = this.configService.get('TELEGRAM_SESSION');

    if (!apiId || !apiHash || !sessionString) {
      this.logger.warn('Telegram API credentials or Session missing. Telegram monitor disabled.');
      return; 
    }

    const stringSession = new StringSession(sessionString);

    // Prefer WSS (443) by default because some networks intermittently block/timeout long-lived TCP on port 80.
    // You can override via env: TELEGRAM_USE_WSS=false
    const telegramUseWssRaw = (this.configService.get<string>('TELEGRAM_USE_WSS') || '').trim().toLowerCase();
    const useWSS = telegramUseWssRaw ? telegramUseWssRaw === 'true' : true;
    this.logger.log(`Telegram transport: ${useWSS ? 'WSS/443' : 'TCP/80'}`);

    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      // Keep reconnecting; transient timeouts are common on some ISPs/VPS networks
      connectionRetries: Infinity,
      retryDelay: 5000, // Increased retry delay to 5 seconds
      autoReconnect: true,
      useWSS,
      timeout: 10000, // 10 seconds timeout for connection attempts
      requestRetries: 3, // Retry failed requests up to 3 times
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
        } else if (e.code === 'ETIMEDOUT' || e.message?.includes('ETIMEDOUT')) {
            this.logger.warn('⚠️ Telegram connection timeout. This might be due to:');
            this.logger.warn('   1. Internet connection issues');
            this.logger.warn('   2. Telegram servers being blocked or unreachable');
            this.logger.warn('   3. Firewall or proxy settings');
            this.logger.warn('   The client will keep retrying automatically...');
            // Don't throw - let autoReconnect handle it
        } else {
            this.logger.error('Failed to connect to Telegram:', e);
            this.logger.error('Error code:', e.code);
            this.logger.error('Error message:', e.message);
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

            // Check if this message should be batched with previous messages
            const chatKey = `${chatId}_${chatUsername}`;
            const now = Date.now();
            
            // Add message to pending batch
            if (!this.pendingMessages.has(chatKey)) {
              this.pendingMessages.set(chatKey, []);
            }
            
            const pendingBatch = this.pendingMessages.get(chatKey)!;
            pendingBatch.push({ message, timestamp: now });
            
            // Check if message is complete (has phone number, location, item type)
            const messageText = message.message || '';
            const hasPhone = /(\+?998)?[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(messageText);
            const hasLocation = /(mashina|avtobus|taksi|metro|pitak|moshnasida|do'kon|maktab|bog'|ko'cha|park|chilonzor|yunusobod|olmazor|bakatoshi)/i.test(messageText);
            const hasItemType = /(telefon|karta|pasport|kalit|hamyon|sumka|portfel|mashina|avtobus|velosiped|it|mushuk)/i.test(messageText);
            const isLongMessage = messageText.length > 100;
            
            // Determine if message is complete
            const isComplete = hasPhone && (hasLocation || hasItemType || isLongMessage);
            
            // Cancel existing timeout if any
            if (this.pendingTimeouts.has(chatKey)) {
              clearTimeout(this.pendingTimeouts.get(chatKey)!);
              this.pendingTimeouts.delete(chatKey);
            }
            
            // Set timeout based on message completeness
            const timeout = isComplete 
              ? this.MESSAGE_BATCH_TIMEOUT_FULL  // 5 seconds for complete messages
              : this.MESSAGE_BATCH_TIMEOUT_INCOMPLETE; // 15 seconds for incomplete messages
            
            this.logger.debug(`Message completeness: phone=${hasPhone}, location=${hasLocation}, item=${hasItemType}, timeout=${timeout}ms`);
            
            const timeoutId = setTimeout(async () => {
              const batch = this.pendingMessages.get(chatKey);
              if (!batch || batch.length === 0) return;
              
              // Remove batch and timeout from pending
              this.pendingMessages.delete(chatKey);
              this.pendingTimeouts.delete(chatKey);
              
              // Process all messages in batch as one announcement
              await this.processBatchedMessages(batch, chatTitle, chatUsername);
            }, timeout);
            
            this.pendingTimeouts.set(chatKey, timeoutId);
            
            return; // Don't process immediately, wait for batch timeout 

        } catch (err) {
            this.logger.error('Error processing Telegram message:', err);
        }
    }, new NewMessage({}));
  }

  /**
   * Process multiple messages as a single announcement
   */
  private async processBatchedMessages(
    messages: Array<{ message: any; timestamp: number }>,
    chatTitle: string,
    chatUsername: string
  ) {
    try {
      if (messages.length === 0) return;
      
      this.logger.log(`📦 Processing batch of ${messages.length} messages from ${chatTitle}`);
      
      // Combine all message texts
      const combinedText = messages
        .map(m => m.message.message || '')
        .filter(text => text.trim())
        .join('\n\n');
      
      if (!combinedText.trim()) {
        this.logger.warn('Batch has no text content, skipping');
        return;
      }

      // Try to extract Telegram username/contact from message metadata (forwarded from / sender)
      let telegramContact = '';
      try {
        const firstMessage: any = messages[0]?.message;
        let username: string | undefined;

        // 1) For forwarded messages, GramJS usually exposes fwdFrom
        if (firstMessage?.fwdFrom) {
          const fwd: any = firstMessage.fwdFrom;

          // Sometimes username may be in fromId.username
          if (fwd.fromId && (fwd.fromId as any).username) {
            username = (fwd.fromId as any).username;
          }

          // Or in fromName (we still store it as "telegram" contact even if it's a display name)
          if (!username && typeof fwd.fromName === 'string' && fwd.fromName.trim()) {
            username = fwd.fromName.trim();
          }
        }

        // 2) Fallback: use sender info if available
        if (!username && typeof firstMessage?.getSender === 'function') {
          const sender: any = await firstMessage.getSender();
          if (sender?.username) {
            username = sender.username;
          } else if (sender?.firstName) {
            username = [sender.firstName, sender.lastName].filter(Boolean).join(' ');
          }
        }

        if (username) {
          // If it looks like a real @username (no spaces), prefix with @ if missing.
          if (!username.startsWith('@') && !username.includes(' ')) {
            telegramContact = `@${username}`;
          } else {
            // Full name or already formatted – store as is
            telegramContact = username;
          }
          this.logger.debug(`Extracted Telegram contact from metadata: ${telegramContact}`);
        }

        // 3) Final fallback: use channel username as contact (har bir kanalda admin o'zi e'lon tashlasa)
        if (!telegramContact && chatUsername) {
          telegramContact = chatUsername.startsWith('@') ? chatUsername : `@${chatUsername}`;
          this.logger.debug(`Falling back to channel username as contact: ${telegramContact}`);
        }
      } catch (metaErr) {
        this.logger.warn('Failed to extract Telegram username from message metadata', metaErr);
      }
      
      // Get images from all messages (use first image found)
      let buffer: Buffer | null = null;
      let imageObj: any = null;
      
      for (const { message } of messages) {
        if (message.media && !buffer) {
          try {
            const downloaded = await this.client.downloadMedia(message, {});
            if (downloaded) {
              buffer = downloaded as Buffer;
              break; // Use first image found
            }
          } catch (err) {
            this.logger.warn('Failed to download media from batch message', err);
          }
        }
      }
      
      // Upload image if exists
      if (buffer) {
        try {
          const uploadResult = await this.cloudinaryService.uploadBuffer(buffer);
          imageObj = {
            url: uploadResult.url,
            publicId: uploadResult.public_id
          };
          this.logger.debug('Image uploaded to Cloudinary: ' + imageObj.url);
        } catch (uploadErr) {
          this.logger.error('Failed to upload image to Cloudinary', uploadErr);
        }
      }
      
      // Process combined text with AI
      const extractedData = await this.analyzeContent(combinedText, buffer || undefined);
      if (!extractedData) {
        this.logger.warn('AI analysis returned no data for batch');
        return;
      }
      
      // Improve coordinates
      const regionCoords = await this.getRegionCoordinates(
        extractedData.region,
        extractedData.district,
        extractedData.location
      );
      
      // Transliterate fields
      const safeItemType = this.transliterateCyrillicToLatin(extractedData.itemType);
      const safeDescription = this.transliterateCyrillicToLatin(extractedData.description || combinedText);
      const safeTitle = this.transliterateCyrillicToLatin(extractedData.itemType || 'Noma\'lum buyum');
      const safeRegion = this.transliterateCyrillicToLatin(extractedData.region);
      const safeDistrict = this.transliterateCyrillicToLatin(extractedData.district);
      const safeLocation = this.transliterateCyrillicToLatin(extractedData.location);
      
      // Normalize category
      const normalizedCategory = normalizeCategory(extractedData.category);
      
      // Map AI result to DTO
      const arizaData = {
        title: safeTitle,
        itemType: safeItemType,
        description: safeDescription,
        itemDescription: safeDescription,
        status: extractedData.status || 'found',
        category: normalizedCategory,
        region: safeRegion || 'Toshkent',
        district: safeDistrict || 'Boshqa',
        location: safeLocation || 'Toshkent',
        date: new Date().toISOString().split('T')[0],
        phone: Array.isArray(extractedData.phone) ? extractedData.phone.join(', ') : (extractedData.phone || ''),
        telegram: telegramContact,
        image: imageObj,
        coordinates: regionCoords
      };
      
      this.logger.log(`Saving batched announcement from Telegram: ${arizaData.title}`);
      console.log("---- TELEGRAM BATCHED ITEM SAVED ----");
      console.log(`Combined ${messages.length} messages into one announcement`);
      console.log(arizaData);
      console.log("--------------------------------------");
      
      // Find an admin to assign this to
      const adminUser = await this.userModel.findOne({ role: 'admin' });
      if (adminUser) {
        await this.arizaService.create(adminUser._id.toString(), arizaData, undefined);
        this.logger.log(`Batched item successfully saved to DB for admin: ${adminUser.name}`);
      } else {
        this.logger.warn('No admin user found to assign Telegram batch to.');
      }
    } catch (err) {
      this.logger.error('Error processing batched messages:', err);
    }
  }

  private async analyzeContent(text: string, imageBuffer?: Buffer): Promise<any> {
    // If Gemini AI is not available, return basic extracted data from text
    if (!this.model || !this.genAI) {
      this.logger.warn('Gemini AI not available. Using basic text extraction.');
      return this.extractBasicData(text);
    }

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
        - region: Region name in Uzbekistan (Infer from image landmarks or text). If not found, use "Unknown".
        - district: District name. If not found, use "Unknown".
        - location: EXTRACT THE EXACT LOCATION MENTIONED IN THE TEXT. This includes:
          * Specific places mentioned (e.g., "bakatoshi pitak moshnasida", "Chilonzor metro", "Yunusobod 5-mavze", "Park", "Mashina", "Avtobus", "Taksi")
          * Transportation types (e.g., "mashina", "avtobus", "taksi", "metro")
          * Buildings or landmarks (e.g., "do'kon", "maktab", "bog'", "ko'cha")
          * If location is mentioned in text, extract it EXACTLY as written. DO NOT use "Unknown" if location is clearly mentioned.
          * Only use "Unknown" if NO location information is present in the text.
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
        const parsed = JSON.parse(jsonText);
        this.logger.log(`✅ AI Analysis successful: ${JSON.stringify(parsed).substring(0, 100)}...`);
        return parsed;
    } catch (e: any) {
        this.logger.error('❌ AI Analysis failed', e);
        this.logger.error(`Error details: ${e.message || 'Unknown error'}`);
        this.logger.error(`Error status: ${e.status || 'N/A'}`);
        this.logger.error(`Error statusText: ${e.statusText || 'N/A'}`);
        if (e.message && e.message.includes('404')) {
          this.logger.error(
            `⚠️ Model not found. Current model: ${this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash'}`,
          );
          this.logger.error(
            '💡 Try changing GEMINI_MODEL to: gemini-2.0-flash / gemini-2.5-flash / gemini-flash-latest / gemini-pro-latest',
          );
          this.logger.error('💡 Or run: node check-gemini-models.js');
        }
        // Fallback to basic extraction if AI fails
        return this.extractBasicData(text);
    }
  }

  /**
   * Basic text extraction without AI - fallback method
   */
  private extractBasicData(text: string): any {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    
    // Detect status
    let status = 'found';
    if (lowerText.includes('yo\'qaldi') || lowerText.includes('yoqaldi') || lowerText.includes('lost') || lowerText.includes('изчез')) {
      status = 'lost';
    } else if (lowerText.includes('topildi') || lowerText.includes('topib') || lowerText.includes('found') || lowerText.includes('найден')) {
      status = 'found';
    }

    // Extract phone number (Uzbek format: +998XXXXXXXXX or 998XXXXXXXXX)
    const phoneMatch = text.match(/(\+?998)?[\s-]?(\d{2})[\s-]?(\d{3})[\s-]?(\d{2})[\s-]?(\d{2})/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : '';

    // Try to extract region (basic keywords)
    let region = 'Unknown';
    const regions = ['toshkent', 'andijon', 'buxoro', 'farg\'ona', 'jizzax', 'xorazm', 
                     'namangan', 'navoiy', 'qashqadaryo', 'samarqand', 'sirdaryo', 
                     'surxondaryo', 'qoraqalpog\'iston'];
    for (const reg of regions) {
      if (lowerText.includes(reg)) {
        region = reg.charAt(0).toUpperCase() + reg.slice(1);
        break;
      }
    }

    // Extract location from text - look for common location patterns
    let location = 'Unknown';
    const locationPatterns = [
      /(?:tushib|qolib|topilgan|yo'qolgan).*?(?:mashina|avtobus|taksi|metro|pitak|moshnasida|do'kon|maktab|bog'|ko'cha|park|restoran|kafe|bazar|bozor)/i,
      /(?:mashina|avtobus|taksi|metro|pitak|moshnasida|do'kon|maktab|bog'|ko'cha|park|restoran|kafe|bazar|bozor).*?(?:da|da|ida|ida)/i,
      /(?:bakatoshi|chilonzor|yunusobod|olmazor|mirzo|shayxontohur|yakkasaroy|sergeli|uchtepa|bekobod|angren|chirchiq)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        location = match[0].trim();
        break;
      }
    }
    
    // If no pattern matched, try to find location keywords
    if (location === 'Unknown') {
      const locationKeywords = ['mashina', 'avtobus', 'taksi', 'metro', 'pitak', 'moshnasida', 
                                'do\'kon', 'maktab', 'bog\'', 'ko\'cha', 'park', 'restoran', 
                                'kafe', 'bazar', 'bozor', 'bakatoshi', 'chilonzor', 'yunusobod'];
      for (const keyword of locationKeywords) {
        if (lowerText.includes(keyword)) {
          // Extract the phrase containing the keyword
          const keywordIndex = lowerText.indexOf(keyword);
          const start = Math.max(0, keywordIndex - 20);
          const end = Math.min(lowerText.length, keywordIndex + keyword.length + 20);
          location = text.substring(start, end).trim();
          break;
        }
      }
    }

    // Basic category detection (simple keyword matching)
    let category = 'tech';
    if (lowerText.match(/\b(pasport|guvohnoma|prava|metrika|karta|sertifikat)\b/i)) category = 'docs';
    else if (lowerText.match(/\b(kalit|key)\b/i)) category = 'keys';
    else if (lowerText.match(/\b(hamyon|sumka|portfel|pul|money)\b/i)) category = 'wallet';
    else if (lowerText.match(/\b(mushuk|it|qush|hayvon|pet)\b/i)) category = 'pets';
    else if (lowerText.match(/\b(ko\'ylak|shim|ko\'zoynak|kiyim)\b/i)) category = 'clothing';
    else if (lowerText.match(/\b(velosiped|skuter|mashina|transport)\b/i)) category = 'vehicle';
    else if (lowerText.match(/\b(telefon|smartphone|noutbuk|kompyuter|tablet)\b/i)) category = 'tech';

    return {
      status,
      itemType: text.split('\n')[0].substring(0, 50) || 'Noma\'lum buyum',
      category,
      description: text.substring(0, 500),
      region,
      district: 'Unknown',
      location: location, // Use extracted location, not region
      phone
    };
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

  private async getRegionCoordinates(region: string, district?: string, location?: string): Promise<{ lat: number, lng: number }> {
    // First, try to match specific locations in Tashkent (hardcoded)
    if (location) {
      const locationLower = location.toLowerCase();
      const tashkentLocations: Record<string, { lat: number, lng: number }> = {
        'bakatoshi pitak': { lat: 41.2800, lng: 69.2400 },
        'bakatoshi': { lat: 41.2800, lng: 69.2400 },
        'pitak': { lat: 41.2800, lng: 69.2400 },
        'pitak moshnasida': { lat: 41.2800, lng: 69.2400 },
        'chilonzor': { lat: 41.2800, lng: 69.2000 },
        'yunusobod': { lat: 41.3500, lng: 69.2800 },
        'olmazor': { lat: 41.3200, lng: 69.2500 },
        'mirzo ulug\'bek': { lat: 41.3100, lng: 69.2300 },
        'shayxontohur': { lat: 41.2900, lng: 69.2200 },
        'yakkasaroy': { lat: 41.3000, lng: 69.2400 },
        'sergeli': { lat: 41.2700, lng: 69.1800 },
        'uchtepa': { lat: 41.2600, lng: 69.2000 },
        'bekobod': { lat: 40.2200, lng: 69.2200 },
        'angren': { lat: 41.0200, lng: 70.1400 },
        'chirchiq': { lat: 41.4700, lng: 69.5800 },
      };

      for (const key in tashkentLocations) {
        if (locationLower.includes(key)) {
          this.logger.debug(`Found specific location: ${key} -> ${JSON.stringify(tashkentLocations[key])}`);
          return tashkentLocations[key];
        }
      }

      // If not found in hardcoded list, try Google Geocoding API
      if (this.mapsClient) {
        try {
          const mapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
          const searchQuery = `${location}, ${region || 'Tashkent'}, Uzbekistan`;
          this.logger.debug(`🔍 Searching Google Geocoding API for: ${searchQuery}`);
          
          const response = await this.mapsClient.geocode({
            params: {
              address: searchQuery,
              key: mapsApiKey!,
              language: 'uz',
            },
          });

          if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const coords = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            };
            this.logger.log(`✅ Found coordinates via Google Geocoding API: ${JSON.stringify(coords)} for "${location}"`);
            return coords;
          }
        } catch (error: any) {
          this.logger.warn(`⚠️ Google Geocoding API failed: ${error.message || error}`);
        }
      }
    }

    // If region is missing, unknown, or empty, return null coordinates (will be handled by frontend)
    if (!region || region.toLowerCase() === 'unknown' || region.trim() === '') {
      this.logger.debug(`Region is unknown or empty. Returning null coordinates.`);
      return { lat: 0, lng: 0 }; // Null coordinates - frontend can handle this
    }

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

    // If region doesn't match any known region, return null coordinates
    this.logger.debug(`Region "${region}" not found in coordinates map. Returning null coordinates.`);
    return { lat: 0, lng: 0 }; // Null coordinates - frontend can handle this
  }
}
