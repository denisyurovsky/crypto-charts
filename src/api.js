const API_KEY='71f82462b170f0904dcc21a95e50af524f680b4d438e99a3888fee58e37f5376'

const tickersHandlers = new Map();
const websocket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)
const broadcastChannel = new BroadcastChannel("channel_identifier");
broadcastChannel.addEventListener('message', ({data, origin}) => {
    const {type, params} = data;
    if (type == 'subscribe') {
        subscribeToTickers(params, () => {})
        return;
    }
    if (type == 'update') {
        const handlers = tickersHandlers.get(params.currency) ?? [];
        handlers.forEach(fn => fn(params.price))
    }
})

const aggrIndex = "5";
websocket.addEventListener('message', e => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: price} = JSON.parse(e.data)

    if (type !== aggrIndex) {
        return;
    }

    broadcastChannel.postMessage({type: 'update', params : {currency, price}})

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(price))
})


function sendToWs(message) {
    const stringMessage = JSON.stringify(message)
    if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(stringMessage)
    }

    websocket.addEventListener('open', () => {
        websocket.send(stringMessage)
    }, {once: true})
}

export const subscribeToTickers = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb])
    if (websocket.readyState == 1) {
        broadcastChannel.postMessage({type: 'subscribe', ticker})
    }
    sendToWs({
            "action": "SubAdd",
            subs: [`5~CCCAGG~${ticker}~USD`]
        }
    )
}

export const unsubscribeTicker = (ticker) => {
    tickersHandlers.delete(ticker)
    sendToWs({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}

