import { useState, useEffect } from 'react'; 
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
 
  // Handle Photos
  /*let coverPhoto = null;
  try {
    if (property.L_Photos) {
      // 1. Parse the string into a real JavaScript array
      const photoArray = typeof property.L_Photos === 'string' 
        ? JSON.parse(property.L_Photos) 
        : property.L_Photos;

      // 2. Grab the first item (the URL string)
      if (Array.isArray(photoArray) && photoArray.length > 0) {
        coverPhoto = photoArray[0];
      }
    }
  } catch (e) {
    console.error("Error parsing photos:", e);
  }*/

  const photos = property.L_Photos ? (Array.isArray(property.L_Photos) ? property.L_Photos : [property.L_Photos]) : [];
  const coverPhoto = photos[0] || null;

  
  return ( 
    <div className="property-detail-page"> 
      <button onClick={() => navigate('/')} className="btn-back"> 
        ← Back to Listings 
      </button> 
 
      <div className="property-header"> 
        {/* Mapped: ListPrice -> L_SystemPrice */}
        <h1>${property.L_SystemPrice?.toLocaleString()}</h1> 
        <p className="property-address">{property.UnparsedAddress}</p> 
        <p className="property-location"> 
          {/*Updated property variable names*/}
          {property.L_City}, {property.L_State} {property.L_zip} 
        </p> 
      </div> 
 
      <div className="property-image-main"> 
        {coverPhoto ? ( 
          <img src={coverPhoto} alt={property.L_Address} /> 
        ) : ( 
          <div className="no-image">No image available</div> 
        )} 
      </div> 
 
      <div className="property-content"> 
        <div className="property-main"> 
          <div className="property-stats"> 
            <div className="stat"> 
              {/* Mapped: BedroomsTotal -> L_Keyword2 */}
              <div className="stat-value">{property.L_Keyword2}</div> 
              <div className="stat-label">Bedrooms</div> 
            </div> 
            <div className="stat"> 
              {/* Mapped: BathroomsTotalInteger -> LM_Dec_3 */}
              <div className="stat-value">{property.LM_Dec_3}</div> 
              <div className="stat-label">Bathrooms</div> 
            </div> 
            {property.LivingArea && ( 
              <div className="stat">
                {/* Mapped: LivingArea -> LM_Int2_3 */} 
                <div className="stat-value">{property.LM_Int2_3.toLocaleString()}</div> 
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
              {property.L_Type_ && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Property Type:</span> 
                  <span className="detail-value">{property.L_Type_}</span> 
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
              {property.L_Keyword5 && ( 
                <div className="detail-item"> 
                  <span className="detail-label">Parking Spaces:</span> 
                  <span className="detail-value">{property.L_Keyword5}</span> 
                </div> 
              )} 
            </div> 
          </div> 
 
          {/* Mapped: PublicRemarks -> L_Remarks */}
          {property.L_Remarks && ( 
            <div className="property-section"> 
              <h2>Description</h2> 
              <p className="property-description">{property.L_Remarks}</p> 
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
                      {oh.OH_StartTime} - {oh.OH_EndTime} 
                    </div> 
                    {/* Removed oh.all_data to fix the JSON blob bug */} 
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
              {property.L_ListingID && ( 
                <div className="info-item"> 
                  <span className="info-label">MLS #:</span> 
                  <span className="info-value">{property.L_ListingID}</span> 
                </div> 
              )} 
              {/* Mapped: StandardStatus -> L_Status */}
              {property.L_Status && ( 
                <div className="info-item"> 
                  <span className="info-label">Status:</span> 
                  <span className="info-value">{property.L_Status}</span> 
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