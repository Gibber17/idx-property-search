import { fetchProperties } from './client';

global.fetch = jest.fn();

describe('fetchProperties', () => {
    beforeEach(() => {
        global.fetch.mockClear()
    });

    test('fetches properties successfully', async () => {
        const mockResponse = {
            total: 100,
            limit: 20,
            offset: 0,
            results: [
                {
                    L_ListingID: '123',
                    L_Address: '123 Main St',
                    L_City: 'Los Angeles',
                    L_State: 'CA',
                    L_SystemPrice: 750000,
                    L_Keyword2: 3,
                    LM_Dec_3: 2,
                    LM_Int2_3: 1500,
                    Media: null
                }
            ]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const data = await fetchProperties({ limit: 20 });

        expect(fetch).toHaveBeenCalledWith('/api/properties?limit=20');
        expect(data).toEqual(mockResponse);
    });

    test('throws error on failed request', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        await expect(fetchProperties()).rejects.toThrow('HTTP 500');
    });

    test('builds query string correctly with multiple params', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ results: [] })
        });

        await fetchProperties({ L_City: 'Los Angeles', minPrice: 500000, L_Keyword2: 3 });

        const callUrl = fetch.mock.calls[0][0];
        expect(callUrl).toContain('L_City=Los+Angeles');
        expect(callUrl).toContain('minPrice=500000');
        expect(callUrl).toContain('L_Keyword2=3');
    });
});