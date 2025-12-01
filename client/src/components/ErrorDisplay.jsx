import '../index.css';

const ErrorDisplay = ({ message, type = 'api' }) => {
  const getHelperText = () => {
    if (type === 'location') {
      return 'Please enable location services or enter coordinates manually to search for stores.';
    }
    return 'Please check your internet connection and try again.';
  };

  return (
    <div className="error-display-container">
      <div className="error-display-icon">✕</div>
      <div className="error-display-message">{message}</div>
      <div className="error-display-helper">{getHelperText()}</div>
    </div>
  );
};

export default ErrorDisplay;
