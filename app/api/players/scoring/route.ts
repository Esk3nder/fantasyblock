import { NextResponse } from 'next/server';
import { fetchScoringSettings } from '@/lib/services/google-sheets';

export async function GET() {
  try {
    const settings = await fetchScoringSettings();
    
    return NextResponse.json({
      settings,
      count: settings.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/players/scoring:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch scoring settings' },
      { status: 500 }
    );
  }
}