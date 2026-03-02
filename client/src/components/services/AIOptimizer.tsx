import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { optimizeServiceDescription } from '../../services/aiService';

interface AIOptimizerProps {
  currentDescription: string;
  serviceName: string;
  category: string;
  onOptimized: (optimized: string) => void;
}

export const AIOptimizer: React.FC<AIOptimizerProps> = ({
  currentDescription,
  serviceName,
  category,
  onOptimized,
}) => {
  const [loading, setLoading] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const result = await optimizeServiceDescription(
        currentDescription,
        serviceName,
        category
      );
      setOptimized(result);
    } catch (error: any) {
      alert('Failed to optimize: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Service Optimizer
        </CardTitle>
        <CardDescription>
          Let AI improve your service description to be more engaging and SEO-friendly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Optimize Description
            </>
          )}
        </Button>

        {optimized && (
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Optimized Description:</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{optimized}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onOptimized(optimized);
                  setOptimized(null);
                }}
                className="flex-1"
              >
                Use This Version
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOptimized(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
