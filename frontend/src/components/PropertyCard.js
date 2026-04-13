import { useNavigate } from 'react-router-dom';
import { safeParsePhotos } from '../utils/PhotoUtils';
import PropTypes from 'prop-types';

function PropertyCard({ property }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/property/${property.L_ListingID}`);
  };
  
  const photos = safeParsePhotos(property.L_Photos);
  const coverPhoto = photos[0];

  return (
    <div className="property-card" onClick={handleClick}>
      <div className="property-image">
        {coverPhoto ? (
          <img src={coverPhoto} alt={property.L_Address} />
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

PropertyCard.propTypes = {
  property: PropTypes.shape({
    L_ListingID: PropTypes.string.isRequired,
    L_SystemPrice: PropTypes.number,
    L_Address: PropTypes.string,
    L_City: PropTypes.string,
    L_State: PropTypes.string,
    L_Zip: PropTypes.string,
    L_Keyword2: PropTypes.number,
    LM_Dec_3: PropTypes.number,
    LM_Int2_3: PropTypes.number,
    L_Photos: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ])
  }).isRequired
};

export default PropertyCard;