const {WebSocket} = require('ws');
const crypto = require('node:crypto');

//secretKey = 'aelwfhlaef';

const encMethod = 'aes-256-cbc';


function encryptData (data, key, encIv) {
    const cipher = crypto.createCipheriv(encMethod, key, encIv)
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    return Buffer.from(encrypted).toString('base64')
}

function decryptData(encryptedData, key, encIv) {
    const buff = Buffer.from(encryptedData, 'base64')
    encryptedData = buff.toString('utf-8')
    const decipher = crypto.createDecipheriv(encMethod, key, encIv)
    return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8')
}

class ChatClient {
    constructor(options) {
        this.ws = new WebSocket(options.url);
        this.sessionId = options.sessionId || null;
        this.username = options.username;
        this.key = crypto.createHash('sha512').update(options.secretKey).digest('hex').substring(0,32);
    }

    init() {
        this.ws.on('open', () => this.onOpen());
        this.ws.on('message', (data) => this.onMessage(data));
        this.ws.on('error', console.error);

    }

    onOpen() {
        console.log(`connected`)
        this.ws.send(JSON.stringify({
            type: `options`,
            sessionId: this.sessionId,
            data: {
                username: this.username
            }
        }));

    }
 
    onMessage(data) {
        const parsedData = JSON.parse(data.toString())

        
        switch (parsedData.type) {
            case `message`:
                console.log(`${parsedData.data.sender} >>: ${decryptData(parsedData.data.message, this.key, parsedData.data.encIv)}`)
                break;
            case `options`:
                this.setOptions(parsedData)
                break;
            default:
                console.log(`unknow message type`)
        }
    }

    setOptions(msgObject) {
        this.sessionId = msgObject.sessionId;
        console.log(`You sessionId: `, this.sessionId)
    }

    send(data) {
        encIv = crypto.createHash('sha512').update(crypto.randomBytes(16)).digest('hex').substring(0,16);
        const encData = encryptData(data, this.key, encIv)

        const msgObject = {
            type: `message`,
            sessionId: this.sessionId,
            encIv: encIv,
            data: encData
        };

        this.ws.send(JSON.stringify(msgObject));

    }
}

module.exports = { ChatClient }