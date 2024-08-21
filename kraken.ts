import axios from 'axios';
import sleep = require('sleep-promise');
import crypto = require('crypto');
import fs = require('fs');
import * as dotenv from 'dotenv';

// Load environment variables (e.g., Infura, Alchemy API key)
dotenv.config();

const main = async (): Promise<void> => {
    const api_key_public = process.env.KRAKEN_PUBLIC; // public api key
    const api_key_private = process.env.KRAKEN_PRIVATE; // private api key

    // Configure market/orders/trades
    const trade_symbol = 'PAXG/USD';
    const trade_interval = 1; // Ohlc interval in minutes
    const trade_size = 0.0001; // trade volume in base currency
    const trade_leverage = 2;

    // Initial indicator/trade variables
    let trade_direction = 0;
    let sma_values: number[] = [0.0, 0.0, 0.0];
    let api_data: any = "";
    let make_trade = 0;
    let jsonData: any = "";

    try {
        while (true) {
            console.log("Retrieving OHLC data...");
            try {
                const baseDomain = "https://api.kraken.com";
                const publicPath = "/0/public/OHLC";
                const inputParameters = `pair=${trade_symbol}&interval=${trade_interval}`;
                const apiEndpointFullURL = `${baseDomain}${publicPath}?${inputParameters}`;

                const response = await axios.get(apiEndpointFullURL);
                jsonData = response;
                api_data = jsonData.data;
            } catch (error) {
                console.log('Failed' + error);
            }

            if (jsonData.data.error.length === 0) {
                console.log("Done..");
            } else {
                console.log(api_data.error);
            }

            // calculating SMA
            console.log('Calculating SMA 20...');
            let api_ohlc = api_data.result[trade_symbol];
            let api_ohlc_length = api_ohlc.length - 1;
            let sma_temp = 0.0;
            for (let count = 0; count < 20; count++) {
                sma_temp += parseFloat(api_ohlc[api_ohlc_length - count][4]);
            }

            sma_temp = sma_temp / 20;

            // update SMA values
            sma_values[2] = sma_values[1];
            sma_values[1] = sma_values[0];
            sma_values[0] = sma_temp;
            console.log(sma_values[2]);
            console.log(sma_values[1]);
            console.log(sma_values[0]);

            if (sma_values[2] === 0) {
                console.log(`Waiting ${trade_interval * 60} seconds`);
                await sleep(trade_interval * 60 * 1000);
                continue;
            } else {
                console.log(`SMA 20 values.... ${sma_values[2]}/${sma_values[1]}/${sma_values[0]}`);
            }

            // Trading Decision (Change in slope of SMA)
            console.log("Trading decision ......");
            if (sma_values[0] > sma_values[1] && sma_values[1] < sma_values[2]) {
                make_trade = 1;
                console.log("Long");
            } else if (sma_values[0] < sma_values[1] && sma_values[1] > sma_values[2]) {
                make_trade = -1;
                console.log("Short");
            } else {
                make_trade = 0;
                console.log("No Trade");
            }

            // Place Order
            if (make_trade !== 0) {
                console.log('Placing Order/trade....');
                try {
                    const api_path = '/0/private/AddOrder';
                    const api_nonce = (Date.now() * 1000).toString();
                    const api_post = `nonce=${api_nonce}&pair=${trade_symbol}&type=${make_trade === 1 ? 'buy' : 'sell'}&ordertype=market&volume=${trade_direction === 0 ? trade_size : trade_size * 2}&leverage=${trade_leverage > 0 ? trade_leverage : 1}`;

                    // The rest of the code for placing the order would go here
                    // ...

                } catch (error) {
                    console.log('Order placement failed: ' + error);
                }
            }

            console.log(`Waiting ${trade_interval * 60} seconds`);
            await sleep(trade_interval * 60 * 1000);
        }
    } catch (error) {
        console.log('An error occurred: ' + error);
    }
};

main();

