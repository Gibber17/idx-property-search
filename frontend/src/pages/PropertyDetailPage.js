import React, { useState, useEffect } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom'; 
import { fetchPropertyDetail, fetchOpenHouses } from '../api/client'; 
import './PropertyDetailPage.css'; 
function PropertyDetailPage() { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 
   
  const [property, setProperty] = useState(null); 
  const [openHouses, setOpenHouses] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
 
  useEffect(() => { 
    loadPropertyData(); 
  }, [id]); 
 
  async function loadPropertyData() { 
    try { 
      setLoading(true); 
      setError(null); 
 
      const [propertyData, openHousesData] = await Promise.all([ 
        fetchPropertyDetail(id), 
        fetchOpenHouses(id) 
      ]); 
 
      setProperty(propertyData); 
      setOpenHouses(openHousesData.openhouses || []); 
    } catch (err) { 
      setError(err.message || 'Failed to load property details'); 
    } finally { 
      setLoading(false); 
    } 
  } 
 
  if (loading) { 
    return <div className="loading">Loading property details...</div>; 
  } 
 
  if (error) { 
    return ( 
      <div className="error-container"> 
        <div className="error">{error}</div> 
        <button onClick={() => navigate('/')} className="btn-back"> 
          Back to Listings 
        </button> 
      </div> 
    ); 
  } 
 
  if (!property) { 
    return null; 
  } 
 
  return ( 
    <div className="property-detail-page"> 
      <button onClick={() => navigate('/')} className="btn-back"> 
        ← Back to Listings 
      </button> 
 
      <div className="property-header"> 
        <h1>${property.ListPrice?.toLocaleString()}</h1> 
        <p className="property-address">{property.UnparsedAddress}</p> 
        <p className="property-location"> 
          {property.City}, {property.StateOrProvince} {property.PostalCode} 
        </p> 
      </div> 
 
      <div className="property-image-main"> 
        {property.Media ? ( 
          <img src={property.Media} alt={property.UnparsedAddress} /> 
        ) : ( 
          <div className="no-image">No image available</div> 
        )} 
      </div> 
 
      <div className="property-content"> 
        <div className="property-main"> 
          <div className="property-stats"> 
            <div className="stat"> 
              <div className="stat-value">{property.BedroomsTotal}</div> 
              <div className="stat-label">Bedrooms</div> 
            </div> 
            <div className="stat"> 
              <div className="stat-value">{property.BathroomsTotalInteger}</div> 
              <div className="stat-label">Bathrooms</div> 
            </div> 
            {property.LivingArea && ( 
              <div className="stat"> 
                <div className="stat-value">{property.LivingArea.toLocaleString()}</div> 
                <div className="stat-label">Sq Ft</div> 
              </div> 
            )} 
            {property.YearBuilt && ( 
              <div className="stat"> 
                <div className="stat-value">{property.YearBuilt}</div> 
                <div className="stat-label">Year Built</div> 
              </div> 
            )} 
          </div> 
 
          <div className="property-section"> 
            <h2>Property Details</h2> 
            <div className="detail-grid"> 
              {property.PropertyType && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Property Type:</span> 
                  <span className="detail-value">{property.PropertyType}</span> 
                </div> 
              )} 
              {property.PropertySubType && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Property Subtype:</span> 
                  <span className="detail-value">{property.PropertySubType}</span> 
                </div> 
              )} 
              {property.LotSizeAcres && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Lot Size:</span> 
                  <span className="detail-value">{property.LotSizeAcres} acres</span> 
                </div> 
              )} 
              {property.ParkingTotal && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Parking Spaces:</span> 
                  <span className="detail-value">{property.ParkingTotal}</span> 
                </div> 
              )} 
            </div> 
          </div> 
 
          {property.PublicRemarks && ( 
            <div className="property-section"> 
              <h2>Description</h2> 
              <p className="property-description">{property.PublicRemarks}</p> 
            </div> 
          )} 
        </div> 
 
        <div className="property-sidebar"> 
          <div className="open-houses-section"> 
            <h3>Open Houses</h3> 
            {openHouses.length > 0 ? ( 
              <div className="open-houses-list"> 
                {openHouses.map((oh, index) => ( 
                  <div key={index} className="open-house-item"> 
                    <div className="oh-date"> 
                      {new Date(oh.OpenHouseDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} 
                    </div> 
                    <div className="oh-time"> 
                      {oh.OpenHouseStartTime} - {oh.OpenHouseEndTime} 
                    </div> 
                    {oh.OpenHouseRemarks && ( 
                      <div className="oh-remarks">{oh.OpenHouseRemarks}</div> 
                    )} 
                  </div> 
                ))} 
              </div> 
            ) : ( 
              <p className="no-open-houses">No open houses scheduled</p> 
            )} 
          </div> 
 
          <div className="listing-info-section"> 
            <h3>Listing Information</h3> 
            <div className="listing-info"> 
              {property.ListingId && ( 
                <div className="info-item"> 
                  <span className="info-label">MLS #:</span> 
                  <span className="info-value">{property.ListingId}</span> 
                </div> 
              )} 
              {property.StandardStatus && ( 
                <div className="info-item"> 
                  <span className="info-label">Status:</span> 
                  <span className="info-value">{property.StandardStatus}</span> 
                </div> 
              )} 
              {property.ListingContractDate && ( 
                <div className="info-item"> 
                  <span className="info-label">Listed:</span> 
                  <span className="info-value"> 
                    {new Date(property.ListingContractDate).toLocaleDateString()} 
                  </span> 
                </div> 
              )} 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default PropertyDetailPage;