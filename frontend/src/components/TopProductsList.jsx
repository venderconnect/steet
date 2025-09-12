import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TopProductsList = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {data.map((product, index) => (
            <li key={product._id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-500 mr-4">{index + 1}</span>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-500">Sold: {product.totalQuantitySold}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TopProductsList;