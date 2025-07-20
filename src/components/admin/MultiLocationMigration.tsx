import { useState } from 'react';
import { Database, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MigrationSummary {
  groupsCreated: number;
  locationsCreated: number;
  usersUpdated: number;
  recipesUpdated: number;
  consumptionsUpdated: number;
  errors: string[];
}

interface MigrationResult {
  success: boolean;
  message: string;
  summary: MigrationSummary;
  dryRun: boolean;
}

export function MultiLocationMigration() {
  const [isRunning, setIsRunning] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [defaultGroupName, setDefaultGroupName] = useState('Main Café');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    if (!defaultGroupName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a default group name",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase.functions.invoke('migrate-multi-location', {
        body: {
          dryRun,
          defaultGroupName: defaultGroupName.trim()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Migration failed');
      }

      setResult(data);

      if (data.success) {
        toast({
          title: dryRun ? "Dry Run Completed" : "Migration Completed",
          description: data.message,
        });
      } else {
        toast({
          title: "Migration Failed",
          description: data.details || 'Unknown error occurred',
          variant: "destructive",
        });
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Migration failed';
      console.error('Migration error:', error);
      
      toast({
        title: "Migration Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Multi-Location Data Migration
        </CardTitle>
        <CardDescription>
          Backfill existing data to support the new multi-location structure.
          This will create groups and locations, then assign existing users, recipes, and consumptions.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Default Group Name</Label>
            <Input
              id="groupName"
              value={defaultGroupName}
              onChange={(e) => setDefaultGroupName(e.target.value)}
              placeholder="Enter the name for your main café group"
              disabled={isRunning}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dryRun"
              checked={dryRun}
              onCheckedChange={(checked) => setDryRun(checked as boolean)}
              disabled={isRunning}
            />
            <Label htmlFor="dryRun" className="text-sm">
              Dry run (preview changes without executing)
            </Label>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This migration will modify your database structure. 
            {dryRun ? ' Run a dry run first to preview changes.' : ' Make sure you have a backup before proceeding.'}
          </AlertDescription>
        </Alert>

        <Button
          onClick={runMigration}
          disabled={isRunning || !defaultGroupName.trim()}
          className="w-full"
          variant={dryRun ? "outline" : "default"}
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning 
            ? `Running ${dryRun ? 'Dry Run' : 'Migration'}...` 
            : `${dryRun ? 'Run Dry Run' : 'Execute Migration'}`
          }
        </Button>

        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                <strong>{result.dryRun ? 'Dry Run' : 'Migration'} {result.success ? 'Completed' : 'Failed'}:</strong> {result.message}
              </AlertDescription>
            </Alert>

            {result.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Migration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Groups created:</span>
                      <span className="ml-2">{result.summary.groupsCreated}</span>
                    </div>
                    <div>
                      <span className="font-medium">Locations created:</span>
                      <span className="ml-2">{result.summary.locationsCreated}</span>
                    </div>
                    <div>
                      <span className="font-medium">Users updated:</span>
                      <span className="ml-2">{result.summary.usersUpdated}</span>
                    </div>
                    <div>
                      <span className="font-medium">Recipes updated:</span>
                      <span className="ml-2">{result.summary.recipesUpdated}</span>
                    </div>
                    <div>
                      <span className="font-medium">Consumptions updated:</span>
                      <span className="ml-2">{result.summary.consumptionsUpdated}</span>
                    </div>
                    <div>
                      <span className="font-medium">Errors:</span>
                      <span className="ml-2 text-red-600">{result.summary.errors.length}</span>
                    </div>
                  </div>

                  {result.summary.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                        {result.summary.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {result.success && result.dryRun && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Dry run completed successfully! You can now uncheck "Dry run" and execute the actual migration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}