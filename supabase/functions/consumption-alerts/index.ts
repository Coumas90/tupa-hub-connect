import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsumptionData {
  date: string;
  amount: number;
  variety: string;
  format: string;
}

interface AlertAnalysis {
  hasAbruptChange: boolean;
  isLowConsumption: boolean;
  standardDeviation: number;
  meanConsumption: number;
  currentVsAverage: number;
  lastRestockDays: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  insights: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Processing consumption alerts for user:', user.id);

    // Get consumption data for the last 30 days (simulated data for now)
    const consumptionData: ConsumptionData[] = [
      { date: '2024-01-01', amount: 2.5, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-02', amount: 2.8, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-03', amount: 2.3, variety: 'Montaña Azul', format: 'Filtrado' },
      { date: '2024-01-04', amount: 2.7, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-05', amount: 1.2, variety: 'Finca La Esperanza', format: 'Espresso' }, // Low consumption
      { date: '2024-01-06', amount: 2.6, variety: 'Origen Nariño', format: 'Americano' },
      { date: '2024-01-07', amount: 2.9, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-08', amount: 2.4, variety: 'Montaña Azul', format: 'Filtrado' },
      { date: '2024-01-09', amount: 5.8, variety: 'Finca La Esperanza', format: 'Espresso' }, // Abrupt change
      { date: '2024-01-10', amount: 2.2, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-11', amount: 2.5, variety: 'Valle del Cauca', format: 'Cold Brew' },
      { date: '2024-01-12', amount: 2.7, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-13', amount: 2.3, variety: 'Huila Premium', format: 'Cappuccino' },
      { date: '2024-01-14', amount: 2.8, variety: 'Finca La Esperanza', format: 'Espresso' },
      { date: '2024-01-15', amount: 0.8, variety: 'Finca La Esperanza', format: 'Espresso' }, // Very low
    ];

    // Calculate statistical metrics
    const amounts = consumptionData.map(d => d.amount);
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Get current day consumption (last entry)
    const currentConsumption = amounts[amounts.length - 1];
    const currentVsAverage = ((currentConsumption - mean) / mean) * 100;

    // Detect abrupt changes (>2 standard deviations from mean)
    const hasAbruptChange = amounts.some(amount => Math.abs(amount - mean) > 2 * standardDeviation);
    
    // Detect low consumption (>20% below average)
    const isLowConsumption = currentConsumption < (mean * 0.8);

    // Calculate days since last restock (simulated)
    const lastRestockDays = 12;

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (currentConsumption < (mean * 0.5)) severity = 'critical';
    else if (isLowConsumption && hasAbruptChange) severity = 'high';
    else if (isLowConsumption || hasAbruptChange) severity = 'medium';

    console.log('Statistical analysis:', {
      mean,
      standardDeviation,
      currentConsumption,
      currentVsAverage,
      hasAbruptChange,
      isLowConsumption,
      severity
    });

    // Prepare data for AI analysis
    const analysisPrompt = `
    Analyze this coffee consumption data and provide insights:
    
    Statistical Data:
    - Mean daily consumption: ${mean.toFixed(2)}kg
    - Standard deviation: ${standardDeviation.toFixed(2)}kg
    - Current consumption: ${currentConsumption}kg
    - Current vs average: ${currentVsAverage.toFixed(1)}%
    - Days since last restock: ${lastRestockDays}
    - Has abrupt changes: ${hasAbruptChange}
    - Is low consumption: ${isLowConsumption}
    - Severity level: ${severity}
    
    Daily consumption data (last 15 days):
    ${consumptionData.map(d => `${d.date}: ${d.amount}kg (${d.variety} - ${d.format})`).join('\n')}
    
    Please provide:
    1. A clear recommendation for action
    2. 2-3 specific insights about consumption patterns
    3. Keep the tone professional but conversational
    4. Focus on actionable advice for a coffee business manager
    
    Respond in JSON format:
    {
      "recommendation": "specific action to take",
      "insights": ["insight 1", "insight 2", "insight 3"]
    }
    `;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI analyst specialized in coffee consumption patterns for businesses. Provide clear, actionable insights.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const openAIData = await openAIResponse.json();
    const aiAnalysis = JSON.parse(openAIData.choices[0].message.content);

    console.log('AI analysis completed:', aiAnalysis);

    // Prepare final analysis
    const alertAnalysis: AlertAnalysis = {
      hasAbruptChange,
      isLowConsumption,
      standardDeviation: Number(standardDeviation.toFixed(2)),
      meanConsumption: Number(mean.toFixed(2)),
      currentVsAverage: Number(currentVsAverage.toFixed(1)),
      lastRestockDays,
      severity,
      recommendation: aiAnalysis.recommendation,
      insights: aiAnalysis.insights || []
    };

    return new Response(JSON.stringify({
      success: true,
      analysis: alertAnalysis,
      rawData: {
        consumptionData,
        statistics: {
          mean,
          standardDeviation,
          currentConsumption
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in consumption-alerts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});