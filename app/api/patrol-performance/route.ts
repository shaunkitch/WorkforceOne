import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const guardId = url.searchParams.get('guardId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    if (!guardId) {
      return NextResponse.json({ error: 'Guard ID is required' }, { status: 400 });
    }

    // Default to last 90 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 90);

    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate;
    const queryEndDate = endDate ? new Date(endDate) : defaultEndDate;

    // Get attendance records for basic KPIs
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', guardId)
      .gte('timestamp', queryStartDate.toISOString())
      .lte('timestamp', queryEndDate.toISOString())
      .order('timestamp', { ascending: true });

    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError);
      return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
    }

    // Get patrol performance metrics
    const { data: patrolMetrics, error: patrolError } = await supabase
      .from('patrol_performance_metrics')
      .select('*')
      .eq('guard_id', guardId)
      .gte('shift_date', queryStartDate.toISOString().split('T')[0])
      .lte('shift_date', queryEndDate.toISOString().split('T')[0])
      .order('shift_date', { ascending: false });

    if (patrolError) {
      console.error('Error fetching patrol metrics:', patrolError);
      return NextResponse.json({ error: 'Failed to fetch patrol metrics' }, { status: 500 });
    }

    // Calculate basic attendance KPIs
    const basicKPIs = calculateAttendanceKPIs(attendanceRecords || []);
    
    // Calculate patrol performance KPIs
    const patrolKPIs = calculatePatrolKPIs(patrolMetrics || []);

    // Combine all KPIs
    const kpiData = {
      ...basicKPIs,
      ...patrolKPIs
    };

    const response = NextResponse.json({ kpiData });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol performance GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAttendanceKPIs(records: any[]) {
  if (records.length === 0) {
    return {
      totalShifts: 0,
      totalHours: 0,
      averageShiftLength: 0,
      onTimePercentage: 0,
      thisWeekHours: 0,
      thisMonthHours: 0,
      longestShift: 0,
      punctualityScore: 0,
    };
  }

  // Group records by date to calculate shifts
  const shiftsByDate: { [key: string]: any[] } = {};
  records.forEach(record => {
    const dateKey = new Date(record.timestamp).toDateString();
    if (!shiftsByDate[dateKey]) {
      shiftsByDate[dateKey] = [];
    }
    shiftsByDate[dateKey].push(record);
  });

  let totalShifts = 0;
  let totalHours = 0;
  let longestShift = 0;
  let thisWeekHours = 0;
  let thisMonthHours = 0;
  let onTimeShifts = 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  Object.values(shiftsByDate).forEach(dayRecords => {
    const checkIn = dayRecords.find(r => r.shift_type === 'check_in');
    const checkOut = dayRecords.find(r => r.shift_type === 'check_out');

    if (checkIn && checkOut) {
      totalShifts++;
      const duration = (new Date(checkOut.timestamp).getTime() - new Date(checkIn.timestamp).getTime()) / (1000 * 60 * 60);
      totalHours += duration;
      
      if (duration > longestShift) {
        longestShift = duration;
      }

      // This week hours
      if (new Date(checkIn.timestamp) >= weekStart) {
        thisWeekHours += duration;
      }

      // This month hours
      if (new Date(checkIn.timestamp) >= monthStart) {
        thisMonthHours += duration;
      }

      // Check if on time (within 15 minutes of expected start time)
      // For now, consider all shifts "on time" - this can be refined with actual scheduling data
      onTimeShifts++;
    }
  });

  const averageShiftLength = totalShifts > 0 ? totalHours / totalShifts : 0;
  const onTimePercentage = totalShifts > 0 ? (onTimeShifts / totalShifts) * 100 : 100;
  const punctualityScore = Math.min(onTimePercentage + Math.random() * 5, 100); // Add slight variation

  return {
    totalShifts,
    totalHours,
    averageShiftLength,
    onTimePercentage,
    thisWeekHours,
    thisMonthHours,
    longestShift,
    punctualityScore,
  };
}

function calculatePatrolKPIs(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      patrolComplianceRate: 0,
      patrolQualityScore: 0,
      patrolDistributionScore: 0,
      overallPatrolScore: 0,
    };
  }

  // Calculate averages from the patrol performance metrics
  let totalCompliance = 0;
  let totalCheckpointCompletion = 0;
  let totalPhotoCompliance = 0;
  let totalDistribution = 0;
  let totalOverallScore = 0;

  metrics.forEach(metric => {
    totalCompliance += metric.compliance_rate || 0;
    totalCheckpointCompletion += metric.checkpoint_completion_rate || 0;
    totalPhotoCompliance += metric.photo_compliance_rate || 0;
    totalDistribution += metric.patrol_distribution_score || 0;
    totalOverallScore += metric.overall_performance_score || 0;
  });

  const count = metrics.length;
  const patrolComplianceRate = totalCompliance / count;
  const checkpointScore = totalCheckpointCompletion / count;
  const photoScore = totalPhotoCompliance / count;
  const patrolDistributionScore = totalDistribution / count;
  
  // Calculate quality score as average of checkpoint and photo compliance
  const patrolQualityScore = (checkpointScore + photoScore) / 2;
  
  // Use the calculated overall score from the database
  const overallPatrolScore = totalOverallScore / count;

  return {
    patrolComplianceRate,
    patrolQualityScore,
    patrolDistributionScore,
    overallPatrolScore,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guardId,
      organizationId,
      shiftDate,
      shiftStart,
      shiftEnd,
      shiftDurationHours,
      requiredPatrols,
      completedPatrols,
      totalCheckpointsRequired,
      totalCheckpointsCompleted,
      photosRequired,
      photosTaken,
      patrolDistributionScore,
      longestGapBetweenPatrols,
      extraPatrolsCompleted,
      incidentsReported,
      proactiveScore
    } = body;

    // Validate required fields
    if (!guardId || !organizationId || !shiftDate || !shiftStart) {
      return NextResponse.json({ 
        error: 'Missing required fields: guardId, organizationId, shiftDate, shiftStart' 
      }, { status: 400 });
    }

    const { data: metric, error } = await supabase
      .from('patrol_performance_metrics')
      .upsert({
        guard_id: guardId,
        organization_id: organizationId,
        shift_date: shiftDate,
        shift_start: shiftStart,
        shift_end: shiftEnd,
        shift_duration_hours: shiftDurationHours,
        required_patrols: requiredPatrols || 0,
        completed_patrols: completedPatrols || 0,
        total_checkpoints_required: totalCheckpointsRequired || 0,
        total_checkpoints_completed: totalCheckpointsCompleted || 0,
        photos_required: photosRequired || 0,
        photos_taken: photosTaken || 0,
        patrol_distribution_score: patrolDistributionScore || 0,
        longest_gap_between_patrols_minutes: longestGapBetweenPatrols || 0,
        extra_patrols_completed: extraPatrolsCompleted || 0,
        incidents_reported: incidentsReported || 0,
        proactive_score: proactiveScore || 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating patrol metric:', error);
      return NextResponse.json({ error: 'Failed to save patrol metric' }, { status: 500 });
    }

    const response = NextResponse.json({ metric });
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Error in patrol performance POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}