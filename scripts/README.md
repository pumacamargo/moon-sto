# Moonsto reminder (versioned copy)

`scripts/notify.js` mirrors the independently scheduled `/root/projects/moon/notify/notify.js`, except its Telegram token is loaded from `MOONSTO_TELEGRAM_TOKEN` instead of an embedded credential. Do not run this copy without a configured token; the cron still calls the independent script. Changes to this copy do not deploy the app or update cron.

Run offline tests: `node --test scripts/notify.test.cjs`. The Japan ETF trading unit of 1 for 2558 and 2559 was checked in the JPX ETF listing (`https://www.jpx.co.jp/english/equities/products/etfs/issues/01.html`).
