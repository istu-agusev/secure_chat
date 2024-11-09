const {WebSocketServer, WebSocket} = require('ws');
const {Client} = require(`./Client`);

class ChatServer {
    wss = null;
    clientMap = new Map();

    constructor(options){
        this.port = options.port;
    }

    init(){
        this.wss = new WebSocketServer({ port: this.port });
        
        this.wss.on('connection', (ws) => this.onConnection(ws));
        this.wss.on('error', console.error);

        console.log(`ChatServer started on port ${this.port}`)
    }

    onConnection(ws) {
        console.log(`new connection`);

        ws.on(`message`, (data) => this.onMessage(ws, data));
    }

    onMessage(ws, data) {
        const msgObject = JSON.parse(data.toString());
        console.log(msgObject)

        switch (msgObject.type) {
            case `message`: {
                this.broadcast(msgObject);
                break;
            }
            case `options`: {
                this.createClient(ws, msgObject);
                break;
            }
            default:
                console.log(`unknow message type`)
        }

    }

    createClient(ws, msgObject) {
        const client = new Client({
            ws: ws,
            username: msgObject.data.username,
            sessionId: msgObject.sessionId
        });

        this.clientMap.set(client.sessionId, client);
        console.log(`Client ${client.username} connected`);
    }
 
    broadcast(msgObject) {
        const sender = this.clientMap.get(msgObject.sessionId);

        this.clientMap.forEach((client) => {
            if(client.ws.readyState === WebSocket.OPEN && client.sessionId != msgObject.sessionId){
                client.send({
                    type: `message`,
                    data: {
                        sender: sender.username,
                        message: msgObject.data
                    }
                });
            }
        })
    }
}

module.exports = {ChatServer};