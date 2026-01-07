
import mongoose, { Schema } from 'mongoose';
import * as fs from 'fs';

// Define Schemas (Simplified)
const userSchema = new Schema({ name: String }, { strict: false });
const arizaSchema = new Schema({ 
    user: Schema.Types.ObjectId, 
    matchedUser: Schema.Types.ObjectId,
    status: String,
    moderationStatus: String,
    itemType: String,
    itemDescription: String,
    confirmedByFinder: Boolean,
    confirmedByLoser: Boolean,
    createdAt: Date
}, { strict: false });

async function run() {
    const uri = 'mongodb://127.0.0.1:27017/lostfound';
    console.log(`Connecting to ${uri}...`);
    
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const User = mongoose.model('User', userSchema);
        const Ariza = mongoose.model('Ariza', arizaSchema);

        const targetNames = ['Asrormuhammad', 'Kitobdosh'];
        const users = await User.find({ 
            name: { $in: targetNames.map(n => new RegExp(n, 'i')) } 
        });

        const fullResults = [];

        for (const u of users) {
            const docs = await Ariza.find({
                $or: [{ user: u._id }, { matchedUser: u._id }]
            });
            
            let foundCount = 0;
            let lostCount = 0;
            let returnedToMe = 0;
            let returnedByMe = 0;
            let inProcess = 0;

            const items = docs.map(d => {
                 const isOwner = d.user?.toString() === u._id.toString();
                 const isMatched = d.matchedUser?.toString() === u._id.toString();

                 // Stats Logic
                 if (isOwner && d.status === 'found') foundCount++;
                 if (isOwner && d.status === 'lost') lostCount++;

                 if ((isOwner && d.status === 'lost' && d.moderationStatus === 'returned') ||
                     (isMatched && d.status === 'found' && d.moderationStatus === 'returned')) {
                     returnedToMe++;
                 }

                 if ((isOwner && d.status === 'found' && d.moderationStatus === 'returned') ||
                     (isMatched && d.status === 'lost' && d.moderationStatus === 'returned')) {
                     returnedByMe++;
                 }

                 if ((isOwner && d.matchedUser && d.moderationStatus !== 'returned') ||
                     (isMatched && d.moderationStatus !== 'returned')) {
                     inProcess++;
                 }

                 return {
                     id: d._id,
                     isOwner,
                     isMatched,
                     status: d.status,
                     modStatus: d.moderationStatus,
                     type: d.itemType,
                     matchedUserId: d.matchedUser,
                     confirmedByFinder: d.confirmedByFinder,
                     confirmedByLoser: d.confirmedByLoser
                 };
            });

            fullResults.push({
                user: u.name,
                id: u._id,
                calculatedStats: {
                    foundCount,
                    lostCount,
                    returnedToMe,
                    returnedByMe,
                    inProcess
                },
                items
            });
        }

        fs.writeFileSync('src/scripts/debug-result.json', JSON.stringify(fullResults, null, 2));
        console.log('Successfully wrote src/scripts/debug-result.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();

