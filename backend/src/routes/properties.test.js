const request = require('supertest');
const express = require('express');
const propertiesRouter = require('./properties');

// Mock the database pool
jest.mock('../db/mysql', () => ({
    query: jest.fn()
}));
const pool = require('../db/mysql');

const app = express();
app.use(express.json());
app.use('/api/properties', propertiesRouter);

// Silence expected console.error output from the 500 tests so the
// test runner output stays clean. Restore after the suite.
let consoleErrorSpy;
beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
    consoleErrorSpy.mockRestore();
});

describe('Properties API', () => {
    beforeEach(() => {
        pool.query.mockClear();
    });

    // ---------------------------------------------------------------
    // GET /api/properties (list)
    // ---------------------------------------------------------------
    describe('GET /api/properties', () => {
        test('returns properties with pagination', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 100 }]])
                .mockResolvedValueOnce([[{ L_ListingID: '123', L_City: 'Los Angeles' }]]);

            const response = await request(app)
                .get('/api/properties?limit=20&offset=0')
                .expect(200);

            expect(response.body.total).toBe(100);
            expect(response.body.limit).toBe(20);
            expect(response.body.offset).toBe(0);
            expect(response.body.results).toHaveLength(1);
            expect(response.body.results[0].L_City).toBe('Los Angeles');
        });

        test('uses default limit and offset when not provided', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 5 }]])
                .mockResolvedValueOnce([[]]);

            const response = await request(app)
                .get('/api/properties')
                .expect(200);

            expect(response.body.limit).toBe(20);
            expect(response.body.offset).toBe(0);
        });

        // --- limit / offset validation ---

        test('returns 400 for non-integer limit', async () => {
            const response = await request(app)
                .get('/api/properties?limit=abc')
                .expect(400);
            expect(response.body.error).toContain('limit');
        });

        test('returns 400 for non-integer offset', async () => {
            const response = await request(app)
                .get('/api/properties?offset=xyz')
                .expect(400);
            expect(response.body.error).toContain('offset');
        });

        test('returns 400 when limit is below 1', async () => {
            const response = await request(app)
                .get('/api/properties?limit=0')
                .expect(400);
            expect(response.body.error).toContain('between 1 and 100');
        });

        test('returns 400 when limit exceeds 100', async () => {
            const response = await request(app)
                .get('/api/properties?limit=500')
                .expect(400);
            expect(response.body.error).toContain('between 1 and 100');
        });

        test('returns 400 when offset is negative', async () => {
            const response = await request(app)
                .get('/api/properties?offset=-5')
                .expect(400);
            expect(response.body.error).toContain('offset');
        });

        // --- filter validation ---

        test('returns 400 for non-numeric minPrice', async () => {
            const response = await request(app)
                .get('/api/properties?minPrice=cheap')
                .expect(400);
            expect(response.body.error).toContain('minPrice');
        });

        test('returns 400 for non-numeric maxPrice', async () => {
            const response = await request(app)
                .get('/api/properties?maxPrice=expensive')
                .expect(400);
            expect(response.body.error).toContain('maxPrice');
        });

        test('returns 400 for non-numeric beds', async () => {
            const response = await request(app)
                .get('/api/properties?beds=many')
                .expect(400);
            expect(response.body.error).toContain('beds');
        });

        test('returns 400 for non-numeric baths', async () => {
            const response = await request(app)
                .get('/api/properties?baths=several')
                .expect(400);
            expect(response.body.error).toContain('baths');
        });

        // --- filter behavior ---

        test('filters by city', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 50 }]])
                .mockResolvedValueOnce([[{ L_ListingID: '123', L_City: 'Los Angeles' }]]);

            await request(app)
                .get('/api/properties?city=Los Angeles')
                .expect(200);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE'),
                expect.arrayContaining(['Los Angeles'])
            );
        });

        test('filters by zipcode', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 10 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?zipcode=90007')
                .expect(200);

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('L_Zip'),
                expect.arrayContaining(['90007'])
            );
        });

        test('filters by price range', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 25 }]])
                .mockResolvedValueOnce([[{ L_ListingID: '123', L_SystemPrice: 400000 }]]);

            const response = await request(app)
                .get('/api/properties?minPrice=300000&maxPrice=500000')
                .expect(200);

            expect(response.body.results[0].L_SystemPrice).toBe(400000);
        });

        test('filters by beds and baths', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 8 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?beds=3&baths=2')
                .expect(200);

            const dataQueryCall = pool.query.mock.calls[1];
            expect(dataQueryCall[1]).toEqual(expect.arrayContaining([3, 2]));
        });

        test('combines all filters together', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 1 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?city=Los Angeles&zipcode=97201&minPrice=200000&maxPrice=800000&beds=2&baths=1')
                .expect(200);

            const countQueryCall = pool.query.mock.calls[0];
            expect(countQueryCall[0]).toContain('WHERE');
            expect(countQueryCall[1]).toEqual(
                expect.arrayContaining(['Los Angeles', '97201', 200000, 800000, 2, 1])
            );
        });

        // --- sorting ---

        test('sorts by price ascending when sortBy=price', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 5 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?sortBy=price')
                .expect(200);

            const dataQuery = pool.query.mock.calls[1][0];
            expect(dataQuery).toContain('ORDER BY L_SystemPrice ASC');
        });

        test('sorts by price descending when sortOrder=DESC', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 5 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?sortBy=price&sortOrder=DESC')
                .expect(200);

            const dataQuery = pool.query.mock.calls[1][0];
            expect(dataQuery).toContain('ORDER BY L_SystemPrice DESC');
        });

        test('sorts by beds when sortBy=beds', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 5 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?sortBy=beds&sortOrder=desc')
                .expect(200);

            const dataQuery = pool.query.mock.calls[1][0];
            expect(dataQuery).toContain('ORDER BY L_Keyword2 DESC');
        });

        test('falls back to default sort when sortBy is unrecognized', async () => {
            pool.query
                .mockResolvedValueOnce([[{ total: 5 }]])
                .mockResolvedValueOnce([[]]);

            await request(app)
                .get('/api/properties?sortBy=color')
                .expect(200);

            const dataQuery = pool.query.mock.calls[1][0];
            expect(dataQuery).toContain('ORDER BY ListingContractDate DESC');
        });

        // --- error handling ---

        test('returns 500 when the database throws', async () => {
            pool.query.mockRejectedValueOnce(new Error('connection lost'));

            const response = await request(app)
                .get('/api/properties')
                .expect(500);

            expect(response.body.error).toContain('Failed to fetch properties');
        });
    });

    // ---------------------------------------------------------------
    // GET /api/properties/:id
    // ---------------------------------------------------------------
    describe('GET /api/properties/:id', () => {
        test('returns property by id', async () => {
            pool.query.mockResolvedValueOnce([[
                { L_ListingID: '123', L_City: 'Los Angeles', L_SystemPrice: 500000 }
            ]]);

            const response = await request(app)
                .get('/api/properties/123')
                .expect(200);

            expect(response.body.L_ListingID).toBe('123');
        });

        test('returns 400 when listing id is whitespace only', async () => {
            const response = await request(app)
                .get('/api/properties/%20')
                .expect(400);

            expect(response.body.error).toContain('required');
        });

        test('returns 404 for non-existent property', async () => {
            pool.query.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .get('/api/properties/999')
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        test('returns 400 for listing id that is too long', async () => {
            const longId = 'a'.repeat(51);

            const response = await request(app)
                .get(`/api/properties/${longId}`)
                .expect(400);

            expect(response.body.error).toContain('too long');
        });

        test('returns 500 when the database throws', async () => {
            pool.query.mockRejectedValueOnce(new Error('connection lost'));

            const response = await request(app)
                .get('/api/properties/123')
                .expect(500);

            expect(response.body.error).toContain('Failed to fetch property details');
        });
    });

    // ---------------------------------------------------------------
    // GET /api/properties/:id/openhouses
    // ---------------------------------------------------------------
    describe('GET /api/properties/:id/openhouses', () => {
        test('returns open houses for property', async () => {
            pool.query
                .mockResolvedValueOnce([[{ L_ListingID: '123' }]])
                .mockResolvedValueOnce([[
                    { OpenHouseDate: '2024-03-15', OH_StartTime: '13:00:00' }
                ]]);

            const response = await request(app)
                .get('/api/properties/123/openhouses')
                .expect(200);

            expect(response.body.propertyId).toBe('123');
            expect(response.body.count).toBe(1);
            expect(response.body.openhouses).toHaveLength(1);
        });

        test('returns count 0 for property with no open houses', async () => {
            pool.query
                .mockResolvedValueOnce([[{ L_ListingID: '123' }]])
                .mockResolvedValueOnce([[]]);

            const response = await request(app)
                .get('/api/properties/123/openhouses')
                .expect(200);

            expect(response.body.count).toBe(0);
            expect(response.body.openhouses).toHaveLength(0);
        });

        test('returns 404 when the property does not exist', async () => {
            pool.query.mockResolvedValueOnce([[]]);

            const response = await request(app)
                .get('/api/properties/999/openhouses')
                .expect(404);

            expect(response.body.error).toContain('not found');
        });

        test('returns 400 for listing id that is too long', async () => {
            const longId = 'a'.repeat(51);

            const response = await request(app)
                .get(`/api/properties/${longId}/openhouses`)
                .expect(400);

            expect(response.body.error).toContain('too long');
        });

        test('returns 500 when the database throws', async () => {
            pool.query.mockRejectedValueOnce(new Error('connection lost'));

            const response = await request(app)
                .get('/api/properties/123/openhouses')
                .expect(500);

            expect(response.body.error).toContain('Failed to fetch open houses');
        });
    });
});