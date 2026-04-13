import React, { useState } from 'react';
import './PropertyFilters.css';

const INITIAL_FILTERS = {
  L_City: '',
  L_Zip: '',
  minPrice: '',
  maxPrice: '',
  L_Keyword2: '',
  LM_Dec_3: ''
};

function PropertyFilters({ onSearch }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build clean filter object (remove empty values)
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].toString().trim() !== '') {
        cleanFilters[key] = filters[key].toString().trim();
      }
    });

    onSearch(cleanFilters);
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    onSearch({});
  };

  return (
      <form className="property-filters" onSubmit={handleSubmit}>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="filter-city">City</label>
            <input
                id="filter-city"
                type="text"
                name="L_City"
                value={filters.L_City}
                onChange={handleChange}
                placeholder="e.g. Los Angeles"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-zip">ZIP Code</label>
            <input
                id="filter-zip"
                type="text"
                name="L_Zip"
                value={filters.L_Zip}
                onChange={handleChange}
                placeholder="e.g. 90210"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-min-price">Min Price</label>
            <input
                id="filter-min-price"
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleChange}
                placeholder="$0"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-max-price">Max Price</label>
            <input
                id="filter-max-price"
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleChange}
                placeholder="No max"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="filter-beds">Beds</label>
            <select
                id="filter-beds"
                name="L_Keyword2"
                value={filters.L_Keyword2}
                onChange={handleChange}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-baths">Baths</label>
            <select
                id="filter-baths"
                name="LM_Dec_3"
                value={filters.LM_Dec_3}
                onChange={handleChange}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={handleClear} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </form>
  );
}

export default PropertyFilters;