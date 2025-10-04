import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { StockTradingServiceClient } from './generated/stock_trading.client';
import { StockRequest, StockResponse } from './generated/stock_trading';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';


function App() {
  const [stockSymbol, setStockSymbol] = useState('')
  const [price, setPrice] = useState(0)
  const [timestamp, setTimestamp] = useState('')
  const [stockResponse, setStockResponse] = useState<StockResponse>({
    stockSymbol: '',
    price: 0,
    timestamp: ''
  });

  const transport = new GrpcWebFetchTransport({
    baseUrl: "http://localhost:8080" // envoy proxy address. envoy translate HTTP/1.1 to HTTP/2 and forward to backend
  });
  const client = new StockTradingServiceClient(transport);
  const request: StockRequest = { stockSymbol: 'GOOGLE' };

  async function fetchStockPrice() {
    const unaryCall = await client.getStockPrice(request);
    const response = unaryCall.response;
    setStockSymbol(response.stockSymbol)
    setPrice(response.price)
    setTimestamp(response.timestamp)
  }

  async function streamStockPrices() {
    try {
      const stream = client.subscribeStockPrice(request);
        for await (const response of stream.responses) {
          setStockResponse({
            stockSymbol: response.stockSymbol,
            price: response.price,
            timestamp: response.timestamp
          }) // update state to trigger re-render
        }
      } catch (err) {
        console.error('Streaming error:', err);
      }
  }

  return (
    <>
      <button onClick={fetchStockPrice}>Fetch Stock Price</button>
      <div>Stock Symbol: {stockSymbol}</div>
      <div>Price: {price}</div>
      <div>Timestamp: {timestamp}</div>
      <br/><br/>
      <button onClick={streamStockPrices}>Server Streaming Stock Price</button>
      <div>Stock Symbol: {stockResponse.stockSymbol}</div>
      <div>Price: {stockResponse.price}</div>
      <div>Timestamp: {stockResponse.timestamp}</div>
    </>
  )
}

export default App
