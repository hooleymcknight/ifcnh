const { psuedoUser, readUsage, writeUsage } = require('./usageStore.js');

/**
 * Records one message against today's per-channel counts.
 *
 * Active members are held as a Set of hashed IDs for the current day so the
 * count stays unique, then collapsed to a plain number once the day rolls
 * over — the IDs themselves are never kept longer than they're needed.
 *
 * @param {import('discord.js').Message} message - The message that fired.
 */
const updateTextChannelReport = async (message) => {
    const messageDateObj = new Date(message.createdTimestamp).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
    }); // 8/2/2026, 12:29:59 PM
    const date = messageDateObj.split(', ')[0];
    const usage = readUsage();
    const hashedUserId = psuedoUser(message.author.id);

    // first thing to do is find any membersActive objects that arent numbers, from days NOT today, and turn them into numbers.
    const needsCleared = Object.values(usage.textChannels)
        .flatMap((x) => x.data)
        .filter((y) => typeof y.membersActive === 'object' && y.date !== date);
    needsCleared.forEach((t) => {
        t.membersActive = t.membersActive.size || t.membersActive.length || 0;
    });

    // initiate the data object for this channel
    if (!usage.textChannels[message.channelId]) {
        usage.textChannels[message.channelId] = {
            name: message.channel.name,
            data: [],
        };
    }

    // add this message to the data
    const channelData = usage.textChannels[message.channelId].data;
    if (!channelData.find((x) => x.date === date)) {
        channelData.push({
            date: date,
            messagesSent: 0,
            membersActive: new Set(), // temporarily write the (now hashed) user IDs so we can get a truly unique count
            // this will get dumped and replaced with an actual count the next day.
        });
    }

    const todaysData = channelData.find((x) => x.date === date);
    todaysData.messagesSent++;
    todaysData.membersActive = new Set(todaysData.membersActive);
    todaysData.membersActive.add(hashedUserId);

    writeUsage(usage);
};

module.exports = { updateTextChannelReport };
