import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/admin/snapshot-cleanup
 *
 * Deletes channel_snapshots rows older than `retain_days` (default: 90).
 * Safe to call manually or on a schedule — runs a single DELETE with a
 * date filter and returns a summary of what was pruned.
 *
 * Body (optional JSON):
 *   { retain_days: number }  — how many days of history to keep (min: 30)
 *
 * Returns:
 *   { deleted: number, remaining: number, oldest_remaining: string | null }
 */
export async function POST(request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    // Parse optional body
    let retain_days = 90;
    try {
      const body = await request.json();
      if (body?.retain_days && typeof body.retain_days === 'number') {
        retain_days = Math.max(30, Math.min(365, body.retain_days)); // clamp 30–365
      }
    } catch {
      // No body or invalid JSON — use default
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retain_days);

    // Count rows before deletion
    const beforeRes = await client.query(
      `SELECT COUNT(*) AS total FROM channel_snapshots;`
    );
    const totalBefore = parseInt(beforeRes.rows[0].total, 10);

    // Delete old rows
    const deleteRes = await client.query(
      `DELETE FROM channel_snapshots WHERE captured_at < $1;`,
      [cutoffDate]
    );
    const deleted = deleteRes.rowCount ?? 0;

    // Count rows and find oldest remaining after deletion
    const afterRes = await client.query(
      `SELECT COUNT(*) AS total, MIN(captured_at) AS oldest FROM channel_snapshots;`
    );
    const remaining = parseInt(afterRes.rows[0].total, 10);
    const oldest_remaining = afterRes.rows[0].oldest ?? null;

    console.log(
      `[Snapshot Cleanup] Pruned ${deleted} rows older than ${retain_days} days. ` +
      `${remaining} rows remain. Oldest: ${oldest_remaining}`
    );

    return NextResponse.json({
      success: true,
      retain_days,
      cutoff_date: cutoffDate.toISOString(),
      deleted,
      total_before: totalBefore,
      remaining,
      oldest_remaining,
    });

  } catch (error: any) {
    console.error('[Snapshot Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}

/**
 * GET /api/admin/snapshot-cleanup
 *
 * Returns current stats on the channel_snapshots table without deleting anything.
 * Useful for checking how large the table has grown before running a cleanup.
 */
export async function GET(_request: NextRequest) {
  let client;
  try {
    client = await pool.connect();

    const statsRes = await client.query(`
      SELECT
        COUNT(*)                                         AS total_rows,
        MIN(captured_at)                                 AS oldest_snapshot,
        MAX(captured_at)                                 AS newest_snapshot,
        COUNT(DISTINCT DATE(captured_at))                AS distinct_days,
        pg_size_pretty(pg_total_relation_size('channel_snapshots')) AS table_size
      FROM channel_snapshots;
    `);

    const row = statsRes.rows[0];
    return NextResponse.json({
      total_rows: parseInt(row.total_rows, 10),
      oldest_snapshot: row.oldest_snapshot,
      newest_snapshot: row.newest_snapshot,
      distinct_days: parseInt(row.distinct_days, 10),
      table_size: row.table_size,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Stats query failed', details: error.message },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
