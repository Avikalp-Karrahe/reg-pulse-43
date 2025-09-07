import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo call data
const DEMO_CALL_ID = '550e8400-e29b-41d4-a716-446655440001';
const DEMO_CALL_DATA = {
  id: DEMO_CALL_ID,
  call_id: 'demo_call_2025_001',
  started_at: new Date('2025-01-07T14:30:00Z').toISOString(),
  ended_at: new Date('2025-01-07T14:45:30Z').toISOString(),
  duration_sec: 930, // 15.5 minutes
  risk_score: 78,
  status: 'completed'
};

// Demo issues with realistic compliance violations
const DEMO_ISSUES = [
  {
    call_id: DEMO_CALL_ID,
    category: 'Explicit Guarantee',
    severity: 'critical',
    rationale: 'Financial advisor made explicit guarantees about investment returns, which violates SEC regulations as markets are inherently uncertain.',
    reg_reference: 'SEC Rule 10b-5',
    timestamp: new Date('2025-01-07T14:32:15Z').toISOString(),
    evidence_snippet: 'I can guarantee you\'ll see at least 15% returns this year. Our portfolio has never lost money, and I promise you won\'t be disappointed.',
    evidence_start_ms: 135000, // 2:15
    evidence_end_ms: 142000,   // 2:22
    model_rationale: 'Detected explicit guarantee language including "guarantee", "promise", and "never lost money" which are prohibited in investment advice.',
    model_version: 'rules-engine-v1.0'
  },
  {
    call_id: DEMO_CALL_ID,
    category: 'High-Pressure Sales Tactics',
    severity: 'high',
    rationale: 'Advisor used high-pressure tactics to rush client decision-making, violating FINRA standards for fair dealing.',
    reg_reference: 'FINRA Rule 2010',
    timestamp: new Date('2025-01-07T14:38:45Z').toISOString(),
    evidence_snippet: 'This is a limited time offer that expires today. You need to decide right now, or you\'ll miss out on this exclusive opportunity forever.',
    evidence_start_ms: 525000, // 8:45
    evidence_end_ms: 533000,   // 8:53
    model_rationale: 'Identified pressure tactics with phrases "limited time offer", "expires today", "decide right now", and "miss out forever".',
    model_version: 'rules-engine-v1.0'
  },
  {
    call_id: DEMO_CALL_ID,
    category: 'Unsuitable Investment Advice',
    severity: 'high',
    rationale: 'Recommendation appears unsuitable for client\'s risk profile without proper suitability assessment.',
    reg_reference: 'FINRA Rule 2111',
    timestamp: new Date('2025-01-07T14:41:20Z').toISOString(),
    evidence_snippet: 'You should put all your retirement savings into this high-growth tech fund. Don\'t worry about diversification - this is where the big money is.',
    evidence_start_ms: 680000, // 11:20
    evidence_end_ms: 688000,   // 11:28
    model_rationale: 'Detected unsuitable advice patterns: "all your retirement savings", "put all", and dismissal of diversification principles.',
    model_version: 'rules-engine-v1.0'
  },
  {
    call_id: DEMO_CALL_ID,
    category: 'Inadequate Risk Disclosure',
    severity: 'medium',
    rationale: 'Failed to adequately disclose investment risks and potential for losses as required by SEC regulations.',
    reg_reference: 'SEC Rule 10b-5',
    timestamp: new Date('2025-01-07T14:35:10Z').toISOString(),
    evidence_snippet: 'This investment is basically risk-free. The market only goes up in the long term, so there\'s really no downside to worry about.',
    evidence_start_ms: 310000, // 5:10
    evidence_end_ms: 318000,   // 5:18
    model_rationale: 'Inadequate risk disclosure detected with phrases "risk-free", "only goes up", and "no downside".',
    model_version: 'rules-engine-v1.0'
  },
  {
    call_id: DEMO_CALL_ID,
    category: 'Misleading Performance Claims',
    severity: 'medium',
    rationale: 'Made misleading claims about past performance without proper disclaimers about future results.',
    reg_reference: 'SEC Rule 206(4)-1',
    timestamp: new Date('2025-01-07T14:43:30Z').toISOString(),
    evidence_snippet: 'Our track record shows consistent 20% annual returns for the past five years. Based on this proven strategy, you can expect similar results.',
    evidence_start_ms: 810000, // 13:30
    evidence_end_ms: 819000,   // 13:39
    model_rationale: 'Misleading performance claims identified: "track record shows", "consistent returns", "proven strategy", "expect similar results".',
    model_version: 'rules-engine-v1.0'
  }
];

