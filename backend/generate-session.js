const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(''); 

(async () => {
    console.log(`Initializing GramJS with API_ID: ${apiId}...`);
    
    if (!apiId || !apiHash) {
        console.error('Error: TELEGRAM_API_ID or TELEGRAM_API_HASH is missing in .env');
        return;
    }

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    console.log('Connecting...');
    await client.connect();

    try {
        console.log('Generating QR Code... Please wait.');
        
        // Correct usage for GramJS signInUserWithQrCode
        const user = await client.signInUserWithQrCode(
            { 
                apiId: apiId, 
                apiHash: apiHash 
            }, 
            { 
                qrCode: async (code) => {
                    console.log('\nScan this QR code with your Telegram App:');
                    console.log('Open Telegram -> Settings -> Devices -> Link Desktop Device\n');
                    qrcode.generate(`tg://login?token=${code.token.toString('base64')}`, { small: true });
                },
                onError: (err) => {
                    console.log('QR Code Error:', err);
                    // If QR fails, fallback to simple error log (no token needed here)
                    return true; 
                }
            }
        );

        console.log('\nSuccessfully connected as:', user.username || user.firstName);
        console.log('----------------------------------------------------');
        console.log('Save this string to your TELEGRAM_SESSION in .env file:');
        console.log('----------------------------------------------------');
        console.log(client.session.save());
        console.log('----------------------------------------------------');
    } catch (e) {
        console.error('Login failed:', e);
    } finally {
        await client.disconnect();
    }
})();
