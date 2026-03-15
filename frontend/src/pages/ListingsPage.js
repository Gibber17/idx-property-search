import React, { useState, useEffect } from 'react';
import { fetchProperties } from '../api/client';
import PropertyFilters from '../components/PropertyFilters';
import './ListingsPage.css';
import Pagination from '../components/Pagination';

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

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

  return (
      <div className="listings-page">
        <h1>Property Listings</h1>

        <PropertyFilters onSearch={handleSearch} />

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
                          <PropertyCard key={property.ListingId} property={property} />
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

function PropertyCard({ property }) {
  return (
      <div className="property-card">
        <div className="property-image">
          {property.L_Photos ? (
              <img src={property.L_Photos} alt={property.L_Address} />
          ) : (
              <div className="no-image">No image available</div>
          )}
        </div>

        <div className="property-info">
          <div className="price">${property.L_SystemPrice?.toLocaleString()}</div>
          <div className="address">{property.L_Address}</div>
          <div className="city">{property.L_City}, {property.L_State} {property.L_Zip}</div>

          <div className="property-details">
            <span>{property.L_Keyword2} beds</span>
            <span>•</span>
            <span>{property.LM_Dec_3} baths</span>
            {property.LM_Int2_3 && (
                <>
                  <span>•</span>
                  <span>{property.LM_Int2_3.toLocaleString()} sqft</span>
                </>
            )}
          </div>
        </div>
      </div>
  );
}

export default ListingsPage;