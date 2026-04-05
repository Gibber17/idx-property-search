import React, { useState, useEffect } from 'react';
import { fetchProperties } from '../api/client';
import PropertyFilters from '../components/PropertyFilters';
import './ListingsPage.css';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState(''); 
  const [sortOrder, setSortOrder] = useState('ASC'); 

  useEffect(() => {
    loadProperties();
  }, [filters, currentPage]);

  async function loadProperties() {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * itemsPerPage;
      const params = { ...filters, limit: itemsPerPage, offset };
      const data = await fetchProperties(params);
      setProperties(data.results);
      setTotal(data.total);
    } catch (err) {
      setError('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  // Add sort controls in render:
  return (
      <div className="listings-page">
        <h1>Property Listings</h1>

        <PropertyFilters onSearch={handleSearch} />

        {/*Sort controls*/}
        <div className="sort-controls"> 
          <label>Sort by:</label> 
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}> 
            <option value="">Default</option> 
            <option value="ListPrice">Price</option> 
            <option value="ListingContractDate">Date Listed</option> 
            <option value="LivingArea">Size</option> 
            <option value="BedroomsTotal">Bedrooms</option> 
          </select> 
          
          {sortBy && ( 
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}> 
              <option value="ASC">Low to High</option> 
              <option value="DESC">High to Low</option> 
            </select> 
          )} 
      </div>

        {!loading && !error && (
            <p className="results-summary">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-
              {Math.min(currentPage * itemsPerPage, total)} of {total.toLocaleString()} properties
            </p>
        )}

        {loading && <div className="loading">Loading properties...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
            <>
              {properties.length === 0 ? (
                  <div className="no-results">
                    No properties found matching your criteria. Try adjusting your filters.
                  </div>
              ) : (
                  <>
                    <div className="property-grid">
                      {properties.map(property => (
                          <PropertyCard key={property.L_ListingID} property={property} />
                      ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                  </>
              )}
            </>
        )}
      </div>
  );
}
export default ListingsPage;