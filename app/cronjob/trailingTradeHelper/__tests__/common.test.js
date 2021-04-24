/* eslint-disable global-require */

describe('common.js', () => {
  let commonHelper;

  let cacheMock;
  let binanceMock;
  let mongoMock;
  let loggerMock;

  let result;

  beforeEach(() => {
    jest.clearAllMocks().resetModules();
  });

  describe('cacheExchangeSymbols', () => {
    describe('when there is no cached exchange info and no cached exchange info', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockResolvedValue(null);
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.exchangeInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-exchange-info.json'));

        commonHelper = require('../common');
        await commonHelper.cacheExchangeSymbols(logger, {});
      });

      it('triggers cache.hget for exchange symbols', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('triggers cache.hget for exchange info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('triggers binance exchange info', () => {
        expect(binanceMock.client.exchangeInfo).toHaveBeenCalled();
      });

      it('triggers cache.hset for exchange info', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info',
          JSON.stringify(require('./fixtures/binance-exchange-info.json'))
        );
      });

      it('triggers cache.hset for exchange symbols', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols',
          JSON.stringify(
            require('./fixtures/binance-cached-exchange-symbols.json')
          )
        );
      });
    });

    describe('when there is cached exchange info', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
          if (hash === 'trailing-trade-common' && key === 'exchange-symbols') {
            return JSON.stringify(
              require('./fixtures/binance-cached-exchange-symbols.json')
            );
          }
          if (hash === 'trailing-trade-common' && key === 'exchange-info') {
            return JSON.stringify(
              require('./fixtures/binance-exchange-info.json')
            );
          }

          return null;
        });
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.exchangeInfo = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        await commonHelper.cacheExchangeSymbols(logger, {
          supportFIATs: ['USDT', 'BUSD']
        });
      });

      it('triggers cache.hget for exchange symbols', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('does not trigger cache.hget for exchange info', () => {
        expect(cacheMock.hget).not.toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('does not trigger binance exchange info', () => {
        expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
      });

      it('does not trigger cache.hset', () => {
        expect(cacheMock.hset).not.toHaveBeenCalled();
      });
    });

    describe('when there is no cached exchange info but has cached exchange info', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockImplementation((hash, key) => {
          if (hash === 'trailing-trade-common' && key === 'exchange-info') {
            return JSON.stringify(
              require('./fixtures/binance-exchange-info.json')
            );
          }

          return null;
        });

        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.exchangeInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-exchange-info.json'));

        commonHelper = require('../common');
        await commonHelper.cacheExchangeSymbols(logger, {
          supportFIATs: ['USDT', 'BUSD']
        });
      });

      it('triggers cache.hget for exchange symbols', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols'
        );
      });

      it('triggers cache.hget for exchange info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info'
        );
      });

      it('does not trigger binance exchange info', () => {
        expect(binanceMock.client.exchangeInfo).not.toHaveBeenCalled();
      });

      it('does not triggers cache.hset for exchange info', () => {
        expect(cacheMock.hset).not.toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-info',
          JSON.stringify(require('./fixtures/binance-exchange-info.json'))
        );
      });

      it('triggers cache.hset for exchange symbols', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'exchange-symbols',
          JSON.stringify(
            require('./fixtures/binance-cached-exchange-symbols.json')
          )
        );
      });
    });
  });

  describe('getAccountInfoFromAPI', () => {
    beforeEach(async () => {
      const { cache, binance, logger } = require('../../../helpers');

      cacheMock = cache;
      binanceMock = binance;

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      binanceMock.client.accountInfo = jest
        .fn()
        .mockResolvedValue(require('./fixtures/binance-account-info.json'));

      commonHelper = require('../common');
      result = await commonHelper.getAccountInfoFromAPI(logger);
    });

    it('triggers binance account info', () => {
      expect(binanceMock.client.accountInfo).toHaveBeenCalled();
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-common',
        'account-info',
        JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
      );
    });

    it('returns expected value', () => {
      expect(result).toStrictEqual(
        require('./fixtures/binance-cached-account-info.json')
      );
    });
  });

  describe('getAccountInfo', () => {
    describe('when there is cached account information', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest
          .fn()
          .mockResolvedValue(
            JSON.stringify(
              require('./fixtures/binance-cached-account-info.json')
            )
          );
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.accountInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-account-info.json'));

        commonHelper = require('../common');
        result = await commonHelper.getAccountInfo(logger);
      });

      it('triggers cache.hget for account info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info'
        );
      });

      it('does not trigger binance account info', () => {
        expect(binanceMock.client.accountInfo).not.toHaveBeenCalled();
      });

      it('does not trigger cache.hset', () => {
        expect(cacheMock.hset).not.toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-cached-account-info.json')
        );
      });
    });

    describe('when there is no cached account information', () => {
      beforeEach(async () => {
        const { cache, binance, logger } = require('../../../helpers');

        cacheMock = cache;
        binanceMock = binance;

        cacheMock.hget = jest.fn().mockResolvedValue(null);
        cacheMock.hset = jest.fn().mockResolvedValue(true);

        binanceMock.client.accountInfo = jest
          .fn()
          .mockResolvedValue(require('./fixtures/binance-account-info.json'));

        commonHelper = require('../common');
        result = await commonHelper.getAccountInfo(logger);
      });

      it('triggers cache.hget for account info', () => {
        expect(cacheMock.hget).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info'
        );
      });

      it('triggers binance account info', () => {
        expect(binanceMock.client.accountInfo).toHaveBeenCalled();
      });

      it('triggers cache.hset', () => {
        expect(cacheMock.hset).toHaveBeenCalledWith(
          'trailing-trade-common',
          'account-info',
          JSON.stringify(require('./fixtures/binance-cached-account-info.json'))
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(
          require('./fixtures/binance-cached-account-info.json')
        );
      });
    });
  });

  describe('getOpenOrdersFromAPI', () => {
    beforeEach(async () => {
      const { binance, logger } = require('../../../helpers');

      binanceMock = binance;

      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      commonHelper = require('../common');
      result = await commonHelper.getOpenOrdersFromAPI(logger);
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        recvWindow: 10000
      });
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([
        {
          symbol: 'BTCUSDT'
        }
      ]);
    });
  });

  describe('getOpenOrdersBySymbolFromAPI', () => {
    beforeEach(async () => {
      const { binance, logger } = require('../../../helpers');

      binanceMock = binance;
      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      commonHelper = require('../common');
      result = await commonHelper.getOpenOrdersBySymbolFromAPI(
        logger,
        'BTCUSDT'
      );
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        recvWindow: 10000
      });
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([{ symbol: 'BTCUSDT' }]);
    });
  });

  describe('getAndCacheOpenOrdersForSymbol', () => {
    beforeEach(async () => {
      const { binance, cache, logger } = require('../../../helpers');

      binanceMock = binance;
      binanceMock.client.openOrders = jest.fn().mockResolvedValue([
        {
          symbol: 'BTCUSDT'
        }
      ]);

      cacheMock = cache;
      loggerMock = logger;

      cacheMock.hset = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.getAndCacheOpenOrdersForSymbol(
        logger,
        'BTCUSDT'
      );
    });

    it('triggers binance.client.openOrders', () => {
      expect(binanceMock.client.openOrders).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        recvWindow: 10000
      });
    });

    it('triggers cache.hset', () => {
      expect(cacheMock.hset).toHaveBeenCalledWith(
        'trailing-trade-orders',
        'BTCUSDT',
        JSON.stringify([
          {
            symbol: 'BTCUSDT'
          }
        ])
      );
    });

    it('returns expected result', () => {
      expect(result).toStrictEqual([{ symbol: 'BTCUSDT' }]);
    });
  });

  describe('getLastBuyPrice', () => {
    describe('when nothing is returned', () => {
      beforeEach(async () => {
        const { mongo, logger } = require('../../../helpers');

        mongoMock = mongo;
        loggerMock = logger;

        mongoMock.findOne = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.getLastBuyPrice(loggerMock, 'BTCUSDT');
      });

      it('triggers mongo.findOne', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          }
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(null);
      });
    });

    describe('when returned last buy price', () => {
      beforeEach(async () => {
        const { mongo, logger } = require('../../../helpers');

        mongoMock = mongo;
        loggerMock = logger;

        mongoMock.findOne = jest.fn().mockResolvedValue({
          lastBuyPrice: 100
        });

        commonHelper = require('../common');
        result = await commonHelper.getLastBuyPrice(loggerMock, 'BTCUSDT');
      });

      it('triggers mongo.findOne', () => {
        expect(mongoMock.findOne).toHaveBeenCalledWith(
          loggerMock,
          'trailing-trade-symbols',
          {
            key: 'BTCUSDT-last-buy-price'
          }
        );
      });

      it('returns expected value', () => {
        expect(result).toStrictEqual(100);
      });
    });
  });

  describe('lockSymbol', () => {
    describe('without ttl', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.set = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        result = await commonHelper.lockSymbol(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.set', () => {
        expect(cacheMock.set).toHaveBeenCalledWith('lock-BTCUSDT', true, 5);
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });

    describe('with ttl', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.set = jest.fn().mockResolvedValue(true);

        commonHelper = require('../common');
        result = await commonHelper.lockSymbol(loggerMock, 'BTCUSDT', 10);
      });

      it('triggers cache.set', () => {
        expect(cacheMock.set).toHaveBeenCalledWith('lock-BTCUSDT', true, 10);
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });
  });

  describe('isSymbolLocked', () => {
    describe('cache exists', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.get = jest.fn().mockResolvedValue('true');

        commonHelper = require('../common');
        result = await commonHelper.isSymbolLocked(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.get', () => {
        expect(cacheMock.get).toHaveBeenCalledWith('lock-BTCUSDT');
      });

      it('returns expected value', () => {
        expect(result).toBeTruthy();
      });
    });

    describe('cache does not exist', () => {
      beforeEach(async () => {
        const { cache, logger } = require('../../../helpers');

        cacheMock = cache;
        loggerMock = logger;

        cacheMock.get = jest.fn().mockResolvedValue(null);

        commonHelper = require('../common');
        result = await commonHelper.isSymbolLocked(loggerMock, 'BTCUSDT');
      });

      it('triggers cache.get', () => {
        expect(cacheMock.get).toHaveBeenCalledWith('lock-BTCUSDT');
      });

      it('returns expected value', () => {
        expect(result).toBeFalsy();
      });
    });
  });

  describe('unlockSymbol', () => {
    beforeEach(async () => {
      const { cache, logger } = require('../../../helpers');

      cacheMock = cache;
      loggerMock = logger;

      cacheMock.del = jest.fn().mockResolvedValue(true);

      commonHelper = require('../common');
      result = await commonHelper.unlockSymbol(loggerMock, 'BTCUSDT');
    });

    it('triggers cache.del', () => {
      expect(cacheMock.del).toHaveBeenCalledWith('lock-BTCUSDT');
    });

    it('returns expected value', () => {
      expect(result).toBeTruthy();
    });
  });
});
