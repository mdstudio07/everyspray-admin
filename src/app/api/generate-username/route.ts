import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================
// USERNAME GENERATION ENDPOINT
// =====================================

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Call the database function to generate username
    const { data, error } = await supabase.rpc('generate_username_from_email', {
      p_email: email,
    } as never);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to generate username' },
        { status: 500 }
      );
    }

    // Return generated username
    return NextResponse.json({
      username: data as string,
      email,
    });
  } catch (error) {
    console.error('Username generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
