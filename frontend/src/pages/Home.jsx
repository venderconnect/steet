import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Connect. Order. Grow.</h1>
      <p className="text-xl text-muted-foreground mb-8">
        The digital platform connecting street food vendors with trusted suppliers.
      </p>
      {isAuthenticated ? (
        <Button asChild><Link to="/products">Browse Products</Link></Button>
      ) : (
        <div className="space-x-4">
          <Button asChild><Link to="/register">Get Started</Link></Button>
          <Button variant="outline" asChild><Link to="/login">Login</Link></Button>
        </div>
      )}
    </div>
  );
};

export default Home;