// Additional demo call for variety
const DEMO_CALL_2_ID = '550e8400-e29b-41d4-a716-446655440002';
const DEMO_CALL_2_DATA = {
  id: DEMO_CALL_2_ID,
  call_id: 'demo_call_2025_002',
  started_at: new Date('2025-01-06T10:15:00Z').toISOString(),
  ended_at: new Date('2025-01-06T10:28:45Z').toISOString(),
  duration_sec: 825, // 13.75 minutes
  risk_score: 25,
  status: 'completed'
};

const DEMO_ISSUES_2 = [
  {
    call_id: DEMO_CALL_2_ID,
    category: 'Inadequate Risk Disclosure',
    severity: 'low',
    rationale: 'Minor risk disclosure issue - advisor mentioned risks but could have been more comprehensive.',
    reg_reference: 'SEC Rule 10b-5',
    timestamp: new Date('2025-01-06T10:22:30Z').toISOString(),
    evidence_snippet: 'While there are some risks involved, they\'re minimal compared to the potential upside. Most clients don\'t worry about them.',
    evidence_start_ms: 450000, // 7:30
    evidence_end_ms: 457000,   // 7:37
    model_rationale: 'Minimal risk disclosure with downplaying language: "minimal risks", "don\'t worry about them".',
    model_version: 'rules-engine-v1.0'
  }
];

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');
  
  try {
    // Clear existing demo data
    console.log('🧹 Clearing existing demo data...');
    await supabase.from('issues').delete().in('call_id', [DEMO_CALL_ID, DEMO_CALL_2_ID]);
    await supabase.from('calls').delete().in('id', [DEMO_CALL_ID, DEMO_CALL_2_ID]);
    
    // Insert demo calls
    console.log('📞 Inserting demo calls...');
    const { error: callsError } = await supabase
      .from('calls')
      .insert([DEMO_CALL_DATA, DEMO_CALL_2_DATA]);
    
    if (callsError) {
      throw new Error(`Failed to insert calls: ${callsError.message}`);
    }
    
    // Insert demo issues
    console.log('⚠️  Inserting demo issues...');
    const { error: issuesError } = await supabase
      .from('issues')
      .insert([...DEMO_ISSUES, ...DEMO_ISSUES_2]);
    
    if (issuesError) {
      throw new Error(`Failed to insert issues: ${issuesError.message}`);
    }
    
    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 Created ${[DEMO_CALL_DATA, DEMO_CALL_2_DATA].length} demo calls`);
    console.log(`🚨 Created ${[...DEMO_ISSUES, ...DEMO_ISSUES_2].length} demo issues`);
    console.log('\n📋 Demo Data Summary:');
    console.log(`   Call 1 (${DEMO_CALL_ID}): Risk Score ${DEMO_CALL_DATA.risk_score}% - ${DEMO_ISSUES.length} issues`);
    console.log(`   Call 2 (${DEMO_CALL_2_ID}): Risk Score ${DEMO_CALL_2_DATA.risk_score}% - ${DEMO_ISSUES_2.length} issues`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

async function clearDemoData() {
  console.log('🧹 Clearing demo data...');
  
  try {
    await supabase.from('issues').delete().in('call_id', [DEMO_CALL_ID, DEMO_CALL_2_ID]);
    await supabase.from('calls').delete().in('id', [DEMO_CALL_ID, DEMO_CALL_2_ID]);
    console.log('✅ Demo data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedDemoData();
    break;
  case 'clear':
    clearDemoData();
    break;
  default:
    console.log('Usage: npm run seed-demo [seed|clear]');
    console.log('  seed  - Insert demo data into database');
    console.log('  clear - Remove demo data from database');
    process.exit(1);
}

// Export for use in other files
export { DEMO_CALL_ID, DEMO_CALL_2_ID, DEMO_CALL_DATA, DEMO_CALL_2_DATA, DEMO_ISSUES, DEMO_ISSUES_2 };