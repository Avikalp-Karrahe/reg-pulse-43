import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenAIRealtimeMessage {
  type: string;
  [key: string]: any;
}

// Handle WebSocket upgrade and proxy to OpenAI Realtime API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('Realtime compliance function called, method:', req.method, 'headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 400 });
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error('OpenAI API key not found');
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  try {
    // Upgrade the connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to OpenAI Realtime API using correct authentication format
    console.log('Connecting to OpenAI Realtime API...');
    const openaiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      ['realtime', `openai-insecure-api-key.${openaiApiKey}`]
    );

    let sessionConfigured = false;

    // Handle OpenAI WebSocket events
    openaiWs.onopen = () => {
      console.log('✅ Successfully connected to OpenAI Realtime API');
    };

    openaiWs.onmessage = (event) => {
      console.log('OpenAI message received:', event.data);
      const data = JSON.parse(event.data);
      
      // Configure session after receiving session.created
      if (data.type === 'session.created' && !sessionConfigured) {
        console.log('Configuring session...');
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `LANGUAGE OVERRIDE: You must respond ONLY in English. Never use Spanish or any other language.

You are a financial compliance AI assistant. Regardless of what language the user speaks to you in, you MUST respond in English only.

If someone says "Hola" or speaks Spanish, respond with "Hello, I can hear you clearly. I'm required to communicate only in English for compliance purposes. How can I help you today?"

STRICT RULES:
1. ENGLISH ONLY - Never respond in Spanish, French, or any other language
2. If user speaks another language, acknowledge but respond in English
3. This is a regulatory requirement - no exceptions

Your role:
- Monitor calls for compliance violations
- Flag suspicious language and provide warnings in ENGLISH
- Log compliance issues using the provided tools
- Maintain professional tone while ensuring regulatory compliance

Critical areas to monitor:
- Performance guarantees (SEC violations)
- Unsuitable investment advice (FINRA 2111)  
- Misrepresentation of risks or returns
- Disclosure failures

ENGLISH ONLY RESPONSES - This is mandatory for regulatory compliance.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [
              {
                type: 'function',
                name: 'log_compliance_issue',
                description: 'Log a detected compliance violation with details for regulatory reporting',
                parameters: {
                  type: 'object',
                  properties: {
                    category: {
                      type: 'string',
                      enum: ['Performance Guarantees', 'Unsuitable Advice', 'Risk Misrepresentation', 'Disclosure Failure']
                    },
                    severity: {
                      type: 'string',
                      enum: ['low', 'medium', 'high', 'critical']
                    },
                    rationale: {
                      type: 'string',
                      description: 'Detailed explanation of why this is a compliance issue'
                    },
                    evidence_snippet: {
                      type: 'string',
                      description: 'The specific quote or phrase that triggered the violation'
                    },
                    reg_reference: {
                      type: 'string',
                      description: 'Relevant regulation or rule reference (e.g., SEC 10b-5, FINRA 2111)'
                    }
                  },
                  required: ['category', 'severity', 'rationale', 'evidence_snippet', 'reg_reference']
                }
              },
              {
                type: 'function',
                name: 'provide_compliance_guidance',
                description: 'Provide real-time guidance to help avoid compliance violations',
                parameters: {
                  type: 'object',
                  properties: {
                    warning_type: {
                      type: 'string',
                      enum: ['preventive', 'corrective', 'educational']
                    },
                    guidance: {
                      type: 'string',
                      description: 'Specific guidance or warning to provide'
                    }
                  },
                  required: ['warning_type', 'guidance']
                }
              }
            ],
            tool_choice: 'auto',
            temperature: 0.3,
            max_response_output_tokens: 'inf'
          }
        };
        
        openaiWs.send(JSON.stringify(sessionConfig));
        sessionConfigured = true;
        console.log('Session configuration sent');
      }

      // Handle function calls
      if (data.type === 'response.function_call_arguments.done') {
        console.log('Function call completed:', data);
        try {
          const args = JSON.parse(data.arguments);
          
          if (data.name === 'log_compliance_issue') {
            // Forward compliance issue to client
            clientSocket.send(JSON.stringify({
              type: 'compliance_issue',
              issue: {
                category: args.category,
                severity: args.severity,
                rationale: args.rationale,
                evidenceSnippet: args.evidence_snippet,
                reg_reference: args.reg_reference,
                timestamp: new Date().toISOString()
              }
            }));
          } else if (data.name === 'provide_compliance_guidance') {
            // Forward guidance to client
            clientSocket.send(JSON.stringify({
              type: 'compliance_guidance',
              guidance: {
                warning_type: args.warning_type,
                guidance: args.guidance,
                timestamp: new Date().toISOString()
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing function arguments:', error);
        }
      }

      // Forward all OpenAI messages to client
      clientSocket.send(event.data);
    };

    openaiWs.onerror = (error) => {
      console.error('❌ OpenAI WebSocket error:', error);
      console.error('OpenAI WebSocket error details:', JSON.stringify(error));
      clientSocket.send(JSON.stringify({
        type: 'error',
        message: 'Connection to AI service failed'
      }));
    };

    openaiWs.onclose = () => {
      console.log('OpenAI WebSocket closed');
      clientSocket.close();
    };

    // Handle client WebSocket events
    clientSocket.onopen = () => {
      console.log('✅ Client successfully connected to realtime compliance');
    };

    clientSocket.onmessage = (event) => {
      console.log('Client message received:', event.data);
      // Forward client messages to OpenAI
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(event.data);
      }
    };

    clientSocket.onclose = () => {
      console.log('Client disconnected');
      openaiWs.close();
    };

    clientSocket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
      openaiWs.close();
    };

    return response;

  } catch (error) {
    console.error('Error setting up WebSocket connection:', error);
    return new Response(`WebSocket setup failed: ${error.message}`, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});