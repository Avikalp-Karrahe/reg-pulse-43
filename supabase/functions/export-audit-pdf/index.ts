import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PDF generation using jsPDF
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF export request');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { call_id } = await req.json();
    
    if (!call_id) {
      throw new Error('call_id is required');
    }

    console.log('Fetching call data for:', call_id);

    // Fetch call data
    const { data: callData, error: callError } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('call_id', call_id)
      .maybeSingle();

    if (callError) {
      console.error('Error fetching call:', callError);
      throw callError;
    }

    if (!callData) {
      throw new Error('Call not found');
    }

    // Fetch issues for this call
    const { data: issuesData, error: issuesError } = await supabaseClient
      .from('issues')
      .select('*')
      .eq('call_id', callData.id)
      .order('timestamp', { ascending: true });

    if (issuesError) {
      console.error('Error fetching issues:', issuesError);
      throw issuesError;
    }

    console.log(`Found ${issuesData?.length || 0} issues for call`);

    // Generate PDF
    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Compliance Audit Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Call ID: ${callData.call_id}`, 20, 45);
    pdf.text(`Date: ${new Date(callData.started_at).toLocaleDateString()}`, 20, 55);
    pdf.text(`Duration: ${callData.duration_sec ? Math.floor(callData.duration_sec / 60) + ':' + (callData.duration_sec % 60).toString().padStart(2, '0') : 'N/A'}`, 20, 65);
    pdf.text(`Risk Score: ${callData.risk_score || 'N/A'}`, 20, 75);
    
    // Issues section
    let yPos = 95;
    pdf.setFontSize(16);
    pdf.text('Compliance Issues', 20, yPos);
    yPos += 15;
    
    if (!issuesData || issuesData.length === 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 128, 0);
      pdf.text('✓ No compliance issues detected', 20, yPos);
    } else {
      pdf.setFontSize(10);
      
      // Table headers
      pdf.setTextColor(0, 0, 0);
      pdf.text('Time', 20, yPos);
      pdf.text('Severity', 50, yPos);
      pdf.text('Category', 85, yPos);
      pdf.text('Regulation', 130, yPos);
      yPos += 10;
      
      // Draw header line
      pdf.line(20, yPos - 5, 190, yPos - 5);
      
      issuesData.forEach((issue, index) => {
        // Check if we need a new page
        if (yPos > 270) {
          pdf.addPage();
          yPos = 30;
        }
        
        const timestamp = issue.evidence_start_ms 
          ? `${Math.floor(issue.evidence_start_ms / 60000)}:${Math.floor((issue.evidence_start_ms % 60000) / 1000).toString().padStart(2, '0')}`
          : new Date(issue.timestamp).toLocaleTimeString();
        
        // Set severity color
        switch (issue.severity?.toLowerCase()) {
          case 'critical':
            pdf.setTextColor(220, 38, 38);
            break;
          case 'high':
            pdf.setTextColor(249, 115, 22);
            break;
          case 'medium':
            pdf.setTextColor(234, 179, 8);
            break;
          case 'low':
            pdf.setTextColor(34, 197, 94);
            break;
          default:
            pdf.setTextColor(0, 0, 0);
        }
        
        pdf.text(timestamp, 20, yPos);
        pdf.text(issue.severity?.toUpperCase() || 'N/A', 50, yPos);
        
        pdf.setTextColor(0, 0, 0);
        pdf.text(issue.category || 'N/A', 85, yPos);
        pdf.text(issue.reg_reference || 'N/A', 130, yPos);
        
        yPos += 10;
        
        // Add rationale if available
        if (issue.rationale || issue.model_rationale) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const rationale = issue.model_rationale || issue.rationale;
          const lines = pdf.splitTextToSize(rationale, 160);
          pdf.text(lines, 25, yPos);
          yPos += lines.length * 3 + 5;
          pdf.setFontSize(10);
        }
        
        // Add evidence snippet if available
        if (issue.evidence_snippet) {
          pdf.setFontSize(8);
          pdf.setTextColor(60, 60, 60);
          pdf.text('Evidence: ', 25, yPos);
          const evidence = pdf.splitTextToSize(issue.evidence_snippet, 150);
          pdf.text(evidence, 50, yPos);
          yPos += evidence.length * 3 + 8;
          pdf.setFontSize(10);
        }
        
        // Add separator line
        pdf.setTextColor(200, 200, 200);
        pdf.line(20, yPos - 3, 190, yPos - 3);
        yPos += 5;
      });
    }
    
    // Timeline section
    if (issuesData && issuesData.length > 0) {
      yPos += 15;
      if (yPos > 250) {
        pdf.addPage();
        yPos = 30;
      }
      
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Issue Timeline', 20, yPos);
      yPos += 15;
      
      // Create a simple timeline
      const timelineWidth = 150;
      const timelineStart = 20;
      const maxTime = Math.max(...issuesData.map(i => i.evidence_start_ms || 0));
      
      if (maxTime > 0) {
        // Draw timeline base
        pdf.line(timelineStart, yPos, timelineStart + timelineWidth, yPos);
        
        issuesData.forEach(issue => {
          if (issue.evidence_start_ms) {
            const position = timelineStart + (issue.evidence_start_ms / maxTime) * timelineWidth;
            
            // Set color based on severity
            switch (issue.severity?.toLowerCase()) {
              case 'critical':
                pdf.setDrawColor(220, 38, 38);
                pdf.setFillColor(220, 38, 38);
                break;
              case 'high':
                pdf.setDrawColor(249, 115, 22);
                pdf.setFillColor(249, 115, 22);
                break;
              case 'medium':
                pdf.setDrawColor(234, 179, 8);
                pdf.setFillColor(234, 179, 8);
                break;
              default:
                pdf.setDrawColor(34, 197, 94);
                pdf.setFillColor(34, 197, 94);
            }
            
            // Draw tick mark
            pdf.circle(position, yPos, 2, 'F');
            
            // Add timestamp label
            pdf.setFontSize(8);
            const timeLabel = `${Math.floor(issue.evidence_start_ms / 60000)}:${Math.floor((issue.evidence_start_ms % 60000) / 1000).toString().padStart(2, '0')}`;
            pdf.text(timeLabel, position - 5, yPos + 8);
          }
        });
      }
    }
    
    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 20, 285);
      pdf.text(`Page ${i} of ${pageCount}`, 160, 285);
      pdf.text('Model Version: GPT-4o', 20, 290);
    }
    
    // Generate PDF buffer
    const pdfBuffer = pdf.output('arraybuffer');
    
    console.log('PDF generated successfully');
    
    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="audit-report-${call_id}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});