import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="not-found">
      <h2>404 - Page Not Found</h2>
      <button onClick={() => navigate('/Home')}>
        Return to Home
      </button>
    </div>
  );
}

export default NotFound;