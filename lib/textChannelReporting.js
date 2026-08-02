import fs from 'fs';
import { createHmac } from 'node:crypto';

const psuedoUser = (id) => {
    return createHmac('sha256', process.env.USER_HASH_KEY).update(id).digest('hex').slice(0, 16);
}

export const updateTextChannelReport = async (message) => {
    const messageDateObj = new Date(message.createdTimestamp).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }); // 8/2/2026, 12:29:59 PM
    const date = messageDateObj.split(', ')[0];
    const usage = JSON.parse(await fs.readFileSync('./channelUsageReport.json', 'utf8'));
    const hashedUserId = psuedoUser(newState.id);

    // first thing to do is find any membersActive objects that arent numbers, from days NOT today, and turn them into numbers.
    const needsCleared = Object.values(usage.textChannels).flatMap(x => x.data).filter(y => typeof(y.membersActive) == 'object' && y.date !== date);
    needsCleared.forEach(t => { t.membersActive = t.membersActive.size || t.membersActive.length || 0 });
    
    // initiate the data object for this channel
    if (!Object.keys(usage.textChannels).find(x => x === message.channelId)?.length) {

        usage.textChannels[message.channelId] = {
            name: message.channel.name,
            data: [{
                date: date,
                messagesSent: 0,
                membersActive: new Set(), // temporarily write the (now hashed) user IDs so we can get a truly unique count
                // this will get dumped and replaced with an actual count the next day.
            }]
        }
    }

    // add this message to the data
    if (!usage.textChannels[message.channelId].data.filter(x => x.date === date)[0]) {
        usage.textChannels[message.channelId].data.push({ date: date, messagesSent: 0, membersActive: new Set() });
    }
    
    const todaysData = usage.textChannels[message.channelId].data.filter(x => x.date === date)[0];
    todaysData.messagesSent++;
    todaysData.membersActive = new Set(todaysData.membersActive)
    todaysData.membersActive.add(psuedoUser(message.author.id));

    fs.writeFileSync('./channelUsageReport.json', JSON.stringify(usage, (key, value) => value instanceof Set ? [...value] : value));
}