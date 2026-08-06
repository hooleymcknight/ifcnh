export const getWelcomeMessage = () => {
    const body = [
        'Welcome in! 🌙',
        '',
        'Low expectations, by design.',
        '',
        "There's no feed here. Nothing to keep up with, no guilt for going quiet. Just games.",
        '',
        'Come play when you want company. Bring whoever you like — everyone follows the same rules.',
        '',
        "Ghost when you need, or even leave entirely and come back, as many times as you want. Nobody's watching the door.",
        '',
        'Aim well, roll high, meet quota, farm good.',
        '',
        '-# Permanent invite, in case you leave and want back in:',
        '```' + INVITE + '```'
    ].join('\n');

    return body;
}