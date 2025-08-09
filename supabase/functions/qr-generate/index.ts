import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// QR Code generation using SVG
function generateQRCodeSVG(data: string, size: number = 200): string {
  // Simple QR code generation - in production, use a proper QR library
  const modules = 21; // 21x21 for version 1 QR code
  const moduleSize = size / modules;
  
  // Create a simple pattern (this is a simplified version)
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Generate pattern based on data (simplified)
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Simple pattern generation based on data hash
      const hash = Array.from(data).reduce((a, b) => a + b.charCodeAt(0), 0);
      if ((hash + row * modules + col) % 3 === 0) {
        const x = col * moduleSize;
        const y = row * moduleSize;
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

// Add branding to QR code
function addBrandingToQR(qrSvg: string, locationName: string, brandColor: string, logoUrl?: string): string {
  const size = 300;
  const qrSize = 200;
  const qrOffset = (size - qrSize) / 2;
  
  let brandedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 80}" viewBox="0 0 ${size} ${size + 80}">`;
  
  // Background
  brandedSvg += `<rect width="${size}" height="${size + 80}" fill="white" stroke="${brandColor}" stroke-width="3"/>`;
  
  // TUPÁ Logo area
  brandedSvg += `<rect x="10" y="10" width="280" height="30" fill="${brandColor}" rx="5"/>`;
  brandedSvg += `<text x="150" y="30" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">TUPÁ HUB</text>`;
  
  // Cafe name
  brandedSvg += `<text x="150" y="60" text-anchor="middle" fill="${brandColor}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${locationName}</text>`;
  
  // QR Code (extract the inner content)
  const qrContent = qrSvg.replace(/<svg[^>]*>|<\/svg>/g, '');
  brandedSvg += `<g transform="translate(${qrOffset}, 70)">${qrContent}</g>`;
  
  // Instructions
  brandedSvg += `<text x="150" y="290" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="12">Escanea para dejar tu feedback</text>`;
  brandedSvg += `<text x="150" y="305" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="12">y participar en sorteos</text>`;
  
  brandedSvg += '</svg>';
  return brandedSvg;
}

// Convert SVG to PNG (simplified - in production use proper conversion)
function svgToPng(svgString: string): Uint8Array {
  // This is a placeholder - in production, use proper SVG to PNG conversion
  // For now, we'll return the SVG as bytes
  return new TextEncoder().encode(svgString);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { location_id, format = 'svg' } = await req.json();

    if (!location_id) {
      return new Response(JSON.stringify({ error: 'location_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Get location and branding information
    const { data: mapping, error: mappingError } = await supabase
      .from('cafes_locations_mapping')
      .select('cafe_id, location_name, brand_color, logo_url')
      .eq('location_id', location_id)
      .single();

    if (mappingError || !mapping) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate QR code data (URL to feedback form)
    const qrData = `${supabaseUrl.replace('//', '//').replace(':3000', '.lovable.app')}/feedback/${location_id}`;

    console.log('Generating QR for location:', mapping.location_name, 'URL:', qrData);

    // Generate QR code
    const qrSvg = generateQRCodeSVG(qrData);
    const brandedQR = addBrandingToQR(qrSvg, mapping.location_name, mapping.brand_color || '#8B5CF6', mapping.logo_url);

    // Update cafe with QR generation timestamp for backward compatibility
    if (mapping.cafe_id) {
      await supabase
        .from('cafes')
        .update({ qr_generated_at: new Date().toISOString() })
        .eq('id', mapping.cafe_id);
    }

    const fileName = `qr-${mapping.location_name.replace(/\s+/g, '-').toLowerCase()}`;

    if (format === 'png') {
      const pngData = svgToPng(brandedQR);
      return new Response(pngData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${fileName}.png"`
        }
      });
    } else {
      return new Response(brandedQR, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="${fileName}.svg"`
        }
      });
    }

  } catch (error) {
    console.error('Error generating QR code:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});