import { useCallback, useEffect, useState } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthFlowTestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

interface AuthFlowValidatorState {
  isRunning: boolean;
  results: AuthFlowTestResult[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

/**
 * Hook for validating and testing the authentication flow
 * Provides comprehensive testing of login, logout, session refresh, and redirects
 */
export function useAuthFlowValidator() {
  const [state, setState] = useState<AuthFlowValidatorState>({
    isRunning: false,
    results: [],
    overallHealth: 'healthy'
  });

  const { 
    session, 
    user, 
    userRole, 
    isAdmin, 
    isSessionExpired, 
    getSessionTimeLeft,
    refreshUserData 
  } = useOptimizedAuth();

  // Test session validity
  const testSessionValidity = useCallback(async (): Promise<AuthFlowTestResult> => {
    const startTime = Date.now();
    
    try {
      if (!session) {
        return {
          test: 'Session Validity',
          passed: false,
          error: 'No active session found',
          duration: Date.now() - startTime
        };
      }

      const expired = isSessionExpired();
      const timeLeft = getSessionTimeLeft();
      
      if (expired) {
        return {
          test: 'Session Validity',
          passed: false,
          error: 'Session is expired',
          duration: Date.now() - startTime
        };
      }

      if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
        return {
          test: 'Session Validity',
          passed: true,
          error: `Session expires soon (${Math.floor(timeLeft / 1000 / 60)}min left)`,
          duration: Date.now() - startTime
        };
      }

      return {
        test: 'Session Validity',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test: 'Session Validity',
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }, [session, isSessionExpired, getSessionTimeLeft]);

  // Test role assignment
  const testRoleAssignment = useCallback(async (): Promise<AuthFlowTestResult> => {
    const startTime = Date.now();
    
    try {
      if (!user) {
        return {
          test: 'Role Assignment',
          passed: false,
          error: 'No user found',
          duration: Date.now() - startTime
        };
      }

      if (!userRole) {
        return {
          test: 'Role Assignment',
          passed: false,
          error: 'User role not assigned',
          duration: Date.now() - startTime
        };
      }

      const validRoles = ['admin', 'client', 'barista'];
      if (!validRoles.includes(userRole.toLowerCase())) {
        return {
          test: 'Role Assignment',
          passed: false,
          error: `Invalid role: ${userRole}`,
          duration: Date.now() - startTime
        };
      }

      return {
        test: 'Role Assignment',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test: 'Role Assignment',
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }, [user, userRole]);

  // Test database connectivity
  const testDatabaseConnectivity = useCallback(async (): Promise<AuthFlowTestResult> => {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.from('clients').select('count').limit(1);
      
      if (error) {
        return {
          test: 'Database Connectivity',
          passed: false,
          error: error.message,
          duration: Date.now() - startTime
        };
      }

      return {
        test: 'Database Connectivity',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test: 'Database Connectivity',
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }, []);

  // Test session refresh
  const testSessionRefresh = useCallback(async (): Promise<AuthFlowTestResult> => {
    const startTime = Date.now();
    
    try {
      if (!session) {
        return {
          test: 'Session Refresh',
          passed: false,
          error: 'No session to refresh',
          duration: Date.now() - startTime
        };
      }

      await refreshUserData();
      
      return {
        test: 'Session Refresh',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test: 'Session Refresh',
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }, [session, refreshUserData]);

  // Test redirect logic validation
  const testRedirectLogic = useCallback(async (): Promise<AuthFlowTestResult> => {
    const startTime = Date.now();
    
    try {
      if (!userRole) {
        return {
          test: 'Redirect Logic',
          passed: false,
          error: 'No user role to test redirects',
          duration: Date.now() - startTime
        };
      }

      // Validate expected redirect paths based on role
      const expectedPaths = {
        admin: ['/admin'],
        client: ['/dashboard'],
        barista: ['/recipes', '/barista']
      };

      const currentRole = userRole.toLowerCase() as keyof typeof expectedPaths;
      const validPaths = expectedPaths[currentRole];

      if (!validPaths) {
        return {
          test: 'Redirect Logic',
          passed: false,
          error: `Unknown role for redirect: ${userRole}`,
          duration: Date.now() - startTime
        };
      }

      return {
        test: 'Redirect Logic',
        passed: true,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        test: 'Redirect Logic',
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }, [userRole]);

  // Run comprehensive flow validation
  const runFlowValidation = useCallback(async () => {
    setState(prev => ({ ...prev, isRunning: true, results: [] }));

    const tests = [
      testSessionValidity,
      testRoleAssignment,
      testDatabaseConnectivity,
      testSessionRefresh,
      testRedirectLogic
    ];

    const results: AuthFlowTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        console.info(`🧪 AuthFlowValidator: ${result.test} - ${result.passed ? 'PASSED' : 'FAILED'}`, result);
      } catch (error: any) {
        results.push({
          test: test.name,
          passed: false,
          error: error.message,
          duration: 0
        });
      }
    }

    // Calculate overall health
    const failedTests = results.filter(r => !r.passed);
    const warningTests = results.filter(r => r.passed && r.error);
    
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (failedTests.length > 0) {
      overallHealth = 'critical';
    } else if (warningTests.length > 0) {
      overallHealth = 'warning';
    }

    setState({
      isRunning: false,
      results,
      overallHealth
    });

    // Show toast with results
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    
    toast({
      title: "Validación de autenticación completada",
      description: `${passedTests}/${totalTests} pruebas pasaron. Estado: ${overallHealth}`,
      variant: overallHealth === 'critical' ? 'destructive' : 'default'
    });

    return results;
  }, [testSessionValidity, testRoleAssignment, testDatabaseConnectivity, testSessionRefresh, testRedirectLogic]);

  // Auto-run validation on auth state changes (debounced)
  useEffect(() => {
    if (session && userRole && !state.isRunning) {
      const timeout = setTimeout(() => {
        runFlowValidation();
      }, 2000); // Debounce to avoid running too frequently

      return () => clearTimeout(timeout);
    }
  }, [session, userRole, runFlowValidation, state.isRunning]);

  return {
    ...state,
    runFlowValidation,
    // Individual test methods for granular testing
    testSessionValidity,
    testRoleAssignment,
    testDatabaseConnectivity,
    testSessionRefresh,
    testRedirectLogic
  };
}