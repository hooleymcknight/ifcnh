import fs from 'fs';
import { createHmac } from 'node:crypto';

const psuedoUser = (id) => {
    return createHmac('sha256', process.env.USER_HASH_KEY).update(id).digest('hex').slice(0, 16);
}

export const updateVoiceChatReport = async (oldState, newState) => {
    const usage = JSON.parse(await fs.readFileSync('./channelUsageReport.json', 'utf8'));
    const hashedUserId = psuedoUser(newState.id);
    const rn = new Date();
    const dateObj = rn.toISOString(); // complete with Z's and T's
    const dateTime = rn.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }); // 8/2/2026, 12:29:59 PM

    /**
     * when you join a chat
     * regardless of where you're coming from
     */
    if (newState.channelId) {
        // user joined a chat
        console.log('user joined a chat');

        // first look and see if there's already an open session for this chat
        if (!Object.keys(usage.voiceChats).find(x => x === newState.channelId)) {
            usage.voiceChats[newState.channelId] = [];
        }
        const vcUsageObj = usage.voiceChats[newState.channelId];

        // if there are no open sessions, create that now
        if (!vcUsageObj.find(x => x.endTime === null)?.length) {
            // generate a sessionId --> discord.js's isnt a real sessionId for the chat
            const sessionId = `${dateObj}.${newState.channelId}`;
            // startTime is dateTime, endTime is null, users is an empty array
            vcUsageObj.push({
                sessionId: sessionId,
                startTime: dateTime,
                endTime: null,
                users: []
            });
        }

        // add the user that just joined.
        // if they are rejoining, still count it-- you'll get a cumulative time later when you pull a report
        vcUsageObj.filter(x => x.endTime === null)?.[0].users.push({
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
        // user left a chat
        console.log('user left a chat');
        const vcUsageObj = usage.voiceChats[oldState.channelId];

        if (!vcUsageObj) {
            console.error('Something has gone wrong. There is no chat to record leaving.');
            return;
        }
        
        // they're the last person if the ONLY null endTime is theirs.
        const vcSession = vcUsageObj.filter(x => x.endTime === null)?.[0];

        const isLastUser = !vcSession.users.some(x => x.endTime === null && x.user != hashedUserId);
        if (isLastUser) {
            vcSession.endTime = dateTime;
        }

        const thing = vcSession.users.filter(x => x.endTime === null && x.user === hashedUserId)[0].endTime = dateTime;
    }

    fs.writeFileSync('./channelUsageReport.json', JSON.stringify(usage));
}


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