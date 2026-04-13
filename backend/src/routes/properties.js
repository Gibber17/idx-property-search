const express = require('express');
const router = express.Router();
const pool = require('../db/mysql');

function validateListingId(id) {
  if (!id || id.trim() === '') {
    return { valid: false, error: 'Listing ID is required' };
  }
  if (id.length > 50) {
    return { valid: false, error: 'Listing ID is too long' };
  }
  return { valid: true };
}

// Parse a query param as an integer, returning null if absent
// or NaN if present-but-invalid. This lets the caller distinguish
// "not provided" (use default) from "provided garbage" (reject).
function parseIntParam(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return NaN;
  return n;
}

router.get('/:id/openhouses', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateListingId(id);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const [propertyCheck] = await pool.query(
        'SELECT L_ListingID FROM rets_property WHERE L_ListingID = ?',
        [id]
    );

    if (propertyCheck.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        message: `No property exists with ID: ${id}`
      });
    }

    const [openhouses] = await pool.query(
        'SELECT * FROM rets_openhouse WHERE L_ListingID = ? ORDER BY OpenHouseDate, OH_StartTime',
        [id]
    );

    res.json({
      propertyId: id,
      count: openhouses.length,
      openhouses
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch open houses' });
  }
});

// 2. GET Single Property Details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validation = validateListingId(id);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const [results] = await pool.query(
        'SELECT * FROM rets_property WHERE L_ListingID = ?',
        [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        error: 'Property not found',
        message: `No property exists with ID: ${id}`
      });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { city, zipcode, minPrice, maxPrice, beds, baths, sortBy, sortOrder } = req.query;

    // --- LIMIT / OFFSET VALIDATION ---
    // Validate raw input BEFORE defaulting, so "?limit=abc" is rejected
    // instead of being silently coerced to the default value.
    const parsedLimit = parseIntParam(req.query.limit);
    const parsedOffset = parseIntParam(req.query.offset);

    if (Number.isNaN(parsedLimit)) {
      return res.status(400).json({ error: 'limit must be a valid integer' });
    }
    if (Number.isNaN(parsedOffset)) {
      return res.status(400).json({ error: 'offset must be a valid integer' });
    }

    const limit = parsedLimit ?? 20;
    const offset = parsedOffset ?? 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'limit must be between 1 and 100' });
    }
    if (offset < 0) {
      return res.status(400).json({ error: 'offset cannot be negative' });
    }

    // --- FILTER VALIDATION ---
    if (minPrice && isNaN(minPrice)) return res.status(400).json({ error: 'minPrice must be a number' });
    if (maxPrice && isNaN(maxPrice)) return res.status(400).json({ error: 'maxPrice must be a number' });
    if (beds && isNaN(beds)) return res.status(400).json({ error: 'beds must be a number' });
    if (baths && isNaN(baths)) return res.status(400).json({ error: 'baths must be a number' });

    // --- FILTER BUILDING ---
    const conditions = [];
    const values = [];

    if (city) {
      conditions.push('LOWER(TRIM(L_City)) = LOWER(TRIM(?))');
      values.push(city);
    }
    if (zipcode) {
      conditions.push('L_Zip = ?');
      values.push(zipcode);
    }
    if (minPrice) {
      conditions.push('L_SystemPrice >= ?');
      values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push('L_SystemPrice <= ?');
      values.push(parseFloat(maxPrice));
    }
    if (beds) {
      conditions.push('L_Keyword2 >= ?');
      values.push(parseInt(beds));
    }
    if (baths) {
      conditions.push('LM_Dec_3 >= ?');
      values.push(parseInt(baths));
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // --- SORTING LOGIC ---
    // Mapping clean frontend names to your specific SQL column names
    const sortFieldMap = {
      price: 'L_SystemPrice',
      date: 'ListingContractDate',
      size: 'LM_Int2_3',
      beds: 'L_Keyword2'
    };

    let orderClause = '';
    if (sortBy && sortFieldMap[sortBy]) {
      const order = sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY ${sortFieldMap[sortBy]} ${order}`;
    } else {
      // Default sort by newest listing if nothing is specified
      orderClause = 'ORDER BY ListingContractDate DESC';
    }

    // --- EXECUTE QUERIES ---
    const countQuery = `SELECT COUNT(*) as total FROM rets_property ${whereClause}`;
    const [countResult] = await pool.query(countQuery, values);
    const total = countResult[0].total;

    const dataQuery = `SELECT * FROM rets_property ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const [results] = await pool.query(dataQuery, [...values, limit, offset]);

    res.json({ total, limit, offset, results });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

module.exports = router;