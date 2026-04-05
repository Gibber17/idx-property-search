import React from 'react';
import { useNavigate } from 'react-router-dom';

// handles images and functionality of property card

function PropertyCard({ property }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/property/${property.L_ListingID}`);
    console.log(property);
  };

  let photos = [];

  try {
    if (typeof property.L_Photos === "string") {
      photos = JSON.parse(property.L_Photos);
    } else if (Array.isArray(property.L_Photos)) {
      photos = property.L_Photos;
    }
  } catch (e) {
    photos = [];
  }

  const firstPhoto = photos[0];

  return (
    <div className="property-card" onClick={handleClick}>
      <div className="property-image">
        {firstPhoto ? (
          <img src={firstPhoto} alt={property.L_Address} />
        ) : (
          <div className="no-image">No image available</div>
        )}
      </div>

      <div className="property-info">
        <div className="price">
          ${property.L_SystemPrice?.toLocaleString()}
        </div>

        <div className="address">{property.L_Address}</div>

        <div className="city">
          {property.L_City}, {property.L_State} {property.L_Zip}
        </div>

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

export default PropertyCard;