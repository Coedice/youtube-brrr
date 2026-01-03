/**
 * Tests for background service worker
 */

describe('background service worker', () => {
    let onInstalledListener;
    let onMessageListener;

    beforeEach(() => {
        jest.resetModules();
        onInstalledListener = null;
        onMessageListener = null;

        global.chrome = {
            runtime: {
                onInstalled: {
                    addListener: jest.fn((cb) => {
                        onInstalledListener = cb;
                    }),
                },
                onMessage: {
                    addListener: jest.fn((cb) => {
                        onMessageListener = cb;
                    }),
                },
            },
            storage: {
                sync: {
                    set: jest.fn((data, cb) => cb && cb()),
                    get: jest.fn((keys, cb) => cb && cb({ defaultSpeed: 1 })),
                },
            },
        };
    });

    it('sets defaults on install', () => {
        jest.isolateModules(() => {
            require('../src/background.js');
        });

        expect(onInstalledListener).toBeInstanceOf(Function);
        onInstalledListener({ reason: 'install' });

        expect(chrome.storage.sync.set).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultSpeed: 2.3,
                genreSpeeds: expect.any(Object),
                channelSpeeds: expect.any(Object),
            })
        );
    });

    it('does not set defaults when not installing', () => {
        jest.isolateModules(() => {
            require('../src/background.js');
        });

        onInstalledListener({ reason: 'update' });

        expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    });

    it('responds to getSettings and updateSettings messages', () => {
        const mockSettings = { defaultSpeed: 1.75 };
        chrome.storage.sync.get.mockImplementation((keys, cb) => cb(mockSettings));

        jest.isolateModules(() => {
            require('../src/background.js');
        });

        const sendResponse = jest.fn();

        const getSettingsResult = onMessageListener({ action: 'getSettings' }, null, sendResponse);
        expect(chrome.storage.sync.get).toHaveBeenCalledWith(null, expect.any(Function));
        expect(sendResponse).toHaveBeenCalledWith(mockSettings);
        expect(getSettingsResult).toBe(true);

        const updateResponse = jest.fn();
        const updated = { defaultSpeed: 2 };
        const setSpy = chrome.storage.sync.set;
        setSpy.mockImplementation((settings, cb) => cb && cb());

        const updateResult = onMessageListener(
            { action: 'updateSettings', settings: updated },
            null,
            updateResponse
        );
        expect(setSpy).toHaveBeenCalledWith(updated, expect.any(Function));
        expect(updateResponse).toHaveBeenCalledWith({ success: true });
        expect(updateResult).toBe(true);
    });
});
