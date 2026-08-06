const { psuedoUser, readUsage, writeUsage } = require('./usageStore.js');

/**
 * Records voice joins and leaves as sessions.
 *
 * Voice state arrives as a delta, not a duration: a move between channels
 * fires both halves of this function, which is intended. A session stays open
 * until its last participant leaves.
 *
 * @param {import('discord.js').VoiceState} oldState - State before the change.
 * @param {import('discord.js').VoiceState} newState - State after the change.
 */
const updateVoiceChatReport = async (oldState, newState) => {
    const usage = readUsage();
    const hashedUserId = psuedoUser(newState.id);
    const rn = new Date();
    const dateObj = rn.toISOString(); // complete with Z's and T's
    const dateTime = rn.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }); // 8/2/2026, 12:29:59 PM

    /**
     * when you join a chat
     * regardless of where you're coming from
     */
    if (newState.channelId) {
        console.log('user joined a chat');

        // first look and see if there's already an open session for this chat
        if (!usage.voiceChats[newState.channelId]) {
            usage.voiceChats[newState.channelId] = [];
        }
        const vcUsageObj = usage.voiceChats[newState.channelId];

        // if there are no open sessions, create that now
        if (!vcUsageObj.find((x) => x.endTime === null)) {
            // generate a sessionId --> discord.js's isnt a real sessionId for the chat
            const sessionId = `${dateObj}.${newState.channelId}`;
            // startTime is dateTime, endTime is null, users is an empty array
            vcUsageObj.push({
                sessionId: sessionId,
                startTime: dateTime,
                endTime: null,
                users: [],
            });
        }

        // add the user that just joined.
        // if they are rejoining, still count it-- you'll get a cumulative time later when you pull a report
        vcUsageObj.find((x) => x.endTime === null).users.push({
            user: hashedUserId,
            startTime: dateTime,
            endTime: null,
        });
    }

    /**
     * when leaving a chat
     * regardless of where you're going (to another chat or out)
     */
    if (oldState.channelId) {
        console.log('user left a chat');
        const vcUsageObj = usage.voiceChats[oldState.channelId];

        if (!vcUsageObj) {
            console.error('Something has gone wrong. There is no chat to record leaving.');
            return;
        }

        const vcSession = vcUsageObj.find((x) => x.endTime === null);

        // a restart mid-call can leave us with no open session to close
        if (!vcSession) {
            console.error(`No open session for voice chat ${oldState.channelId}; nothing to close.`);
            return;
        }

        const userEntry = vcSession.users.find((x) => x.endTime === null && x.user === hashedUserId);
        if (userEntry) userEntry.endTime = dateTime;

        // they're the last person if the ONLY null endTime is theirs.
        const isLastUser = !vcSession.users.some((x) => x.endTime === null);
        if (isLastUser) {
            vcSession.endTime = dateTime;
        }
    }

    writeUsage(usage);
};

module.exports = { updateVoiceChatReport };

// let the session id carry:
/**

    this person started the chat at this time. (session start time) (user) (user start time)
    this person joined at this time. (user) (user start time)
    ..... repeat for additional people

    this person left at this time. (user end time)
    ..... repeat for additional people

    the last person left the chat. (session end time)
    once end time is logged, move this whole object over to completedSessions
    ... wait why lol


    -- wait all of this is great, I forgot the VC id. I can just add it in
    but
    but.... did I want info grouped by vc? I thought I did. yeah. yeah.

*/
